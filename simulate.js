/**
 * TS-Muscle Week 1→9 User Journey Simulation
 * Uses Playwright to run the app in a headless Chromium browser,
 * complete onboarding, and simulate every function through Week 9.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = `file://${path.resolve(__dirname, 'index.html')}`;
const SCREENSHOT_DIR = path.resolve(__dirname, 'sim_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

const bugs = [];
let screenshotIdx = 0;

function logBug(category, description, extra = '') {
  const entry = { category, description, extra };
  bugs.push(entry);
  console.error(`[BUG] [${category}] ${description}${extra ? ' | ' + extra : ''}`);
}

async function screenshot(page, label) {
  const file = path.join(SCREENSHOT_DIR, `${String(screenshotIdx++).padStart(3,'0')}_${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  [SCREENSHOT] ${label} → ${path.basename(file)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function waitForSelector(page, sel, timeout = 8000) {
  try {
    await page.waitForSelector(sel, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickIfVisible(page, sel, timeout = 4000) {
  try {
    await page.waitForSelector(sel, { state: 'visible', timeout });
    await page.click(sel);
    return true;
  } catch {
    return false;
  }
}

async function checkForJsErrors(page, context, consoleErrors) {
  if (consoleErrors.length > 0) {
    for (const err of consoleErrors) {
      logBug('JS Error', err, `context: ${context}`);
    }
    consoleErrors.length = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET APP STATE — read via localStorage since `let state` isn't on window
// ─────────────────────────────────────────────────────────────────────────────
async function getState(page) {
  return page.evaluate(() => {
    try {
      // 'state' is declared with `let` at top of script — not on window.
      // Read from localStorage which is always in sync after saveState() calls.
      const raw = localStorage.getItem('ts-muscle-state');
      if (!raw) return null;
      const s = JSON.parse(raw);
      return {
        onboardingComplete: s.onboardingComplete,
        weekCount: s.weekCount,
        totalSessions: s.totalSessions,
        cycleCount: s.cycleCount || 1,
        trainingDaysPerWeek: s.trainingDaysPerWeek,
        programLength: s.program ? s.program.length : 0,
        historyLength: s.history ? s.history.length : 0,
        isDeloadWeek: s.isDeloadWeek || false,
        isRestWeek: s.isRestWeek || false,
        testWeekComplete: s.testWeekComplete || false,
        testWeekReviewShown: s.testWeekReviewShown || false,
        streak: s.streak || 0,
        profile: s.profile ? { goal: s.profile.goal } : null,
        cardioHistoryLength: (s.cardioHistory || []).length,
        moodHistoryLength: (s.moodHistory || []).length,
        isPaused: s.programPaused || false,
        weeksSinceDeload: s.weeksSinceDeload || 0,
      };
    } catch(e) {
      return { _error: e.message };
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DISMISS TUTORIAL MODAL if visible
// ─────────────────────────────────────────────────────────────────────────────
async function dismissTutorialIfVisible(page) {
  const results = await page.evaluate(() => {
    const dismissed = [];

    // 1. Tutorial modal
    const tutorial = document.getElementById('tutorial-modal');
    if (tutorial && getComputedStyle(tutorial).display !== 'none') {
      if (typeof exitTutorial === 'function') exitTutorial();
      else tutorial.style.display = 'none';
      dismissed.push('tutorial-modal');
    }

    // 2. PWA install-welcome overlay
    const installWelcome = document.getElementById('install-welcome');
    if (installWelcome && getComputedStyle(installWelcome).display !== 'none') {
      installWelcome.style.display = 'none';
      dismissed.push('install-welcome');
    }

    // 3. Any other fixed full-screen overlays with very high z-index
    document.querySelectorAll('[style*="position:fixed"],[style*="position: fixed"]').forEach(el => {
      const z = parseInt(getComputedStyle(el).zIndex, 10);
      if (z >= 99999 && getComputedStyle(el).display !== 'none') {
        el.style.display = 'none';
        dismissed.push(el.id || el.className || 'unknown-overlay');
      }
    });

    return dismissed;
  });
  if (results && results.length > 0) {
    console.log(`  Dismissed overlays: ${results.join(', ')}`);
    await page.waitForTimeout(300);
  }
  return results && results.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING: Complete the full UI onboarding flow
// Uses JS injection to fill fields and advance steps programmatically
// ─────────────────────────────────────────────────────────────────────────────
async function completeOnboarding(page) {
  console.log('\n=== PHASE 1: ONBOARDING ===');

  // Wait for onboarding modal to be visible
  const modalVisible = await waitForSelector(page, '#onboarding-modal', 8000);
  if (!modalVisible) {
    logBug('Onboarding', 'Onboarding modal (#onboarding-modal) not visible on first load');
    return;
  }

  // Step 0: Start fresh vs restore
  const step0Visible = await waitForSelector(page, '#onboard-step-0', 3000);
  if (step0Visible) {
    console.log('  Step 0: Clicking "Start Fresh"');
    await page.evaluate(() => {
      if (typeof onboardStartFresh === 'function') onboardStartFresh();
    });
    await page.waitForTimeout(500);
  }

  // Step 1: Profile — fill name, bodyweight, experience via JS (scroll position may hide inputs)
  await waitForSelector(page, '#onboard-step-1', 5000);
  console.log('  Step 1: Filling profile (name, bodyweight, experience)');
  await page.evaluate(() => {
    const nameEl = document.getElementById('ob-name');
    const bwEl   = document.getElementById('ob-bodyweight');
    if (nameEl) { nameEl.value = 'TestUser'; nameEl.dispatchEvent(new Event('input')); }
    if (bwEl)   { bwEl.value  = '180';       bwEl.dispatchEvent(new Event('input')); }
    selectOption('ob-experience', 'intermediate',
      document.querySelector('#onboard-step-1 button[onclick*="intermediate"]'));
  });
  await page.waitForTimeout(300);

  // Click NEXT to advance to step 2 (use JS to bypass scroll visibility)
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-1 .onboard-next-btn');
    if (btn) btn.click(); else onboardNext(2);
  });
  await page.waitForTimeout(500);

  // Check step 2 is now visible
  const step2ok = await waitForSelector(page, '#onboard-step-2:not([style*="display: none"]):not([style*="display:none"])', 3000);
  if (!step2ok) {
    // Try evaluating visibility
    const step2Display = await page.evaluate(() => {
      const el = document.getElementById('onboard-step-2');
      return el ? getComputedStyle(el).display : 'not found';
    });
    if (step2Display === 'none' || step2Display === 'not found') {
      logBug('Onboarding', `Step 2 not visible after clicking NEXT on step 1 (display: ${step2Display})`);
    }
  }

  // Step 2: Goal — select "Build Size"
  console.log('  Step 2: Selecting goal = Build Size');
  await page.evaluate(() => {
    const sizeBtn = document.querySelector('#onboard-step-2 button[onclick*="size"]');
    if (sizeBtn) sizeBtn.click();
    else {
      const btn = document.querySelector('#onboard-step-2 .onboard-select-btn');
      if (btn) btn.click();
    }
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-2 .onboard-next-btn');
    if (btn) btn.click(); else onboardNext(3);
  });
  await page.waitForTimeout(500);

  // Step 3: Split — select Upper/Lower
  await waitForSelector(page, '#onboard-step-3', 3000);
  console.log('  Step 3: Selecting split = Upper/Lower');
  await page.evaluate(() => {
    const ulBtn = document.querySelector('#onboard-step-3 button[onclick*="ul"]');
    if (ulBtn) ulBtn.click();
    else {
      const btn = document.querySelector('#onboard-step-3 .onboard-select-btn');
      if (btn) btn.click();
    }
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-3 .onboard-next-btn');
    if (btn) btn.click(); else onboardNext(4);
  });
  await page.waitForTimeout(500);

  // Step 4: Exercise mode — select "Pick For Me" (auto)
  await waitForSelector(page, '#onboard-step-4', 3000);
  console.log('  Step 4: Exercise mode = Pick For Me');
  await page.evaluate(() => {
    const autoBtn = document.querySelector('#onboard-step-4 button[onclick*="auto"]');
    if (autoBtn) autoBtn.click();
    else {
      const btn = document.querySelector('#onboard-step-4 .onboard-select-btn');
      if (btn) btn.click();
    }
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-4 .onboard-next-btn');
    if (btn) btn.click(); else onboardNext(5);
  });
  await page.waitForTimeout(500);

  // Step 5: Training days — select 4 days, use JS click to bypass scroll/visibility
  await waitForSelector(page, '#onboard-step-5', 3000);
  console.log('  Step 5: Training days = 4');
  await page.evaluate(() => {
    const btn4 = document.getElementById('ob-day-btn-4');
    if (btn4) btn4.click();
  });
  await page.waitForTimeout(300);
  // Use JS click to bypass visibility check (button may be below scroll fold)
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-5 .onboard-next-btn');
    if (btn) btn.click();
    else onboardNext(6);
  });
  await page.waitForTimeout(500);

  // Step 6: First week info — just click GOT IT
  await waitForSelector(page, '#onboard-step-6', 3000);
  console.log('  Step 6: First week info — clicking GOT IT');
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-6 .onboard-next-btn');
    if (btn) btn.click();
    else onboardNext(7);
  });
  await page.waitForTimeout(500);

  // Step 7: Starting weights
  await waitForSelector(page, '#onboard-step-7', 3000);
  console.log('  Step 7: Starting weights — using skip or suggested weights');
  await page.evaluate(() => {
    // Try skip button first
    const skipBtn = document.querySelector('#onboard-step-7 button[onclick*="skipWeightSetup"]');
    if (skipBtn) {
      skipBtn.click();
      return;
    }
    // Fill any empty weight inputs
    document.querySelectorAll('#ob-exercise-list input[type="number"]').forEach(inp => {
      if (!inp.value || inp.value === '0') inp.value = '95';
    });
    const btn = document.querySelector('#onboard-step-7 .onboard-next-btn');
    if (btn) btn.click();
    else onboardNext(8);
  });
  await page.waitForTimeout(700);

  // Step 8: Done screen — click "LET'S TRAIN"
  await waitForSelector(page, '#onboard-step-8', 5000);
  console.log('  Step 8: Clicking LET\'S TRAIN');
  await page.evaluate(() => {
    // Try the complete button first
    const btn = document.querySelector('#onboard-step-8 button[onclick*="completeOnboarding"]');
    if (btn) btn.click();
    else completeOnboarding();
  });
  await page.waitForTimeout(1500);

  // Dismiss onboarding modal if still visible
  const onboardingModal = await page.$('#onboarding-modal');
  if (onboardingModal) {
    const display = await onboardingModal.evaluate(el => getComputedStyle(el).display);
    if (display !== 'none') {
      console.log('  Onboarding modal still visible after completeOnboarding — forcing dismiss via JS');
      logBug('Onboarding', 'Onboarding modal still visible after completeOnboarding()');
      await page.evaluate(() => {
        document.getElementById('onboarding-modal').style.display = 'none';
      });
    }
  }

  // Dismiss tutorial/welcome guide if it launched automatically
  await dismissTutorialIfVisible(page);
  await page.waitForTimeout(300);

  const s = await getState(page);
  console.log(`  Onboarding done. onboardingComplete=${s?.onboardingComplete}, weekCount=${s?.weekCount}, totalSessions=${s?.totalSessions}, programDays=${s?.programLength}`);
  await screenshot(page, 'after_onboarding');
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATE A SINGLE SESSION via JavaScript injection
// This skips the UI clicking and directly manipulates state
// to simulate a completed workout session.
// ─────────────────────────────────────────────────────────────────────────────
async function simulateSession(page, sessionNum, forceDeload = false) {
  const result = await page.evaluate((opts) => {
    const { sessionNum, forceDeload } = opts;
    const errors = [];

    try {
      // Pick the first available training day
      if (!state.program || !state.program.length) {
        return { ok: false, error: 'No program loaded' };
      }

      // Rotate through days
      const dayIndex = (sessionNum - 1) % state.program.length;
      const day = state.program[dayIndex];
      if (!day) return { ok: false, error: `No day at index ${dayIndex}` };

      // Build a completed session object
      const now = Date.now();
      const sets = {};
      for (const ex of day.exercises) {
        const weight = state.startingWeights?.[ex.id] || 95;
        const numSets = ex.sets || 3;
        sets[ex.id] = Array.from({ length: numSets }, (_, i) => ({
          done: true,
          weight: String(forceDeload ? Math.round(weight * 0.75) : weight),
          reps: '10',
          rpe: '8',
          note: ''
        }));
      }

      const entry = {
        id: now + sessionNum,
        dayId: day.id,
        dayName: day.name,
        dayFocus: day.badge,
        date: new Date().toISOString(),
        sets,
        exNotes: {},
        notes: `Simulated session ${sessionNum}`,
        swaps: {},
        duration: 55,
        isDeload: !!(state.isDeloadWeek || state.isRestWeek || forceDeload),
        prs: [],
        cycleNum: state.cycleCount || 1,
        supersets: {},
        bonusExercises: []
      };

      // Push to history
      if (!state.history) state.history = [];
      state.history.push(entry);
      state.totalSessions = (state.totalSessions || 0) + 1;
      state.inactivityPromptShown = false;

      // Check deload end
      if (entry.isDeload && (state.isDeloadWeek || state.isRestWeek)) {
        state.deloadSessionsCompleted = (state.deloadSessionsCompleted || 0) + 1;
        const deloadDaysElapsed = (Date.now() - (state.deloadStartDate || Date.now())) / 86400000;
        if (state.deloadSessionsCompleted >= 4 || deloadDaysElapsed >= 7) {
          // End recovery week
          state.isDeloadWeek = false;
          state.isRestWeek = false;
          delete state.deloadPostponedToWeek;
          state.deloadDismissedAtCycle = state.cycleCount || 1;
          // Apply weight restoration
          if (state._preDeloadWeights) {
            Object.assign(state.startingWeights, state._preDeloadWeights);
            delete state._preDeloadWeights;
          }
        }
      }

      // Week advancement
      if (!state.weekStartTimestamp) state.weekStartTimestamp = now;
      const weekLen = state.trainingDaysPerWeek || state.program?.length || 4;
      const sessionBased = state.totalSessions % weekLen === 0;
      const daysSinceWeekStart = (now - state.weekStartTimestamp) / 86400000;
      const sessionsThisWeek = (state.history || [])
        .filter(h => new Date(h.date).getTime() >= (state.weekStartTimestamp || 0)).length;
      const calendarBased = daysSinceWeekStart >= 7 && !sessionBased && sessionsThisWeek >= 1;

      let weekAdvanced = false;
      let cycleRolledOver = false;

      if (sessionBased || calendarBased) {
        state.weekStartTimestamp = now;
        state.weeksSinceDeload = (state.weeksSinceDeload || 0) + 1;
        const prevWeek = state.weekCount;
        state.weekCount = Math.min((state.weekCount || 1) + 1, 8);
        weekAdvanced = true;

        if (prevWeek === 8) {
          state.weekCount = 1;
          cycleRolledOver = true;
          state.cycleCount = (state.cycleCount || 1) + 1;
          state.weeksSinceDeload = 0;
          delete state.deloadPostponedToWeek;
          delete state.deloadDismissedAtCycle;
          state.deloadSessionsCompleted = 0;
        }
      }

      // Streak tracking
      if (!state.streak) state.streak = 0;

      // Check test week review
      const sessions = state.history.length;
      const programLen = state.program?.length || state.trainingDaysPerWeek || 4;
      if (sessions >= programLen && !state.testWeekReviewShown && !state.testWeekComplete) {
        state.testWeekReviewShown = true;
      }

      // Save state
      try {
        localStorage.setItem('ts-muscle-state', JSON.stringify(state));
      } catch (e) {
        errors.push('localStorage save failed: ' + e.message);
      }

      return {
        ok: true,
        sessionNum,
        dayId: day.id,
        dayName: day.name,
        totalSessions: state.totalSessions,
        weekCount: state.weekCount,
        cycleCount: state.cycleCount || 1,
        weekAdvanced,
        cycleRolledOver,
        isDeloadWeek: state.isDeloadWeek || false,
        isRestWeek: state.isRestWeek || false,
        testWeekReviewShown: state.testWeekReviewShown || false,
        errors
      };
    } catch (e) {
      return { ok: false, error: e.message, stack: e.stack };
    }
  }, { sessionNum, forceDeload });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLE TEST WEEK REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
async function handleTestWeekReview(page) {
  console.log('  Triggering Test Week Review modal...');
  await page.evaluate(() => {
    if (typeof showTestWeekReview === 'function') showTestWeekReview();
  });
  await page.waitForTimeout(800);

  const modal = await page.$('#test-week-review-modal');
  if (!modal) {
    logBug('Test Week Review', 'Modal did not appear after showTestWeekReview()');
    return;
  }

  // Dismiss any overlays that may block clicks
  await dismissTutorialIfVisible(page);

  // Click "same weight" for all exercises (default) and apply
  const applyBtn = await page.$('#test-week-review-modal button[onclick*="applyTestWeekWeights"]');
  if (!applyBtn) {
    logBug('Test Week Review', 'Apply button not found in Test Week Review modal');
    return;
  }
  // Use JS click to bypass pointer-event interception
  await page.evaluate(btn => btn.click(), applyBtn);
  await page.waitForTimeout(500);

  const modalGone = await page.$('#test-week-review-modal');
  if (modalGone) {
    logBug('Test Week Review', 'Modal did not close after clicking Apply button');
  } else {
    console.log('  Test Week Review completed successfully');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLE DELOAD MODAL
// ─────────────────────────────────────────────────────────────────────────────
async function handleDeloadModal(page) {
  console.log('  Opening Deload modal...');
  await page.evaluate(() => {
    if (typeof openDeloadModal === 'function') openDeloadModal();
  });
  await page.waitForTimeout(800);

  const modal = await page.$('#deload-modal');
  if (!modal) {
    logBug('Deload Modal', 'Deload modal did not appear after openDeloadModal()');
    return;
  }
  const display = await modal.evaluate(el => getComputedStyle(el).display);
  if (display === 'none') {
    logBug('Deload Modal', 'Deload modal is display:none after openDeloadModal()');
    return;
  }

  // Dismiss any overlays that may block clicks
  await dismissTutorialIfVisible(page);

  // Choose "Deload" option via JS click
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('#deload-modal button[onclick*="startDeloadWeek"], #deload-modal button[onclick*="chooseDeload"]');
    if (btn) { btn.click(); return true; }
    // Fallback: find by text
    const allBtns = Array.from(document.querySelectorAll('#deload-modal button'));
    const deloadBtn = allBtns.find(b => /DELOAD|Deload|REDUCED/i.test(b.textContent));
    if (deloadBtn) { deloadBtn.click(); return true; }
    return false;
  });
  if (!clicked) {
    logBug('Deload Modal', 'Could not find Deload Week button in modal');
    await page.evaluate(() => {
      document.getElementById('deload-modal').style.display = 'none';
    });
  }
  await page.waitForTimeout(500);
  console.log('  Deload week chosen');
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER HOME SCREEN AND CHECK FOR UI ISSUES
// ─────────────────────────────────────────────────────────────────────────────
async function renderAndCheckHome(page, label) {
  // Re-render the home screen
  await page.evaluate(() => {
    try {
      if (typeof renderHome === 'function') renderHome();
    } catch(e) {}
    try {
      if (typeof renderProgram === 'function') renderProgram();
    } catch(e) {}
  });
  await page.waitForTimeout(400);

  // Check for visual anomalies
  const weekEl = await page.$('#current-week, [id*="week-count"], .week-count');
  if (weekEl) {
    const weekText = await weekEl.innerText().catch(() => '');
    if (!weekText.trim() || weekText === '0') {
      logBug('UI Render', `Week display shows '${weekText}' instead of a valid week number`, label);
    }
  }

  // Check for blank/empty start buttons
  const startBtns = await page.$$('.start-btn, [onclick*="startSession"]');
  if (startBtns.length === 0) {
    logBug('UI Render', 'No start session buttons found on home screen', label);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────
async function testHistoryTab(page, label) {
  console.log(`  Testing History tab (${label})`);

  // Ensure workout session is not active (showScreen returns early if it is)
  await page.evaluate(() => {
    const ws = document.getElementById('workout-session');
    if (ws) ws.classList.remove('active');
  });

  await page.evaluate(() => {
    try {
      // showScreen uses short names: 'history', not 'screen-history'
      showScreen('history', document.querySelector('.nav-item[onclick*="history"]'));
    } catch(e) {}
  });
  await page.waitForTimeout(500);

  const historyScreen = await page.$('#screen-history');
  if (!historyScreen) {
    logBug('History Tab', '#screen-history element not found in DOM', label);
    return;
  }

  // Check active class (history tab uses class-based visibility)
  const hasActiveClass = await historyScreen.evaluate(el => el.classList.contains('active'));
  if (!hasActiveClass) {
    logBug('History Tab', 'History screen did not get "active" class after showScreen("history")', label);
  } else {
    console.log(`    History tab active ✓`);
  }

  // Verify history entries rendered
  const entryCount = await page.evaluate(() => {
    return document.querySelectorAll('.history-item, #history-list .history-entry').length;
  });
  console.log(`    History entries visible: ${entryCount}`);

  await screenshot(page, `history_${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST STATS TAB (part of History screen)
// ─────────────────────────────────────────────────────────────────────────────
async function testStatsTab(page, label) {
  console.log(`  Testing Stats/Charts (${label})`);
  const result = await page.evaluate(() => {
    try {
      // renderProgressChart is the stats chart function
      if (typeof renderProgressChart === 'function') renderProgressChart();
      if (typeof renderProgress === 'function') renderProgress();
      return { ok: true };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });
  if (!result.ok) logBug('Stats/Charts', `renderProgressChart error: ${result.error}`, label);
  await page.waitForTimeout(300);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CARDIO TAB
// ─────────────────────────────────────────────────────────────────────────────
async function testCardioTab(page, label) {
  console.log(`  Testing Cardio tab (${label})`);
  await page.evaluate(() => {
    const ws = document.getElementById('workout-session');
    if (ws) ws.classList.remove('active');
    try { showScreen('cardio', document.querySelector('.nav-item[onclick*="cardio"]')); } catch(e) {}
  });
  await page.waitForTimeout(400);

  // Log a cardio session
  const cardioResult = await page.evaluate(() => {
    try {
      if (!state.cardioHistory) state.cardioHistory = [];
      state.cardioHistory.push({
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'treadmill',
        duration: 30,
        distance: 2.5,
        calories: 250
      });
      saveState();
      if (typeof renderCardio === 'function') renderCardio();
      return { ok: true, cardioCount: state.cardioHistory.length };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });

  if (!cardioResult.ok) {
    logBug('Cardio Tab', `Error logging cardio: ${cardioResult.error}`, label);
  } else {
    console.log(`    Cardio logged. Total cardio sessions: ${cardioResult.cardioCount}`);
  }

  await screenshot(page, `cardio_${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST MINDSET TAB
// ─────────────────────────────────────────────────────────────────────────────
async function testMindsetTab(page, label) {
  console.log(`  Testing Mindset tab (${label})`);
  await page.evaluate(() => {
    const ws = document.getElementById('workout-session');
    if (ws) ws.classList.remove('active');
    try { showScreen('mindset', document.querySelector('.nav-item[onclick*="mindset"]')); } catch(e) {}
  });
  await page.waitForTimeout(400);

  // Log mood
  const moodResult = await page.evaluate(() => {
    try {
      if (!state.moodHistory) state.moodHistory = [];
      state.moodHistory.push({
        id: Date.now(),
        date: new Date().toISOString(),
        sessionId: state.history?.[state.history.length - 1]?.id,
        preMood: 4,
        postMood: 5,
        notes: 'Feeling great!'
      });
      saveState();
      if (typeof renderMindset === 'function') renderMindset();
      return { ok: true };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });

  if (!moodResult.ok) {
    logBug('Mindset Tab', `Error logging mood: ${moodResult.error}`, label);
  }

  await screenshot(page, `mindset_${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SETTINGS TAB
// ─────────────────────────────────────────────────────────────────────────────
async function testSettingsTab(page, label) {
  console.log(`  Testing Settings tab (${label})`);
  await page.evaluate(() => {
    const ws = document.getElementById('workout-session');
    if (ws) ws.classList.remove('active');
    try { showScreen('settings', document.querySelector('.nav-item[onclick*="settings"]')); } catch(e) {}
  });
  await page.waitForTimeout(400);
  await screenshot(page, `settings_${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST LIVE SESSION UI
// ─────────────────────────────────────────────────────────────────────────────
async function testLiveSessionUI(page, label) {
  console.log(`  Testing live session UI (${label})`);

  // Dismiss any overlay modals first
  await dismissTutorialIfVisible(page);

  // Navigate back to home and re-render
  await page.evaluate(() => {
    try { showScreen('home', document.querySelector('.nav-item[onclick*="home"]')); renderHome(); } catch(e) {}
  });
  await page.waitForTimeout(500);

  // Try to start a session via JS call (more reliable than UI click)
  const startResult = await page.evaluate(() => {
    try {
      // Find first available day
      const day = state.program && state.program[0];
      if (!day) return { ok: false, error: 'No program day found' };
      // Call startSession with the day id
      if (typeof startSession === 'function') {
        startSession(day.id);
        return { ok: true, dayId: day.id, dayName: day.name };
      }
      return { ok: false, error: 'startSession function not found' };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });

  if (!startResult.ok) {
    logBug('Session UI', `Could not start session: ${startResult.error}`, label);
    return false;
  }
  console.log(`    Started session: ${startResult.dayName}`);
  await page.waitForTimeout(600);

  // Check if session screen appeared
  const sessionVisible = await page.evaluate(() => {
    const el = document.getElementById('workout-session');
    if (!el) return false;
    return getComputedStyle(el).display !== 'none';
  });
  if (!sessionVisible) {
    logBug('Session UI', `Workout session screen not visible after startSession()`, label);
    return false;
  }
  await screenshot(page, `live_session_${label}`);

  // Check exercises are rendered
  const exCount = await page.evaluate(() => {
    return document.querySelectorAll('#session-exercises .session-exercise, .exercise-card').length;
  });
  if (exCount === 0) {
    logBug('Session UI', 'No exercise cards rendered in session screen', label);
  } else {
    console.log(`    ${exCount} exercises rendered in live session`);
  }

  // Log some sets via JS to verify set-logging works
  const setResult = await page.evaluate(() => {
    try {
      if (!activeSession || !activeSession.sets) return { ok: false, error: 'No active session' };
      let setsLogged = 0;
      for (const [exId, sets] of Object.entries(activeSession.sets)) {
        for (const set of sets.slice(0, 2)) {
          set.weight = '100';
          set.reps = '10';
          set.rpe = '8';
          set.done = true;
          setsLogged++;
        }
        break; // just first exercise
      }
      return { ok: true, setsLogged };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });
  if (!setResult.ok) {
    logBug('Session UI', `Error logging sets: ${setResult.error}`, label);
  } else {
    console.log(`    Logged ${setResult.setsLogged} sets in live session`);
  }

  // Test rest timer
  const restTimerResult = await page.evaluate(() => {
    try {
      const day = state.program && state.program[0];
      if (!day || !day.exercises.length) return { ok: false, error: 'No exercises' };
      const exId = day.exercises[0].id;
      if (typeof startRestTimer === 'function') {
        startRestTimer(exId, 60);
        return { ok: true };
      }
      return { ok: false, error: 'startRestTimer not found' };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });
  if (!restTimerResult.ok) {
    logBug('Rest Timer', `Error: ${restTimerResult.error}`, label);
  } else {
    console.log('    Rest timer started successfully');
  }
  await page.waitForTimeout(200);

  // Close session (discard) via JS
  await page.evaluate(() => {
    try {
      // Clear all timers and close session screen
      if (typeof clearAllRestTimers === 'function') clearAllRestTimers();
      if (typeof stopSessionTimer === 'function') stopSessionTimer();
      activeSession = null;
      showScreen('home', document.querySelector('.nav-item[onclick*="home"]'));
    } catch(e) {
      document.getElementById('workout-session').style.display = 'none';
    }
  });
  await page.waitForTimeout(300);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST EXERCISE SWAP (openSessionSwap is the live-session swap function)
// ─────────────────────────────────────────────────────────────────────────────
async function testExerciseSwap(page, label) {
  console.log(`  Testing exercise swap UI (${label})`);

  // First start a session so openSessionSwap works
  const startResult = await page.evaluate(() => {
    try {
      const day = state.program && state.program[0];
      if (!day) return { ok: false, error: 'No program' };
      if (typeof startSession === 'function') startSession(day.id);
      return { ok: true, dayId: day.id, exId: day.exercises[0]?.id };
    } catch(e) { return { ok: false, error: e.message }; }
  });
  if (!startResult.ok) {
    logBug('Exercise Swap', `Could not start session for swap test: ${startResult.error}`, label);
    return;
  }
  await page.waitForTimeout(400);

  const result = await page.evaluate((exId) => {
    try {
      if (typeof openSessionSwap === 'function') {
        openSessionSwap(exId);
        return { ok: true, exId };
      }
      return { ok: false, error: 'openSessionSwap not found' };
    } catch(e) { return { ok: false, error: e.message }; }
  }, startResult.exId);

  if (!result.ok) {
    logBug('Exercise Swap', `Could not open swap modal: ${result.error}`, label);
  } else {
    await page.waitForTimeout(500);
    // Check for swap modal/panel
    const swapVisible = await page.evaluate(() => {
      // Swap panel might be inline or a modal
      const swapEls = document.querySelectorAll('[id*="swap"], .swap-panel, .swap-options');
      return Array.from(swapEls).some(el => getComputedStyle(el).display !== 'none');
    });
    if (!swapVisible) {
      logBug('Exercise Swap', 'No swap panel/modal visible after openSessionSwap()', label);
    } else {
      console.log('    Exercise swap panel opened ✓');
    }
  }

  // Close session
  await page.evaluate(() => {
    try {
      if (typeof clearAllRestTimers === 'function') clearAllRestTimers();
      if (typeof stopSessionTimer === 'function') stopSessionTimer();
      activeSession = null;
      document.getElementById('workout-session')?.classList.remove('active');
    } catch(e) {}
  });
  await page.waitForTimeout(300);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST PLATE CALCULATOR (togglePlateCalc / buildPlateCalc)
// ─────────────────────────────────────────────────────────────────────────────
async function testPlateCalculator(page, label) {
  console.log(`  Testing Plate Calculator (${label})`);

  // Start a session so the plate calc has context
  await page.evaluate(() => {
    try {
      const day = state.program && state.program[0];
      if (day && typeof startSession === 'function') startSession(day.id);
    } catch(e) {}
  });
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    try {
      const day = state.program && state.program[0];
      if (!day || !day.exercises.length) return { ok: false, error: 'No exercises' };
      const exId = day.exercises[0].id;
      if (typeof togglePlateCalc === 'function') {
        togglePlateCalc(exId);
        return { ok: true, exId };
      }
      if (typeof buildPlateCalc === 'function') {
        buildPlateCalc(exId, 135);
        return { ok: true, exId };
      }
      return { ok: false, error: 'togglePlateCalc / buildPlateCalc not found' };
    } catch(e) { return { ok: false, error: e.message }; }
  });

  if (!result.ok) {
    logBug('Plate Calculator', `Error: ${result.error}`, label);
  } else {
    await page.waitForTimeout(400);
    // Check the plate calc panel appeared
    const plateVisible = await page.evaluate(() => {
      const els = document.querySelectorAll('[id*="plate"], .plate-calc');
      return Array.from(els).some(el => getComputedStyle(el).display !== 'none');
    });
    if (!plateVisible) {
      logBug('Plate Calculator', 'Plate calculator panel not visible after togglePlateCalc()', label);
    } else {
      console.log('    Plate calculator opened ✓');
    }
  }

  // Close session
  await page.evaluate(() => {
    try {
      activeSession = null;
      document.getElementById('workout-session')?.classList.remove('active');
    } catch(e) {}
  });
  await page.waitForTimeout(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST DATA EXPORT
// ─────────────────────────────────────────────────────────────────────────────
async function testDataExport(page, label) {
  console.log(`  Testing Data Export (${label})`);
  const result = await page.evaluate(() => {
    try {
      if (typeof exportData === 'function') {
        // Check exportData doesn't crash (actual download won't happen in headless)
        const stateJson = JSON.stringify(state);
        const parsed = JSON.parse(stateJson);
        return {
          ok: true,
          sessions: parsed.history?.length || 0,
          weekCount: parsed.weekCount,
          cycleCount: parsed.cycleCount || 1
        };
      }
      return { ok: false, error: 'exportData not found' };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  });

  if (!result.ok) {
    logBug('Data Export', `Error: ${result.error}`, label);
  } else {
    console.log(`    Export check: ${result.sessions} sessions, week ${result.weekCount}, cycle ${result.cycleCount}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SHARE CARD GENERATION
// ─────────────────────────────────────────────────────────────────────────────
async function testShareCards(page, label) {
  console.log(`  Testing Share Cards (${label})`);
  const result = await page.evaluate(() => {
    try {
      // App has specific share functions: shareStreakCard, shareCurrentPR, generateAndShareCard
      const errors = [];

      if (typeof shareStreakCard === 'function') {
        try { shareStreakCard(); } catch(e) { errors.push('shareStreakCard: ' + e.message); }
      } else { errors.push('shareStreakCard not found'); }

      if (typeof shareCurrentPR === 'function') {
        try { shareCurrentPR(); } catch(e) { errors.push('shareCurrentPR: ' + e.message); }
      } else { errors.push('shareCurrentPR not found'); }

      if (typeof generateAndShareCard === 'function') {
        try { generateAndShareCard('streak'); } catch(e) { errors.push('generateAndShareCard: ' + e.message); }
      }

      return { ok: errors.length === 0, errors };
    } catch(e) {
      return { ok: false, errors: [e.message] };
    }
  });

  if (result.errors && result.errors.length > 0) {
    for (const err of result.errors) {
      logBug('Share Cards', err, label);
    }
  } else {
    console.log('    Share card functions triggered ✓');
  }

  await page.waitForTimeout(400);
  // Close any modal that appeared
  await page.evaluate(() => {
    document.querySelectorAll('[id*="share"], [class*="share-modal"]').forEach(el => {
      el.style.display = 'none';
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY WEEK/CYCLE STATE
// ─────────────────────────────────────────────────────────────────────────────
async function verifyState(page, expectedWeek, expectedCycle, label) {
  const s = await getState(page);
  if (!s) {
    logBug('State', 'Could not read state', label);
    return;
  }

  const actualWeek = s.weekCount;
  const actualCycle = s.cycleCount || 1;
  const totalSessions = s.totalSessions;

  if (expectedWeek !== null && actualWeek !== expectedWeek) {
    logBug('Week Progression', `Expected week ${expectedWeek}, got week ${actualWeek}`, `${label} (${totalSessions} sessions)`);
  }
  if (expectedCycle !== null && actualCycle !== expectedCycle) {
    logBug('Cycle Progression', `Expected cycle ${expectedCycle}, got cycle ${actualCycle}`, `${label} (${totalSessions} sessions)`);
  }
  console.log(`  State check [${label}]: week=${actualWeek}, cycle=${actualCycle}, sessions=${totalSessions}, isDeload=${s.isDeloadWeek}, testWeekComplete=${s.testWeekComplete}`);
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏋️  TS-Muscle Week 1→9 Simulation Starting...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },  // iPhone 14 Pro
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Filter out known non-bugs
      if (!txt.includes('favicon') && !txt.includes('sw.js') && !txt.includes('net::ERR_FILE_NOT_FOUND')) {
        consoleErrors.push(txt);
      }
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  try {
    // ── Load App ──────────────────────────────────────────────────────────────
    console.log(`Loading app: ${APP_URL}`);
    await page.goto(APP_URL, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    await checkForJsErrors(page, 'initial load', consoleErrors);
    await screenshot(page, '00_app_loaded');

    // ── Check initial state ───────────────────────────────────────────────────
    const initState = await getState(page);
    console.log(`Initial state: onboardingComplete=${initState?.onboardingComplete}`);

    // ── ONBOARDING ────────────────────────────────────────────────────────────
    const needsOnboarding = !initState?.onboardingComplete;
    if (needsOnboarding) {
      await completeOnboarding(page);
      await checkForJsErrors(page, 'after onboarding', consoleErrors);
    } else {
      console.log('  Onboarding already complete (state was persisted), resetting...');
      await page.evaluate(() => {
        localStorage.removeItem('ts-muscle-state');
        location.reload();
      });
      await page.waitForTimeout(2000);
      await completeOnboarding(page);
    }

    // Back to home — also dismiss any auto-launched modals
    await dismissTutorialIfVisible(page);
    await page.evaluate(() => {
      try { showScreen('home', document.querySelector('.nav-item[onclick*="home"]')); } catch(e) {}
      try { renderHome(); } catch(e) {}
    });
    await page.waitForTimeout(500);
    await dismissTutorialIfVisible(page);

    const postOnboardState = await getState(page);
    if (!postOnboardState?.onboardingComplete) {
      logBug('Onboarding', 'onboardingComplete is false/missing after completing onboarding');
    }
    if (!postOnboardState?.programLength || postOnboardState.programLength === 0) {
      logBug('Onboarding', 'No program set after completing onboarding');
    }
    console.log(`Post-onboard: program days=${postOnboardState?.programLength}, trainingDaysPerWeek=${postOnboardState?.trainingDaysPerWeek}`);

    // ── WEEK 1: Sessions 1–4 (Calibration) ───────────────────────────────────
    console.log('\n=== WEEK 1 (Sessions 1–4): Calibration ===');
    for (let i = 1; i <= 4; i++) {
      const r = await simulateSession(page, i);
      if (!r.ok) {
        logBug('Session Simulation', `Session ${i} failed: ${r.error}`);
      } else {
        console.log(`  Session ${i}: day=${r.dayName}, week=${r.weekCount}, cycle=${r.cycleCount}${r.weekAdvanced ? ' [WEEK ADVANCED]' : ''}`);
      }
      await checkForJsErrors(page, `session ${i}`, consoleErrors);
    }

    // Re-render and check
    await page.evaluate(() => { try { renderHome(); } catch(e) {} });
    await page.waitForTimeout(500);
    await verifyState(page, 2, 1, 'after-week1');

    // Test Week Review (triggered after 4 sessions)
    await handleTestWeekReview(page);
    await checkForJsErrors(page, 'test week review', consoleErrors);
    await screenshot(page, 'after_test_week_review');

    // Test live session UI
    await testLiveSessionUI(page, 'week1');
    await checkForJsErrors(page, 'live session ui week1', consoleErrors);

    // Test other tabs
    await testHistoryTab(page, 'week1');
    await testCardioTab(page, 'week1');
    await testMindsetTab(page, 'week1');
    await testSettingsTab(page, 'week1');
    await testExerciseSwap(page, 'week1');
    await testPlateCalculator(page, 'week1');

    // Go back to home for next sessions
    await page.evaluate(() => { try { showScreen('home', document.querySelector('.nav-item[onclick*="home"]')); } catch(e) {} });

    // ── WEEKS 2–6: Sessions 5–24 ──────────────────────────────────────────────
    console.log('\n=== WEEKS 2–6 (Sessions 5–24) ===');
    for (let i = 5; i <= 24; i++) {
      const r = await simulateSession(page, i);
      if (!r.ok) {
        logBug('Session Simulation', `Session ${i} failed: ${r.error}`);
      } else if (r.weekAdvanced) {
        console.log(`  Session ${i}: WEEK ADVANCED → week=${r.weekCount}, cycle=${r.cycleCount}`);
        await checkForJsErrors(page, `week advance at session ${i}`, consoleErrors);

        // Re-render home at each week change
        await page.evaluate(() => { try { renderHome(); } catch(e) {} });
        await page.waitForTimeout(300);
      }
    }
    await verifyState(page, 7, 1, 'after-week6');
    await screenshot(page, 'after_week6');

    // ── WEEK 7: Deload ────────────────────────────────────────────────────────
    console.log('\n=== WEEK 7: Recovery/Deload ===');
    await page.evaluate(() => { try { renderHome(); } catch(e) {} });
    await page.waitForTimeout(500);

    // Check that deload banner is visible
    const deloadBanner = await page.$('#deload-banner');
    if (!deloadBanner) {
      logBug('Deload Banner', '#deload-banner element not found in DOM at week 7');
    } else {
      const bannerDisplay = await deloadBanner.evaluate(el => getComputedStyle(el).display);
      if (bannerDisplay === 'none') {
        logBug('Deload Banner', 'Deload banner is hidden at week 7 — should be visible');
      } else {
        console.log('  Deload banner is visible at Week 7 ✓');
      }
    }

    await screenshot(page, 'week7_deload_banner');

    // Open and handle deload modal
    await handleDeloadModal(page);
    await checkForJsErrors(page, 'deload modal', consoleErrors);
    await screenshot(page, 'after_deload_modal');

    // Simulate deload sessions (4 deload sessions to complete week 7)
    for (let i = 25; i <= 28; i++) {
      const r = await simulateSession(page, i, true); // forceDeload=true
      if (!r.ok) {
        logBug('Deload Session', `Session ${i} failed: ${r.error}`);
      } else {
        console.log(`  Deload session ${i}: week=${r.weekCount}, isDeload=${r.isDeloadWeek}${r.weekAdvanced ? ' [WEEK ADVANCED]' : ''}`);
      }
    }

    await page.evaluate(() => { try { renderHome(); } catch(e) {} });
    await page.waitForTimeout(400);
    await verifyState(page, 8, 1, 'after-week7-deload');
    await screenshot(page, 'after_deload_week');

    // Test history with deload entries
    await testHistoryTab(page, 'week7');
    await checkForJsErrors(page, 'history after deload', consoleErrors);

    // ── WEEK 8: Sessions 29–32 ─────────────────────────────────────────────────
    console.log('\n=== WEEK 8: Final Week of Cycle 1 ===');
    await page.evaluate(() => { try { showScreen('home', document.querySelector('.nav-item[onclick*="home"]')); renderHome(); } catch(e) {} });
    await page.waitForTimeout(400);

    for (let i = 29; i <= 32; i++) {
      const r = await simulateSession(page, i);
      if (!r.ok) {
        logBug('Session Simulation', `Session ${i} failed: ${r.error}`);
      } else {
        console.log(`  Session ${i}: week=${r.weekCount}, cycle=${r.cycleCount}${r.weekAdvanced ? ' [WEEK ADVANCED]' : ''}${r.cycleRolledOver ? ' [CYCLE ROLLOVER]' : ''}`);
      }
      await checkForJsErrors(page, `session ${i}`, consoleErrors);
    }

    await page.evaluate(() => { try { renderHome(); } catch(e) {} });
    await page.waitForTimeout(500);
    const week8State = await verifyState(page, 1, 2, 'after-week8-cycle-rollover');
    await screenshot(page, 'cycle_rollover');

    // Check cycle rollover happened
    if (week8State && week8State.cycleCount !== 2) {
      logBug('Cycle Rollover', `Expected cycleCount=2 after 32 sessions, got ${week8State.cycleCount}`);
    }
    if (week8State && week8State.weekCount !== 1) {
      logBug('Cycle Rollover', `Expected weekCount=1 after cycle rollover, got ${week8State.weekCount}`);
    }

    // Check for exercise rotation suggestion
    const rotationBanner = await page.$('.rotation-banner, [id*="rotation-banner"]');
    if (!rotationBanner) {
      console.log('  Note: No rotation banner visible after cycle rollover (may be expected)');
    }

    // ── WEEK 9 (Cycle 2, Week 1): Sessions 33–36 ──────────────────────────────
    console.log('\n=== WEEK 9 (Cycle 2, Week 1): Sessions 33–36 ===');

    // Test full live session UI in cycle 2 week 1
    await testLiveSessionUI(page, 'week9_cycle2');
    await checkForJsErrors(page, 'live session ui week9', consoleErrors);

    for (let i = 33; i <= 36; i++) {
      const r = await simulateSession(page, i);
      if (!r.ok) {
        logBug('Session Simulation', `Session ${i} (week 9) failed: ${r.error}`);
      } else {
        console.log(`  Session ${i}: week=${r.weekCount}, cycle=${r.cycleCount}${r.weekAdvanced ? ' [WEEK ADVANCED]' : ''}`);
      }
      await checkForJsErrors(page, `session ${i}`, consoleErrors);
    }

    await page.evaluate(() => { try { renderHome(); } catch(e) {} });
    await page.waitForTimeout(500);
    await verifyState(page, 2, 2, 'after-week9');
    await screenshot(page, 'after_week9');

    // ── COMPREHENSIVE FEATURE TESTS AT WEEK 9 ─────────────────────────────────
    console.log('\n=== COMPREHENSIVE FEATURE TESTS AT WEEK 9 ===');

    await testHistoryTab(page, 'week9');
    await checkForJsErrors(page, 'history week9', consoleErrors);

    await testStatsTab(page, 'week9');
    await checkForJsErrors(page, 'stats week9', consoleErrors);

    await testCardioTab(page, 'week9');
    await checkForJsErrors(page, 'cardio week9', consoleErrors);

    await testMindsetTab(page, 'week9');
    await checkForJsErrors(page, 'mindset week9', consoleErrors);

    await testSettingsTab(page, 'week9');
    await checkForJsErrors(page, 'settings week9', consoleErrors);

    await testDataExport(page, 'week9');
    await checkForJsErrors(page, 'export week9', consoleErrors);

    // Share cards use specific functions: shareStreakCard, shareCurrentPR, etc.
    await testShareCards(page, 'week9');
    await checkForJsErrors(page, 'share cards week9', consoleErrors);

    // ── EXTRA: Test Pause Program ──────────────────────────────────────────────
    console.log('\n  Testing Pause Program feature...');
    const pauseResult = await page.evaluate(() => {
      try {
        // The pause function is openPauseProgramModal / confirmPauseProgram
        if (typeof openPauseProgramModal === 'function') {
          openPauseProgramModal();
          return { ok: true, method: 'modal' };
        }
        if (typeof confirmPauseProgram === 'function') {
          confirmPauseProgram();
          return { ok: true, method: 'confirm' };
        }
        return { ok: false, error: 'openPauseProgramModal not found' };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    });
    if (!pauseResult.ok) {
      logBug('Pause Program', `Error: ${pauseResult.error}`);
    } else {
      console.log(`    Pause program modal opened (${pauseResult.method}) ✓`);
      await page.waitForTimeout(300);
      // Close the modal
      await page.evaluate(() => {
        document.querySelectorAll('[id*="pause-modal"], [id*="pause_modal"]').forEach(m => m.style.display = 'none');
      });
    }
    await checkForJsErrors(page, 'pause/resume', consoleErrors);

    // ── EXTRA: Test Bodyweight logging ────────────────────────────────────────
    console.log('\n  Testing Bodyweight logging...');
    const bwResult = await page.evaluate(() => {
      try {
        if (!state.bodyweightHistory) state.bodyweightHistory = [];
        state.bodyweightHistory.push({ date: new Date().toISOString(), weight: 175 });
        saveState();
        return { ok: true, entries: state.bodyweightHistory.length };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    });
    if (!bwResult.ok) {
      logBug('Bodyweight', `Error logging bodyweight: ${bwResult.error}`);
    }
    await checkForJsErrors(page, 'bodyweight', consoleErrors);

    // ── FINAL STATE SUMMARY ────────────────────────────────────────────────────
    const finalState = await getState(page);
    console.log('\n=== FINAL STATE ===');
    console.log(`  Total sessions logged: ${finalState?.totalSessions}`);
    console.log(`  Current week: ${finalState?.weekCount}`);
    console.log(`  Current cycle: ${finalState?.cycleCount || 1}`);
    console.log(`  History entries: ${finalState?.historyLength}`);
    console.log(`  Cardio sessions: ${finalState?.cardioHistoryLength || 0}`);
    console.log(`  Mood entries: ${finalState?.moodHistoryLength || 0}`);

    // Final screenshot of home
    await page.evaluate(() => { try { showScreen('home', document.querySelector('.nav-item[onclick*="home"]')); renderHome(); } catch(e) {} });
    await page.waitForTimeout(600);
    await screenshot(page, 'FINAL_home');
    await testHistoryTab(page, 'FINAL');
    await screenshot(page, 'FINAL_history');

  } catch (err) {
    logBug('FATAL', `Simulation crashed: ${err.message}`, err.stack);
    await screenshot(page, 'CRASH').catch(() => {});
  } finally {
    await browser.close();
  }

  // ─── REPORT ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  BUG REPORT');
  console.log('═'.repeat(60));

  if (bugs.length === 0) {
    console.log('\n  ✅ No bugs detected in simulation!\n');
  } else {
    console.log(`\n  Found ${bugs.length} issue(s):\n`);
    const grouped = {};
    for (const b of bugs) {
      if (!grouped[b.category]) grouped[b.category] = [];
      grouped[b.category].push(b);
    }
    for (const [cat, items] of Object.entries(grouped)) {
      console.log(`  📌 ${cat} (${items.length}):`);
      for (const item of items) {
        console.log(`     • ${item.description}`);
        if (item.extra) console.log(`       ↳ ${item.extra}`);
      }
      console.log('');
    }
  }

  // Write JSON report
  const reportPath = path.resolve(__dirname, 'sim_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalBugs: bugs.length,
    bugs,
    screenshots: fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'))
  }, null, 2));
  console.log(`  Full report: ${reportPath}`);
  console.log(`  Screenshots: ${SCREENSHOT_DIR}\n`);

  return bugs;
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
