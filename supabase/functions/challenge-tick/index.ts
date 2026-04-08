// Supabase Edge Function: challenge-tick
//
// Runs on a schedule (set up in Supabase Dashboard -> Edge Functions ->
// Schedules) and completes any 1 Rep Max challenges whose end_date has
// passed. For each ended challenge:
//
//   1. Loads the two participant rows.
//   2. Computes each participant's improvement percentage from their
//      recorded final_e1rm vs baseline_e1rm. Missing final = 0% for
//      that participant.
//   3. Picks a winner_id (highest % wins; ties = winner_id stays null).
//   4. Updates the challenge row: status = 'completed', winner_id set.
//   5. Fires a direct push notification to each participant via the
//      existing bright-processor (send-push) function, with type =
//      'challenge' so per-type preferences are honored.
//
// Requires these env vars (same as send-push):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY
//
// Cron example (daily at 08:00 UTC):
//   0 8 * * *
// set via Supabase Dashboard -> Edge Functions -> challenge-tick ->
// Schedules. This function is safe to run more often than needed — it
// only touches challenges whose end_date < now and whose status is
// still 'active', so repeated runs are idempotent.

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Improvement % helper. Returns 0 when baseline or final is missing so
// a no-show participant always scores zero (and can't tie a no-show vs
// a positive-improvement opponent).
function improvementPct(baseline: number | null, final: number | null): number {
  if (!baseline || baseline <= 0) return 0;
  if (final == null) return 0;
  return ((final - baseline) / baseline) * 100;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const sbUrl   = Deno.env.get('SUPABASE_URL') ?? '';
  const svcKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const pubKey  = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';

  if (!sbUrl || !svcKey) {
    return new Response(JSON.stringify({ error: 'Not configured' }), {
      status: 503, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }

  const headers = {
    'apikey':        svcKey,
    'Authorization': `Bearer ${svcKey}`,
    'content-type':  'application/json',
  };

  const nowIso = new Date().toISOString();

  // 1. Pull all active 1RM challenges whose end_date has passed.
  const chRes = await fetch(
    `${sbUrl}/rest/v1/challenges?status=eq.active&challenge_type=eq.one_rep_max&end_date=lt.${encodeURIComponent(nowIso)}&select=*`,
    { headers }
  );
  if (!chRes.ok) {
    const txt = await chRes.text();
    return new Response(JSON.stringify({ error: 'challenges query failed', detail: txt }), {
      status: 500, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }
  const challenges: any[] = await chRes.json();
  if (!challenges.length) {
    return new Response(JSON.stringify({ ok: true, completed: 0 }), {
      headers: { ...CORS, 'content-type': 'application/json' }
    });
  }

  // 2. Pull the participant rows for all of these challenges in one query.
  const chIds = challenges.map(c => c.id);
  const inClause = chIds.map(id => `"${id}"`).join(',');
  const pRes = await fetch(
    `${sbUrl}/rest/v1/challenge_participants?challenge_id=in.(${inClause})&select=*`,
    { headers }
  );
  if (!pRes.ok) {
    const txt = await pRes.text();
    return new Response(JSON.stringify({ error: 'participants query failed', detail: txt }), {
      status: 500, headers: { ...CORS, 'content-type': 'application/json' }
    });
  }
  const allParts: any[] = await pRes.json();
  const partsByCh: Record<string, any[]> = {};
  for (const p of allParts) {
    if (!partsByCh[p.challenge_id]) partsByCh[p.challenge_id] = [];
    partsByCh[p.challenge_id].push(p);
  }

  // 3. Per challenge: compute winner, patch the row, fire pushes.
  let completedCount = 0;
  const errors: any[] = [];

  for (const ch of challenges) {
    const parts = partsByCh[ch.id] || [];
    let winnerId: string | null = null;
    let winnerPct = -Infinity;
    let loserId: string | null = null;
    let loserPct = -Infinity;

    // Seed with both challenger and challenged even if one never joined,
    // so a no-show still shows as 0% for scoring purposes. Missing rows
    // score 0.
    const participantIds = [ch.challenger_id, ch.challenged_id];
    for (const uid of participantIds) {
      const row = parts.find(p => p.user_id === uid);
      const pct = row ? improvementPct(row.baseline_e1rm, row.final_e1rm) : 0;
      if (pct > winnerPct) {
        loserId = winnerId; loserPct = winnerPct;
        winnerId = uid;     winnerPct = pct;
      } else if (pct > loserPct) {
        loserId = uid; loserPct = pct;
      }
    }

    // Tie → no winner recorded.
    const tied = winnerPct === loserPct;
    const finalWinnerId = tied ? null : winnerId;

    // 3a. Update the challenge row.
    const updRes = await fetch(
      `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'completed', winner_id: finalWinnerId })
      }
    );
    if (!updRes.ok) {
      errors.push({ id: ch.id, detail: await updRes.text() });
      continue;
    }
    completedCount++;

    // 3b. Fire pushes. Use the existing bright-processor (send-push)
    // function so we reuse the subscription lookup + FCM/VAPID plumbing.
    // Wrapped in try/catch so a failed push doesn't block subsequent
    // challenges.
    const pushUrl = `${sbUrl}/functions/v1/bright-processor`;
    const pushHeaders = { 'content-type': 'application/json', 'apikey': pubKey || svcKey };
    async function fireChallengePush(toUid: string, title: string, body: string) {
      try {
        await fetch(pushUrl, {
          method: 'POST',
          headers: pushHeaders,
          body: JSON.stringify({ to_uid: toUid, title, body, type: 'challenge' })
        });
      } catch (e) {
        errors.push({ id: ch.id, push: true, detail: String(e) });
      }
    }

    if (tied) {
      // Both tied → everyone gets the same tied message.
      await fireChallengePush(ch.challenger_id, 'Challenge ended in a tie', 'Nobody pulled ahead. Run it back?');
      await fireChallengePush(ch.challenged_id, 'Challenge ended in a tie', 'Nobody pulled ahead. Run it back?');
    } else {
      await fireChallengePush(winnerId!, 'You won the challenge', `You finished at ${winnerPct.toFixed(1)}% improvement.`);
      if (loserId) {
        await fireChallengePush(loserId, 'Challenge ended', 'Your challenge wrapped. Open the app to see the result.');
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, completed: completedCount, errors }), {
    headers: { ...CORS, 'content-type': 'application/json' }
  });
});
