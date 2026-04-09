// Supabase Edge Function: challenge-tick
//
// Runs daily on a Supabase cron schedule. Three jobs, all idempotent:
//
//   A. Reminders. Any invitee who hasn't responded in 23+ hours on
//      a still-pending challenge gets a nudge push. Reminders stop
//      the moment the invitee accepts/declines OR the challenge
//      leaves 'pending' (creator started it or it was cancelled).
//
//   B. Auto-start / auto-cancel. When a challenge's auto_start_at
//      timestamp has passed:
//        - If at least 2 joined participants exist (creator + 1+
//          acceptance), flip to 'active' and fire "challenge
//          started" pushes to everyone joined.
//        - Else (zero accepts from invitees), flip to 'cancelled'
//          and push "nobody accepted" to the creator.
//
//   C. End detection. For 'active' challenges whose end_date has
//      passed, compute the winner from joined participants'
//      percent improvement (Epley e1RM baseline vs final) and
//      flip to 'completed'. Participants who quit (status='left')
//      score 0 — forfeit. Ties leave winner_id null.
//
// Requires these env vars (same as send-push):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY
//
// Schedule: daily is fine, even multiple times a day is fine — the
// branches only touch rows in the exact states they need, so
// repeated runs are safe.

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function improvementPct(baseline: number | null, final: number | null): number {
  if (!baseline || baseline <= 0) return 0;
  if (final == null) return 0;
  return ((final - baseline) / baseline) * 100;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const sbUrl  = Deno.env.get('SUPABASE_URL') ?? '';
  const svcKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const pubKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';

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

  const pushUrl     = `${sbUrl}/functions/v1/bright-processor`;
  const pushHeaders = { 'content-type': 'application/json', 'apikey': pubKey || svcKey };

  // Fire a challenge push via the existing bright-processor. When
  // challengeId is provided, we pass it as `sid: "c:<uuid>"` so the
  // Android TWA's native service (which appends sid as ?signal_id=
  // to the deep-link URL) can carry it through without a native
  // code change. The client side detects the "c:" prefix and routes
  // the tap straight to the challenge detail sheet.
  async function firePush(toUid: string, title: string, body: string, challengeId?: string): Promise<string | null> {
    try {
      const payload: Record<string, string> = {
        to_uid: toUid,
        title,
        body,
        type: 'challenge',
      };
      if (challengeId) payload.sid = 'c:' + challengeId;
      await fetch(pushUrl, {
        method: 'POST',
        headers: pushHeaders,
        body: JSON.stringify(payload)
      });
      return null;
    } catch (e) {
      return String(e);
    }
  }

  async function fetchUser(uid: string): Promise<{ username?: string; display_name?: string } | null> {
    try {
      const r = await fetch(
        `${sbUrl}/rest/v1/users?id=eq.${uid}&select=id,username,display_name`,
        { headers }
      );
      if (!r.ok) return null;
      const rows = await r.json();
      return rows && rows[0] ? rows[0] : null;
    } catch (_) { return null; }
  }
  function labelFor(u: { username?: string; display_name?: string } | null): string {
    if (!u) return 'Someone';
    return u.username || u.display_name || 'Someone';
  }

  const nowIso  = new Date().toISOString();
  const nowMs   = Date.now();
  const report: any = { reminders: 0, autoStarted: 0, autoCancelled: 0, completed: 0, errors: [] as any[] };

  // ─────────────────────────────────────────────────────────────
  // A. REMINDERS
  //    Find invited rows on pending challenges where last reminder
  //    was ≥23h ago (or never). Fire a nudge push + update the
  //    last_reminded_at timestamp.
  // ─────────────────────────────────────────────────────────────
  try {
    const cutoff = new Date(nowMs - 23 * 60 * 60 * 1000).toISOString();
    // Get all pending challenges first (cheap), then their invited
    // rows. A single nested query would be cleaner but PostgREST
    // filters are simpler when split.
    const pendingRes = await fetch(
      `${sbUrl}/rest/v1/challenges?status=eq.pending&challenge_type=eq.one_rep_max&select=id,challenger_id`,
      { headers }
    );
    if (!pendingRes.ok) throw new Error('pending query failed: ' + await pendingRes.text());
    const pendingChs: any[] = await pendingRes.json();
    if (pendingChs.length) {
      const pendingIds = pendingChs.map(c => `"${c.id}"`).join(',');
      const invitedRes = await fetch(
        `${sbUrl}/rest/v1/challenge_participants?challenge_id=in.(${pendingIds})&status=eq.invited&or=(last_reminded_at.is.null,last_reminded_at.lt.${encodeURIComponent(cutoff)})&select=id,challenge_id,user_id,last_reminded_at`,
        { headers }
      );
      if (!invitedRes.ok) throw new Error('invited query failed: ' + await invitedRes.text());
      const invitedRows: any[] = await invitedRes.json();

      // Pre-fetch creator labels.
      const creatorIds = Array.from(new Set(pendingChs.map(c => c.challenger_id)));
      const creatorLabelById: Record<string, string> = {};
      for (const cid of creatorIds) {
        const u = await fetchUser(cid);
        creatorLabelById[cid] = labelFor(u);
      }
      const chById: Record<string, any> = {};
      pendingChs.forEach(c => { chById[c.id] = c; });

      for (const row of invitedRows) {
        const ch = chById[row.challenge_id];
        if (!ch) continue;
        const creatorLabel = creatorLabelById[ch.challenger_id] || 'Someone';
        const pushErr = await firePush(row.user_id, creatorLabel + ' is waiting on you', 'Tap to accept the 1RM challenge.', row.challenge_id);
        if (pushErr) { report.errors.push({ reminder: true, id: row.id, detail: pushErr }); }
        // Stamp the row whether or not the push succeeded — we don't
        // want to retry pushes multiple times per day on error.
        await fetch(
          `${sbUrl}/rest/v1/challenge_participants?id=eq.${row.id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ last_reminded_at: nowIso })
          }
        );
        report.reminders++;
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'reminders', detail: String(e) });
  }

  // ─────────────────────────────────────────────────────────────
  // B. AUTO-START / AUTO-CANCEL
  //    Pending challenges whose auto_start_at has passed. If 2+
  //    joined participants exist, flip to active. Else cancel.
  // ─────────────────────────────────────────────────────────────
  try {
    const dueRes = await fetch(
      `${sbUrl}/rest/v1/challenges?status=eq.pending&challenge_type=eq.one_rep_max&auto_start_at=not.is.null&auto_start_at=lt.${encodeURIComponent(nowIso)}&select=*`,
      { headers }
    );
    if (!dueRes.ok) throw new Error('auto-start query failed: ' + await dueRes.text());
    const dueChs: any[] = await dueRes.json();

    for (const ch of dueChs) {
      const partsRes = await fetch(
        `${sbUrl}/rest/v1/challenge_participants?challenge_id=eq.${ch.id}&select=*`,
        { headers }
      );
      const parts: any[] = partsRes.ok ? await partsRes.json() : [];
      const joined = parts.filter(p => p.status === 'joined');

      if (joined.length >= 2) {
        // Auto-start.
        const now = new Date();
        const end = new Date(now.getTime() + (ch.duration_weeks || 5) * 7 * 24 * 60 * 60 * 1000);
        const upd = await fetch(
          `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ status: 'active', start_date: now.toISOString(), end_date: end.toISOString() })
          }
        );
        if (!upd.ok) { report.errors.push({ id: ch.id, phase: 'auto-start', detail: await upd.text() }); continue; }
        report.autoStarted++;
        for (const p of joined) {
          await firePush(p.user_id, 'Challenge started', 'The 1RM clock is running. Go get it.', ch.id);
        }
      } else {
        // Auto-cancel — nobody accepted.
        const upd = await fetch(
          `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ status: 'cancelled' })
          }
        );
        if (!upd.ok) { report.errors.push({ id: ch.id, phase: 'auto-cancel', detail: await upd.text() }); continue; }
        report.autoCancelled++;
        await firePush(ch.challenger_id, 'Nobody accepted your challenge', 'No takers this time. Invite a different crew?', ch.id);
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'auto-start', detail: String(e) });
  }

  // ─────────────────────────────────────────────────────────────
  // C. END DETECTION
  //    Active challenges whose end_date has passed. Compute winner
  //    across N joined participants; forfeits (status='left') score
  //    0. Ties leave winner_id null.
  // ─────────────────────────────────────────────────────────────
  try {
    const endedRes = await fetch(
      `${sbUrl}/rest/v1/challenges?status=eq.active&challenge_type=eq.one_rep_max&end_date=lt.${encodeURIComponent(nowIso)}&select=*`,
      { headers }
    );
    if (!endedRes.ok) throw new Error('ended query failed: ' + await endedRes.text());
    const endedChs: any[] = await endedRes.json();

    for (const ch of endedChs) {
      const partsRes = await fetch(
        `${sbUrl}/rest/v1/challenge_participants?challenge_id=eq.${ch.id}&select=*`,
        { headers }
      );
      const parts: any[] = partsRes.ok ? await partsRes.json() : [];

      // Anyone who was a full participant at any point — joined OR
      // left — counts in the scoring. Left = 0% (forfeit). Invited /
      // declined are not counted.
      const scored = parts
        .filter(p => p.status === 'joined' || p.status === 'left')
        .map(p => ({
          user_id: p.user_id,
          status:  p.status,
          pct:     p.status === 'left' ? 0 : improvementPct(p.baseline_e1rm, p.final_e1rm)
        }));

      if (!scored.length) {
        // Nothing to score — just close the challenge.
        await fetch(
          `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ status: 'completed', winner_id: null })
          }
        );
        report.completed++;
        continue;
      }

      scored.sort((a, b) => b.pct - a.pct);
      const top = scored[0];
      const second = scored[1] || null;
      const tied = second && second.pct === top.pct;
      const winnerId = tied ? null : top.user_id;

      const upd = await fetch(
        `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'completed', winner_id: winnerId })
        }
      );
      if (!upd.ok) { report.errors.push({ id: ch.id, phase: 'end', detail: await upd.text() }); continue; }
      report.completed++;

      // Resolve lift name for notifications. Pull from the creator's
      // participant row; fall back to any participant that has one set.
      const legacyLabels: Record<string, string> = {
        squat: 'Back Squat', bench: 'Bench Press',
        deadlift: 'Deadlift', ohp: 'Overhead Press'
      };
      const creatorPart = parts.find((p: any) => p.user_id === ch.challenger_id);
      const rawLift = (creatorPart && creatorPart.exercise_name) || '';
      const liftName = legacyLabels[rawLift] || rawLift || 'challenge';

      if (tied) {
        for (const s of scored) {
          await firePush(s.user_id, 'Challenge ended in a tie', 'Nobody pulled ahead. Run it back?', ch.id);
        }
      } else {
        // Pre-fetch display names for all scored participants.
        const nameById: Record<string, string> = {};
        await Promise.all(scored.map(async s => {
          const u = await fetchUser(s.user_id);
          nameById[s.user_id] = labelFor(u);
        }));
        const winnerName = nameById[winnerId!] || 'Someone';

        for (const s of scored) {
          if (s.user_id === winnerId) {
            // Winner — list everyone they beat.
            const beaten = scored
              .filter(x => x.user_id !== winnerId)
              .map(x => nameById[x.user_id] || 'Someone');
            let beatLine = '';
            if (beaten.length === 1) {
              beatLine = 'You beat ' + beaten[0] + '.';
            } else if (beaten.length >= 2) {
              beatLine = 'You beat ' + beaten.slice(0, -1).join(', ') + ' and ' + beaten[beaten.length - 1] + '.';
            }
            await firePush(s.user_id, '\uD83E\uDD47 You won the ' + liftName + ' challenge', beatLine, ch.id);
          } else if (s.status === 'left') {
            await firePush(s.user_id, liftName + ' challenge ended', 'You quit this one. ' + winnerName + ' took the win.', ch.id);
          } else {
            // Loss — show the margin so it feels meaningful.
            const margin = (top.pct - s.pct).toFixed(1);
            await firePush(s.user_id, liftName + ' challenge complete', winnerName + ' won by ' + margin + '%. You finished at ' + s.pct.toFixed(1) + '%.', ch.id);
          }
        }
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'end', detail: String(e) });
  }

  return new Response(JSON.stringify({ ok: true, ...report }), {
    headers: { ...CORS, 'content-type': 'application/json' }
  });
});
