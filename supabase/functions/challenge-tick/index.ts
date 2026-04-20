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
      `${sbUrl}/rest/v1/challenges?status=eq.pending&challenge_type=in.(one_rep_max,dont_break_chain,control_the_aux,clear_your_head)&select=id,challenger_id,challenge_type`,
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
        const chType = ch.challenge_type || 'one_rep_max';
        const challengeLabel = chType === 'clear_your_head' ? 'Clear Your Head challenge' : (chType === 'control_the_aux' ? 'Control the Aux challenge' : '1RM challenge');
        const pushErr = await firePush(row.user_id, creatorLabel + ' is waiting on you', 'Tap to accept the ' + challengeLabel + '.', row.challenge_id);
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
      `${sbUrl}/rest/v1/challenges?status=eq.pending&challenge_type=in.(one_rep_max,dont_break_chain,control_the_aux,clear_your_head)&auto_start_at=not.is.null&auto_start_at=lt.${encodeURIComponent(nowIso)}&select=*`,
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
        const startBody = ch.challenge_type === 'clear_your_head'
          ? 'Clear Your Head is live. Get outside.'
          : (ch.challenge_type === 'control_the_aux'
            ? 'The aux battle is live. Start logging songs after your workouts.'
            : 'The 1RM clock is running. Go get it.');
        for (const p of joined) {
          await firePush(p.user_id, 'Challenge started', startBody, ch.id);
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

  // ─────────────────────────────────────────────────────────────
  // D. CHAIN WEEKLY EVALUATION
  //    For every active 'dont_break_chain' challenge, find the
  //    week that just ended (Mon–Sun UTC) and evaluate whether
  //    each joined participant hit their weekly_target.
  //    Strict mode: ANY miss breaks the chain.
  //    One-Strike mode: first miss is forgiven (forgiven_user_id
  //    written to chain_weeks), second distinct week with a miss
  //    breaks it. Results are written to chain_weeks (idempotent
  //    via the UNIQUE constraint on challenge_id + week_number).
  //    When the chain is broken, challenger.chain_broken_by_ids
  //    is updated and status flips to 'completed'.
  //    When the challenge's final week has been evaluated, also
  //    flip to 'completed'.
  // ─────────────────────────────────────────────────────────────
  try {
    const chainRes = await fetch(
      `${sbUrl}/rest/v1/challenges?status=eq.active&challenge_type=eq.dont_break_chain&select=*,challenge_participants(*)`,
      { headers }
    );
    if (!chainRes.ok) throw new Error('chain query failed: ' + await chainRes.text());
    const chainChs: any[] = await chainRes.json();
    report.chainWeeksEvaluated = 0;

    for (const ch of chainChs) {
      if (!ch.start_date) continue;
      const startMs = new Date(ch.start_date).getTime();
      const nowMs2 = Date.now();
      const participants: any[] = ch.challenge_participants || [];
      const joined = participants.filter((p: any) => p.status === 'joined');
      const durationWeeks = ch.duration_weeks || 8;

      // Determine which complete weeks (Mon 00:00 UTC → Sun 23:59 UTC) have
      // ended since the challenge started but haven't been recorded yet.
      // "Week 1" = first Mon on or after start_date.
      // We evaluate in chronological order.
      const startDate = new Date(ch.start_date);
      // Find first Monday >= startDate
      const startDay = startDate.getUTCDay(); // 0=Sun
      const daysToMon = startDay === 0 ? 1 : (startDay === 1 ? 0 : 8 - startDay);
      const firstMonMs = startMs + daysToMon * 86400000;

      // Fetch already-evaluated weeks for this challenge
      const evalRes = await fetch(
        `${sbUrl}/rest/v1/chain_weeks?challenge_id=eq.${ch.id}&select=week_number,forgiven_user_id`,
        { headers }
      );
      const evalledWeeks: any[] = evalRes.ok ? await evalRes.json() : [];
      const evalledNums = new Set(evalledWeeks.map((w: any) => w.week_number));
      const strikeUsed = evalledWeeks.some((w: any) => w.forgiven_user_id != null);

      for (let wk = 1; wk <= durationWeeks; wk++) {
        if (evalledNums.has(wk)) continue;
        const weekStartMs = firstMonMs + (wk - 1) * 7 * 86400000;
        const weekEndMs   = weekStartMs + 7 * 86400000;
        // Only evaluate weeks that have fully ended
        if (weekEndMs > nowMs2) break;

        const weekStartIso = new Date(weekStartMs).toISOString();
        const weekEndIso   = new Date(weekEndMs).toISOString();

        // Fetch workout signals for each joined participant within this week
        const userIds = joined.map((p: any) => p.user_id);
        if (!userIds.length) break;

        const sigRes = await fetch(
          `${sbUrl}/rest/v1/workout_signals?user_id=in.(${userIds.map((u: string) => `"${u}"`).join(',')})&created_at=gte.${encodeURIComponent(weekStartIso)}&created_at=lt.${encodeURIComponent(weekEndIso)}&signal_type=in.("started","completed")&select=user_id,created_at`,
          { headers }
        );
        const sigs: any[] = sigRes.ok ? await sigRes.json() : [];

        // Count distinct session days per user
        const sessionDaysByUser: Record<string, Set<string>> = {};
        sigs.forEach((s: any) => {
          if (!sessionDaysByUser[s.user_id]) sessionDaysByUser[s.user_id] = new Set();
          // Day key: YYYY-MM-DD UTC
          sessionDaysByUser[s.user_id].add(s.created_at.slice(0, 10));
        });

        // Identify missed users
        const missedUserIds: string[] = [];
        for (const p of joined) {
          const done = (sessionDaysByUser[p.user_id] || new Set()).size;
          const target = p.weekly_target || 3;
          if (done < target) missedUserIds.push(p.user_id);
        }

        const chainSurvived = missedUserIds.length === 0
          || (ch.chain_mode === 'one_strike' && !strikeUsed && missedUserIds.length > 0);
        const forgivenUserId = (ch.chain_mode === 'one_strike' && !strikeUsed && missedUserIds.length > 0)
          ? missedUserIds[0] : null;

        // Insert chain_weeks row (idempotent — unique constraint on challenge_id+week_number)
        const insRes = await fetch(
          `${sbUrl}/rest/v1/chain_weeks`,
          {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
            body: JSON.stringify({
              challenge_id: ch.id,
              week_number: wk,
              week_start: weekStartIso,
              week_end: weekEndIso,
              chain_survived: chainSurvived,
              missed_user_ids: missedUserIds,
              forgiven_user_id: forgivenUserId,
            })
          }
        );
        if (!insRes.ok) {
          report.errors.push({ id: ch.id, phase: 'chain-week-insert', wk, detail: await insRes.text() });
          continue;
        }

        // Update weeks_hit / weeks_total for each joined participant
        for (const p of joined) {
          const done = (sessionDaysByUser[p.user_id] || new Set()).size;
          const target = p.weekly_target || 3;
          const hit = done >= target;
          await fetch(
            `${sbUrl}/rest/v1/challenge_participants?challenge_id=eq.${ch.id}&user_id=eq.${p.user_id}`,
            {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ weeks_total: (p.weeks_total || 0) + 1, weeks_hit: (p.weeks_hit || 0) + (hit ? 1 : 0) })
            }
          );
        }

        report.chainWeeksEvaluated++;

        // Push notifications for week outcome
        if (!chainSurvived) {
          // Chain broken — notify everyone
          for (const p of joined) {
            await firePush(p.user_id, 'The chain is broken', 'Someone missed their weekly target. The streak is over.', ch.id);
          }
          // Update chain_broken_by_ids and flip to completed
          const brokenPatch = await fetch(
            `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
            {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ chain_broken_by_ids: missedUserIds, status: 'completed' })
            }
          );
          if (!brokenPatch.ok) report.errors.push({ id: ch.id, phase: 'chain-broken-patch', detail: await brokenPatch.text() });
          report.completed++;
          break; // no need to evaluate further weeks
        } else if (forgivenUserId) {
          // Strike used — warn the group
          for (const p of joined) {
            await firePush(p.user_id, 'Close call \u2014 strike used', 'Someone missed their target this week. One strike has been used. No more misses.', ch.id);
          }
        } else {
          // All good this week
          for (const p of joined) {
            await firePush(p.user_id, 'Week ' + wk + ' complete \u2714', 'Everyone hit their target. Keep the chain alive.', ch.id);
          }
        }

        // If this was the final week and chain survived, complete the challenge
        if (wk === durationWeeks && chainSurvived) {
          const donePatch = await fetch(
            `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
            {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ status: 'completed' })
            }
          );
          if (!donePatch.ok) report.errors.push({ id: ch.id, phase: 'chain-complete-patch', detail: await donePatch.text() });
          for (const p of joined) {
            await firePush(p.user_id, '\uD83C\uDF89 Chain survived!', 'You all did it. The chain held for ' + durationWeeks + ' weeks.', ch.id);
          }
          report.completed++;
        }
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'chain', detail: String(e) });
  }

  // ─────────────────────────────────────────────────────────────
  // E. CHAIN AT-RISK ALERTS
  //    On Wednesday UTC (mid-week), fire a push to any joined
  //    participant who is behind their weekly session target.
  //    Message: "You need X more sessions before Sunday."
  //    Only fires on Wednesday so each member gets at most one
  //    alert per week on a daily cron schedule.
  // ─────────────────────────────────────────────────────────────
  try {
    const nowDate = new Date();
    const isWednesday = nowDate.getUTCDay() === 3;
    if (isWednesday) {
      const atRiskRes = await fetch(
        `${sbUrl}/rest/v1/challenges?status=eq.active&challenge_type=eq.dont_break_chain&select=*,challenge_participants(*)`,
        { headers }
      );
      if (atRiskRes.ok) {
        const atRiskChs: any[] = await atRiskRes.json();
        report.atRiskAlerts = 0;

        for (const ch of atRiskChs) {
          if (!ch.start_date) continue;
          const participants: any[] = ch.challenge_participants || [];
          const joined = participants.filter((p: any) => p.status === 'joined');
          if (!joined.length) continue;

          // Current week bounds (Mon 00:00 UTC to now)
          const now2 = new Date();
          const dow = now2.getUTCDay(); // 0=Sun, 1=Mon ... 3=Wed
          const daysSinceMon = dow === 0 ? 6 : dow - 1;
          const weekStartMs = now2.getTime() - daysSinceMon * 86400000;
          const weekStartDate = new Date(weekStartMs);
          weekStartDate.setUTCHours(0, 0, 0, 0);
          const weekStartIso = weekStartDate.toISOString();

          const userIds = joined.map((p: any) => p.user_id);
          const sigRes = await fetch(
            `${sbUrl}/rest/v1/workout_signals?user_id=in.(${userIds.map((u: string) => `"${u}"`).join(',')})&created_at=gte.${encodeURIComponent(weekStartIso)}&signal_type=in.("started","completed")&select=user_id,created_at`,
            { headers }
          );
          const sigs: any[] = sigRes.ok ? await sigRes.json() : [];

          const sessionDaysByUser: Record<string, Set<string>> = {};
          sigs.forEach((s: any) => {
            if (!sessionDaysByUser[s.user_id]) sessionDaysByUser[s.user_id] = new Set();
            sessionDaysByUser[s.user_id].add(s.created_at.slice(0, 10));
          });

          for (const p of joined) {
            const done = (sessionDaysByUser[p.user_id] || new Set()).size;
            const target = p.weekly_target || 3;
            if (done >= target) continue; // on track, no alert
            const needed = target - done;
            // Days left in week: Wed=3, so Sun=0 means 4 days left (Thu/Fri/Sat/Sun)
            const daysLeft = 7 - (dow === 0 ? 7 : dow); // days until end of Sunday
            const pushErr = await firePush(
              p.user_id,
              'At risk \u2014 don\u2019t break the chain',
              'You need ' + needed + ' more ' + (needed === 1 ? 'session' : 'sessions') + ' before Sunday to keep the chain alive.',
              ch.id
            );
            if (pushErr) report.errors.push({ phase: 'at-risk', uid: p.user_id, detail: pushErr });
            else report.atRiskAlerts++;
          }
        }
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'at-risk', detail: String(e) });
  }

  // ─────────────────────────────────────────────────────────────
  // F. CYH END DETECTION
  //    Active clear_your_head challenges whose end_date has passed.
  //    Score by total minutes logged in cyh_logs across the full
  //    window. Highest total wins; ties leave winner_id null.
  // ─────────────────────────────────────────────────────────────
  try {
    const cyhEndedRes = await fetch(
      `${sbUrl}/rest/v1/challenges?status=eq.active&challenge_type=eq.clear_your_head&end_date=lt.${encodeURIComponent(nowIso)}&select=*,challenge_participants(*)`,
      { headers }
    );
    if (!cyhEndedRes.ok) throw new Error('cyh ended query failed: ' + await cyhEndedRes.text());
    const cyhEndedChs: any[] = await cyhEndedRes.json();

    for (const ch of cyhEndedChs) {
      const participants: any[] = ch.challenge_participants || [];
      const scored = participants.filter((p: any) => p.status === 'joined' || p.status === 'left');

      const logsRes = await fetch(
        `${sbUrl}/rest/v1/cyh_logs?challenge_id=eq.${ch.id}&select=user_id,minutes`,
        { headers }
      );
      const logs: any[] = logsRes.ok ? await logsRes.json() : [];
      const minutesByUser: Record<string, number> = {};
      logs.forEach((l: any) => { minutesByUser[l.user_id] = (minutesByUser[l.user_id] || 0) + (l.minutes || 0); });

      const withMins = scored.map((p: any) => ({
        user_id: p.user_id,
        status: p.status,
        mins: p.status === 'left' ? 0 : (minutesByUser[p.user_id] || 0),
      }));
      withMins.sort((a: any, b: any) => b.mins - a.mins);

      const cyhTop = withMins[0];
      const cyhSecond = withMins[1] || null;
      const cyhTied = cyhSecond && cyhSecond.mins === cyhTop.mins && cyhTop.mins > 0;
      const cyhWinnerId = !cyhTop || cyhTied ? null : cyhTop.user_id;

      const cyhUpd = await fetch(
        `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
        { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify({ status: 'completed', winner_id: cyhWinnerId }) }
      );
      if (!cyhUpd.ok) { report.errors.push({ id: ch.id, phase: 'cyh-end', detail: await cyhUpd.text() }); continue; }
      report.completed++;

      const cyhNames: Record<string, string> = {};
      await Promise.all(withMins.map(async (s: any) => { const u = await fetchUser(s.user_id); cyhNames[s.user_id] = labelFor(u); }));

      if (!withMins.length) continue;
      if (cyhTied || !cyhWinnerId) {
        for (const s of withMins) { await firePush(s.user_id, 'Clear Your Head ended in a tie', 'You all logged the same minutes. Nice work.', ch.id); }
      } else {
        const cyhWinnerName = cyhNames[cyhWinnerId] || 'Someone';
        for (const s of withMins) {
          if (s.user_id === cyhWinnerId) {
            await firePush(s.user_id, '\uD83E\uDD47 You won Clear Your Head', 'Highest total minutes. You earned it.', ch.id);
          } else {
            await firePush(s.user_id, 'Clear Your Head complete', cyhWinnerName + ' logged the most minutes. Great effort.', ch.id);
          }
        }
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'cyh-end', detail: String(e) });
  }

  // ─────────────────────────────────────────────────────────────
  // G. AUX CHALLENGE END DETECTION
  //    Active 'control_the_aux' challenges whose end_date has passed.
  //    Score: reaction received = 1 pt, use received = 5 pts.
  //    Highest score wins; tie leaves winner_id null.
  // ─────────────────────────────────────────────────────────────
  try {
    const auxEndedRes = await fetch(
      `${sbUrl}/rest/v1/challenges?status=eq.active&challenge_type=eq.control_the_aux&end_date=lt.${encodeURIComponent(nowIso)}&select=*`,
      { headers }
    );
    if (!auxEndedRes.ok) throw new Error('aux-end query failed: ' + await auxEndedRes.text());
    const auxEndedChs: any[] = await auxEndedRes.json();

    for (const ch of auxEndedChs) {
      const partsRes = await fetch(`${sbUrl}/rest/v1/challenge_participants?challenge_id=eq.${ch.id}&select=*`, { headers });
      const parts: any[] = partsRes.ok ? await partsRes.json() : [];
      const joined = parts.filter(p => p.status === 'joined' || p.status === 'left');

      const songsRes = await fetch(`${sbUrl}/rest/v1/aux_songs?challenge_id=eq.${ch.id}&select=id,user_id`, { headers });
      const songs: any[] = songsRes.ok ? await songsRes.json() : [];
      const songIds = songs.map(s => s.id);

      const scoreById: Record<string, number> = {};
      for (const p of joined) scoreById[p.user_id] = 0;

      if (songIds.length > 0) {
        const idsParam = songIds.map(id => `"${id}"`).join(',');
        const rxnRes = await fetch(`${sbUrl}/rest/v1/aux_reactions?song_id=in.(${idsParam})&select=song_id,user_id`, { headers });
        const rxns: any[] = rxnRes.ok ? await rxnRes.json() : [];
        for (const r of rxns) {
          const song = songs.find(s => s.id === r.song_id);
          if (!song || song.user_id === r.user_id) continue;
          if (scoreById[song.user_id] !== undefined) scoreById[song.user_id]++;
        }
        const usesRes = await fetch(`${sbUrl}/rest/v1/aux_uses?song_id=in.(${idsParam})&select=song_id,user_id`, { headers });
        const uses: any[] = usesRes.ok ? await usesRes.json() : [];
        for (const u of uses) {
          const song = songs.find(s => s.id === u.song_id);
          if (!song || song.user_id === u.user_id) continue;
          if (scoreById[song.user_id] !== undefined) scoreById[song.user_id] += 5;
        }
      }

      const auxScored = joined.map(p => ({ user_id: p.user_id, score: scoreById[p.user_id] || 0 }));
      auxScored.sort((a, b) => b.score - a.score);

      const auxTop = auxScored[0];
      const auxSecond = auxScored[1] || null;
      const auxTied = auxTop && auxSecond && auxSecond.score === auxTop.score;
      const auxWinnerId = (!auxTop || auxTied) ? null : auxTop.user_id;

      const auxUpd = await fetch(
        `${sbUrl}/rest/v1/challenges?id=eq.${ch.id}`,
        { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify({ status: 'completed', winner_id: auxWinnerId }) }
      );
      if (!auxUpd.ok) { report.errors.push({ id: ch.id, phase: 'aux-end', detail: await auxUpd.text() }); continue; }
      report.completed++;

      const auxNames: Record<string, string> = {};
      await Promise.all(auxScored.map(async s => { const u = await fetchUser(s.user_id); auxNames[s.user_id] = labelFor(u); }));

      if (!auxTop || auxScored.every(s => s.score === 0)) {
        for (const p of joined) { await firePush(p.user_id, 'Aux challenge over', 'No songs were reacted to. Run it back with more fire.', ch.id); }
      } else if (auxTied) {
        for (const s of auxScored) { await firePush(s.user_id, 'Aux challenge ended in a tie', 'Two aux gods, equal clout. Run it back?', ch.id); }
      } else {
        const auxWinnerName = auxNames[auxWinnerId!] || 'Someone';
        for (const s of auxScored) {
          if (s.user_id === auxWinnerId) {
            await firePush(s.user_id, '\uD83C\uDFB5 You controlled the aux', 'Your songs had the most heat. The aux is yours.', ch.id);
          } else {
            await firePush(s.user_id, 'Aux challenge complete', auxWinnerName + ' controlled the aux with ' + auxTop.score + ' pts. You scored ' + s.score + '.', ch.id);
          }
        }
      }
    }
  } catch (e) {
    report.errors.push({ phase: 'aux-end', detail: String(e) });
  }

  // ─────────────────────────────────────────────────────────────
  // H. RECOVERY WEEK END NOTIFICATIONS
  //    Find users whose rest_week_start_at is 6+ days ago and who
  //    are still flagged (column not yet cleared). Fire a push that
  //    deep-links into the recovery check-in questions, then clear
  //    the column so the notification fires only once.
  //
  //    Threshold is 6 days (not 7) so the cron fires at midnight on
  //    the day the 7-day mark falls, before the client-side auto-end
  //    in renderHome() (which runs at >= 7 days) can clear the column
  //    and cause the push to be silently skipped.
  // ─────────────────────────────────────────────────────────────
  try {
    const recoveryCutoff = new Date(nowMs - 6 * 24 * 60 * 60 * 1000).toISOString();
    const recoveryRes = await fetch(
      `${sbUrl}/rest/v1/users?rest_week_start_at=not.is.null&rest_week_start_at=lt.${encodeURIComponent(recoveryCutoff)}&select=id,rest_week_type`,
      { headers }
    );
    if (!recoveryRes.ok) throw new Error('recovery query failed: ' + await recoveryRes.text());
    const recoveryUsers: any[] = await recoveryRes.json();
    report.recoveryNotifs = 0;

    for (const user of recoveryUsers) {
      const isDeload = user.rest_week_type === 'deload';
      const title = isDeload ? 'Light week is done' : 'Rest week is done';
      await fetch(pushUrl, {
        method: 'POST',
        headers: pushHeaders,
        body: JSON.stringify({
          to_uid: user.id,
          title,
          body: 'Time to get back to it. Tap to check in.',
          type: 'recovery',
          sid: 'recovery',
        })
      });
      // Clear so this fires only once per recovery period
      await fetch(
        `${sbUrl}/rest/v1/users?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ rest_week_start_at: null, rest_week_type: null })
        }
      );
      report.recoveryNotifs++;
    }
  } catch (e) {
    report.errors.push({ phase: 'recovery', detail: String(e) });
  }

  return new Response(JSON.stringify({ ok: true, ...report }), {
    headers: { ...CORS, 'content-type': 'application/json' }
  });
});
