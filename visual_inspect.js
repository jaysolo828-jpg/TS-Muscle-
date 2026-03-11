/**
 * TS-Muscle Visual Inspection Simulation
 * Navigates every screen, tab, modal, and sub-section of the app,
 * takes screenshots, and checks for readability / visual issues.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = `file://${path.resolve(__dirname, 'index.html')}`;
const SHOT_DIR = path.resolve(__dirname, 'visual_screenshots');
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR);

const issues = [];
let shotIdx = 0;

function logIssue(area, description, severity = 'WARN') {
  const entry = { area, description, severity };
  issues.push(entry);
  console.error(`  [${severity}] [${area}] ${description}`);
}

async function shot(page, label, fullPage = false) {
  const file = path.join(SHOT_DIR, `${String(shotIdx++).padStart(3, '0')}_${label}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log(`  📸 ${label} → ${path.basename(file)}`);
  return file;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay dismissal (same as simulate.js)
// ─────────────────────────────────────────────────────────────────────────────
async function dismissOverlays(page) {
  await page.evaluate(() => {
    const tutorial = document.getElementById('tutorial-modal');
    if (tutorial && getComputedStyle(tutorial).display !== 'none') {
      if (typeof exitTutorial === 'function') exitTutorial();
      else tutorial.style.display = 'none';
    }
    const installWelcome = document.getElementById('install-welcome');
    if (installWelcome && getComputedStyle(installWelcome).display !== 'none') {
      installWelcome.style.display = 'none';
    }
    document.querySelectorAll('[style*="position:fixed"],[style*="position: fixed"]').forEach(el => {
      const z = parseInt(getComputedStyle(el).zIndex, 10);
      if (z >= 99999 && getComputedStyle(el).display !== 'none') {
        el.style.display = 'none';
      }
    });
  });
  await page.waitForTimeout(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// Read state from localStorage
// ─────────────────────────────────────────────────────────────────────────────
async function getState(page) {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('ts-muscle-state');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual checks: contrast, overflow, truncation, empty areas
// ─────────────────────────────────────────────────────────────────────────────
async function checkVisuals(page, area) {
  const findings = await page.evaluate((areaName) => {
    const findings = [];

    // 1. Detect elements with text that overflows its container
    document.querySelectorAll('h1,h2,h3,h4,h5,p,span,button,label,div').forEach(el => {
      if (el.children.length > 3) return; // skip complex containers
      const text = el.innerText?.trim();
      if (!text || text.length < 3) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Horizontal overflow
      if (el.scrollWidth > el.offsetWidth + 2 && style.overflow !== 'scroll' && style.overflowX !== 'scroll') {
        findings.push({ type: 'overflow', el: el.id || el.className?.split(' ')[0] || el.tagName, text: text.slice(0,60) });
      }
    });

    // 2. Detect buttons/tappables smaller than 44px (accessibility)
    document.querySelectorAll('button,a,[role="button"]').forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if ((rect.height < 36 || rect.width < 36) && rect.height > 0) {
        findings.push({ type: 'small-touch-target', el: el.id || el.className?.split(' ')[0] || el.tagName, text: el.innerText?.trim().slice(0,40), h: Math.round(rect.height), w: Math.round(rect.width) });
      }
    });

    // 3. Detect very low contrast text on dark backgrounds (heuristic: very dark bg + dark text)
    document.querySelectorAll('p,span,label,div,h1,h2,h3,h4,h5,button').forEach(el => {
      const text = el.innerText?.trim();
      if (!text || text.length < 4) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const color = style.color;
      const bg = style.backgroundColor;
      // Parse rgba
      const parseColor = (s) => {
        const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      };
      const c = parseColor(color);
      const b = parseColor(bg);
      if (!c || !b) return;
      // Relative luminance
      const lum = ([r,g,bl]) => {
        const s = [r,g,bl].map(v => { v/=255; return v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; });
        return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];
      };
      const L1 = lum(c), L2 = lum(b);
      const contrast = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
      // Only flag if bg is not transparent AND contrast is very low
      if (b[0]+b[1]+b[2] > 0 && contrast < 2.5) {
        findings.push({ type: 'low-contrast', el: el.id || el.className?.split(' ')[0] || el.tagName, text: text.slice(0,50), contrast: contrast.toFixed(2), color, bg });
      }
    });

    // 4. Detect empty sections that appear to be content areas
    document.querySelectorAll('[id$="-list"],[id$="-container"],[id$="-section"]').forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const rect = el.getBoundingClientRect();
      if (rect.height < 10 || rect.width < 10) return;
      if (!el.innerText?.trim() && !el.querySelector('img,canvas,svg')) {
        findings.push({ type: 'empty-section', el: el.id || el.className });
      }
    });

    return findings;
  }, area);

  // Deduplicate and report
  const seen = new Set();
  for (const f of findings) {
    const key = `${f.type}|${f.el}|${(f.text||'').slice(0,30)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (f.type === 'overflow') {
      logIssue(area, `Text overflow in <${f.el}>: "${f.text}"`);
    } else if (f.type === 'small-touch-target') {
      logIssue(area, `Small touch target (${f.w}×${f.h}px): "${f.text}" in <${f.el}>`);
    } else if (f.type === 'low-contrast') {
      logIssue(area, `Low contrast (${f.contrast}:1): "${f.text}" in <${f.el}>`);
    } else if (f.type === 'empty-section') {
      logIssue(area, `Empty content section: #${f.el}`, 'INFO');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding — full UI flow (reuse pattern from simulate.js)
// ─────────────────────────────────────────────────────────────────────────────
async function doOnboarding(page) {
  console.log('\n━━━ PHASE 0: ONBOARDING ━━━');

  // Step 0: fresh start
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-0 button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await shot(page, 'ob_step0_fresh');
  await checkVisuals(page, 'Onboarding Step 0');

  // Step 1: profile
  await page.evaluate(() => {
    const nameEl = document.getElementById('ob-name');
    const bwEl   = document.getElementById('ob-bodyweight');
    if (nameEl) { nameEl.value = 'TestUser'; nameEl.dispatchEvent(new Event('input')); }
    if (bwEl)   { bwEl.value  = '180';       bwEl.dispatchEvent(new Event('input')); }
    const expBtn = document.querySelector('#onboard-step-1 button[onclick*="intermediate"]');
    if (expBtn) expBtn.click();
  });
  await page.waitForTimeout(400);
  await shot(page, 'ob_step1_profile');
  await checkVisuals(page, 'Onboarding Step 1 Profile');

  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-1 button[onclick*="nextStep"]') ||
                Array.from(document.querySelectorAll('#onboard-step-1 button')).find(b => b.textContent.trim().toUpperCase() === 'NEXT');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Step 2: goal
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-2 button[onclick*="hypertrophy"]') ||
                document.querySelector('#onboard-step-2 button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await shot(page, 'ob_step2_goal');
  await checkVisuals(page, 'Onboarding Step 2 Goal');

  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-2 button[onclick*="nextStep"]') ||
                Array.from(document.querySelectorAll('#onboard-step-2 button')).find(b => /next/i.test(b.textContent));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Step 3: split
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-3 button[onclick*="upper_lower"]') ||
                document.querySelector('#onboard-step-3 button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await shot(page, 'ob_step3_split');
  await checkVisuals(page, 'Onboarding Step 3 Split');

  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-3 button[onclick*="nextStep"]') ||
                Array.from(document.querySelectorAll('#onboard-step-3 button')).find(b => /next/i.test(b.textContent));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Step 4: exercise mode
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-4 button[onclick*="auto"]') ||
                document.querySelector('#onboard-step-4 button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await shot(page, 'ob_step4_mode');
  await checkVisuals(page, 'Onboarding Step 4 Exercise Mode');

  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-4 button[onclick*="nextStep"]') ||
                Array.from(document.querySelectorAll('#onboard-step-4 button')).find(b => /next/i.test(b.textContent));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Step 5: training days
  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-5 button[onclick*="4"]') ||
                document.querySelector('#onboard-step-5 button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await shot(page, 'ob_step5_days');
  await checkVisuals(page, 'Onboarding Step 5 Training Days');

  await page.evaluate(() => {
    const btn = document.querySelector('#onboard-step-5 button[onclick*="nextStep"]') ||
                Array.from(document.querySelectorAll('#onboard-step-5 button')).find(b => /next/i.test(b.textContent));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Step 6: got it
  await shot(page, 'ob_step6_firstweek', true);
  await checkVisuals(page, 'Onboarding Step 6 First Week Info');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('#onboard-step-6 button')).find(b => /got.it|next|continue/i.test(b.textContent));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Step 7: starting weights
  await shot(page, 'ob_step7_weights', true);
  await checkVisuals(page, 'Onboarding Step 7 Starting Weights');
  await page.evaluate(() => {
    const skip = Array.from(document.querySelectorAll('#onboard-step-7 button')).find(b => /skip|use.suggested|later/i.test(b.textContent));
    if (skip) { skip.click(); return; }
    const next = document.querySelector('#onboard-step-7 button[onclick*="nextStep"]') ||
                 Array.from(document.querySelectorAll('#onboard-step-7 button')).find(b => /next/i.test(b.textContent));
    if (next) next.click();
  });
  await page.waitForTimeout(600);

  // Step 8: done
  await shot(page, 'ob_step8_done');
  await checkVisuals(page, 'Onboarding Step 8 Done');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('#onboard-step-8 button')).find(b => /train|start|go/i.test(b.textContent)) ||
                document.querySelector('#onboard-step-8 button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  await dismissOverlays(page);
  await page.waitForTimeout(500);
  console.log('  Onboarding complete ✓');
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigate to a screen and screenshot
// ─────────────────────────────────────────────────────────────────────────────
async function goToScreen(page, name) {
  await page.evaluate((n) => {
    const navEl = document.querySelector(`.nav-item[onclick*="${n}"]`);
    if (typeof showScreen === 'function') showScreen(n, navEl);
  }, name);
  await page.waitForTimeout(500);
  await dismissOverlays(page);
  await page.waitForTimeout(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// Open a modal, screenshot, check, then close
// ─────────────────────────────────────────────────────────────────────────────
async function inspectModal(page, openFn, modalId, label, closeFn) {
  console.log(`  Inspecting modal: ${label}`);
  await page.evaluate(openFn);
  await page.waitForTimeout(800);

  const visible = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }, modalId);

  if (!visible) {
    logIssue(label, `Modal #${modalId} did not open`, 'WARN');
    return;
  }

  await shot(page, label.replace(/\s+/g, '_').toLowerCase());
  await checkVisuals(page, label);

  // Close
  if (closeFn) {
    await page.evaluate(closeFn);
  } else {
    await page.evaluate((id) => {
      const modal = document.getElementById(id);
      if (!modal) return;
      // Try close/cancel buttons
      const closeBtn = modal.querySelector('button[onclick*="close"],button[onclick*="Close"],button[onclick*="cancel"],button[onclick*="Cancel"]') ||
                       Array.from(modal.querySelectorAll('button')).find(b => /close|cancel|dismiss|done|×|✕/i.test(b.textContent));
      if (closeBtn) { closeBtn.click(); return; }
      modal.style.display = 'none';
    }, modalId);
  }
  await page.waitForTimeout(400);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll through entire screen and take full-page screenshot
// ─────────────────────────────────────────────────────────────────────────────
async function scrollAndInspect(page, screenName, label) {
  await goToScreen(page, screenName);

  // Scroll to top first
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  // Viewport screenshot (what user sees first)
  await shot(page, `${label}_top`);
  await checkVisuals(page, `${label} (top)`);

  // Scroll through the page
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewH = page.viewportSize().height;
  let scrollY = 0;
  let scrollStep = 0;
  while (scrollY < totalHeight - viewH) {
    scrollY = Math.min(scrollY + viewH * 0.8, totalHeight - viewH);
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(300);
    scrollStep++;
    if (scrollStep <= 3) {
      await shot(page, `${label}_scroll${scrollStep}`);
      await checkVisuals(page, `${label} (scroll ${scrollStep})`);
    }
  }

  // Full-page screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await shot(page, `${label}_fullpage`, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS screen — open each collapsible section
// ─────────────────────────────────────────────────────────────────────────────
async function inspectSettings(page) {
  console.log('\n━━━ SETTINGS SCREEN ━━━');
  await goToScreen(page, 'settings');
  await shot(page, 'settings_top');
  await checkVisuals(page, 'Settings Top');

  // Expand all accordion sections and screenshot each
  const sections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.settings-section, [onclick*="toggleSettings"], details')).map((el, i) => ({
      idx: i,
      tag: el.tagName,
      id: el.id,
      text: el.querySelector('h2,h3,summary,span')?.innerText?.trim().slice(0, 50) || ''
    }));
  });

  for (const sec of sections.slice(0, 12)) {
    await page.evaluate((s) => {
      const el = s.id
        ? document.getElementById(s.id)
        : document.querySelectorAll('.settings-section, [onclick*="toggleSettings"], details')[s.idx];
      if (!el) return;
      if (el.tagName === 'DETAILS') { el.open = true; return; }
      const header = el.querySelector('h2,h3,.settings-header,[onclick*="toggle"]');
      if (header) header.click();
    }, sec);
    await page.waitForTimeout(400);
  }

  await shot(page, 'settings_all_expanded', true);
  await checkVisuals(page, 'Settings All Expanded');

  // Full scroll
  await scrollAndInspect(page, 'settings', 'settings_scroll');
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY screen
// ─────────────────────────────────────────────────────────────────────────────
async function inspectHistory(page) {
  console.log('\n━━━ HISTORY SCREEN ━━━');
  await goToScreen(page, 'history');
  await shot(page, 'history_top');
  await checkVisuals(page, 'History');

  // Scroll
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  if (totalHeight > 900) {
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await shot(page, 'history_scroll1');
    await checkVisuals(page, 'History Scroll');
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'history_fullpage', true);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARDIO screen
// ─────────────────────────────────────────────────────────────────────────────
async function inspectCardio(page) {
  console.log('\n━━━ CARDIO SCREEN ━━━');
  await goToScreen(page, 'cardio');
  await shot(page, 'cardio_top');
  await checkVisuals(page, 'Cardio');
  await shot(page, 'cardio_fullpage', true);
}

// ─────────────────────────────────────────────────────────────────────────────
// MINDSET screen
// ─────────────────────────────────────────────────────────────────────────────
async function inspectMindset(page) {
  console.log('\n━━━ MINDSET SCREEN ━━━');
  await goToScreen(page, 'mindset');
  await shot(page, 'mindset_top');
  await checkVisuals(page, 'Mindset');
  await shot(page, 'mindset_fullpage', true);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME screen — inspect at various week states
// ─────────────────────────────────────────────────────────────────────────────
async function inspectHome(page, label) {
  console.log(`\n━━━ HOME SCREEN (${label}) ━━━`);
  await goToScreen(page, 'home');
  await page.evaluate(() => {
    try { if (typeof renderHome === 'function') renderHome(); } catch(e){}
  });
  await page.waitForTimeout(400);
  await dismissOverlays(page);
  await shot(page, `home_${label}`);
  await checkVisuals(page, `Home (${label})`);
  await shot(page, `home_${label}_fullpage`, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE SESSION screen
// ─────────────────────────────────────────────────────────────────────────────
async function inspectLiveSession(page) {
  console.log('\n━━━ LIVE SESSION SCREEN ━━━');

  // Start the first available session day
  const s = await getState(page);
  const started = await page.evaluate((state) => {
    try {
      if (!state || !state.program || !state.program[0]) return false;
      const day = state.program[0];
      if (typeof startSession === 'function') { startSession(day.id); return true; }
    } catch(e) {}
    return false;
  }, s);

  if (!started) {
    logIssue('Live Session', 'Could not start a live session', 'WARN');
    return;
  }
  await page.waitForTimeout(800);
  await dismissOverlays(page);

  // Top of session
  await shot(page, 'live_session_top');
  await checkVisuals(page, 'Live Session Top');

  // Full-page
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'live_session_fullpage', true);
  await checkVisuals(page, 'Live Session Full');

  // Scroll to exercises area
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(200);
  await shot(page, 'live_session_exercises');
  await checkVisuals(page, 'Live Session Exercises');

  // Log one set (first exercise, first input row)
  const setLogged = await page.evaluate(() => {
    const inputs = document.querySelectorAll('.set-row input[type="number"]');
    if (inputs.length >= 2) {
      inputs[0].value = '135'; inputs[0].dispatchEvent(new Event('input'));
      inputs[1].value = '10';  inputs[1].dispatchEvent(new Event('input'));
      // Click the checkbox/complete button for that row
      const row = inputs[0].closest('.set-row');
      if (row) {
        const cb = row.querySelector('input[type="checkbox"],.set-check,button[onclick*="toggleSet"]');
        if (cb) { cb.click(); return 'checkbox'; }
      }
      return 'inputs-only';
    }
    return false;
  });
  await page.waitForTimeout(400);
  if (setLogged) {
    await shot(page, 'live_session_set_logged');
    await checkVisuals(page, 'Live Session After Set Logged');
  }

  // Rest timer area
  await page.evaluate(() => {
    try { if (typeof startRestTimer === 'function') startRestTimer(90); } catch(e) {}
  });
  await page.waitForTimeout(400);
  await shot(page, 'live_session_rest_timer');

  // Notes area — scroll down
  const sessionH = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(h => window.scrollTo(0, h), sessionH);
  await page.waitForTimeout(300);
  await shot(page, 'live_session_bottom');
  await checkVisuals(page, 'Live Session Bottom / Notes');

  // Inspect plate calculator
  const exId = await page.evaluate(() => {
    const ex = document.querySelector('#session-exercises .exercise-block, #session-exercises [data-ex-id]');
    return ex ? (ex.dataset.exId || ex.id) : null;
  });
  if (exId) {
    await page.evaluate((id) => {
      try { if (typeof togglePlateCalc === 'function') togglePlateCalc(id); } catch(e) {}
    }, exId);
    await page.waitForTimeout(500);
    await shot(page, 'live_session_plate_calc');
    await checkVisuals(page, 'Plate Calculator');
    // Close
    await page.evaluate((id) => {
      try { if (typeof togglePlateCalc === 'function') togglePlateCalc(id); } catch(e) {}
    }, exId);
    await page.waitForTimeout(300);
  }

  // Inspect swap panel
  if (exId) {
    await page.evaluate((id) => {
      try { if (typeof openSessionSwap === 'function') openSessionSwap(id); } catch(e) {}
    }, exId);
    await page.waitForTimeout(600);
    await dismissOverlays(page);
    await shot(page, 'live_session_swap_panel');
    await checkVisuals(page, 'Session Swap Panel');
    await page.evaluate(() => {
      const swapPanel = document.querySelector('#swap-panel, [id*="swap"]');
      if (swapPanel) swapPanel.style.display = 'none';
      document.querySelectorAll('[style*="position:fixed"]').forEach(el => {
        if (parseInt(getComputedStyle(el).zIndex) > 100) el.style.display = 'none';
      });
    });
    await page.waitForTimeout(300);
  }

  // Exit session
  await page.evaluate(() => {
    try { if (typeof exitSessionMenu === 'function') exitSessionMenu(); } catch(e) {}
  });
  await page.waitForTimeout(600);
  await dismissOverlays(page);
  await goToScreen(page, 'home');
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS — open and inspect each one
// ─────────────────────────────────────────────────────────────────────────────
async function inspectAllModals(page) {
  console.log('\n━━━ MODALS ━━━');
  await goToScreen(page, 'home');

  // Pause Program modal
  await inspectModal(page,
    () => { try { if (typeof openPauseProgramModal === 'function') openPauseProgramModal(); } catch(e) {} },
    'pause-program-modal', 'Pause Program Modal',
    () => {
      const m = document.getElementById('pause-program-modal');
      if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /cancel|close|dismiss/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // Deload modal
  await inspectModal(page,
    () => { try { if (typeof openDeloadModal === 'function') openDeloadModal(); } catch(e) {} },
    'deload-modal', 'Deload Modal',
    () => {
      const m = document.getElementById('deload-modal'); if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /cancel|close|dismiss/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // PR Modal
  await inspectModal(page,
    () => { try { if (typeof openPRModal === 'function') openPRModal(); } catch(e) {} },
    'pr-modal', 'PR Modal',
    () => {
      const m = document.getElementById('pr-modal'); if (!m) return;
      m.style.display = 'none';
    }
  );

  // Training Days modal
  await inspectModal(page,
    () => {
      const m = document.getElementById('training-days-modal');
      if (m) m.style.display = 'flex';
    },
    'training-days-modal', 'Training Days Modal',
    () => {
      const m = document.getElementById('training-days-modal'); if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /cancel|close|dismiss/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // Split Type modal
  await inspectModal(page,
    () => {
      const m = document.getElementById('split-type-modal');
      if (m) m.style.display = 'flex';
    },
    'split-type-modal', 'Split Type Modal',
    () => {
      const m = document.getElementById('split-type-modal'); if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /cancel|close|dismiss/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // Restore Defaults modal
  await inspectModal(page,
    () => {
      const m = document.getElementById('restore-defaults-modal');
      if (m) m.style.display = 'flex';
    },
    'restore-defaults-modal', 'Restore Defaults Modal',
    () => {
      const m = document.getElementById('restore-defaults-modal'); if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /cancel|close|dismiss/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // CBT / Mindset Check-In modal
  await goToScreen(page, 'mindset');
  await inspectModal(page,
    () => { try { if (typeof openCBTModal === 'function') openCBTModal('manual'); } catch(e) {} },
    'cbt-modal', 'CBT Mindset Check-In Modal',
    () => {
      const m = document.getElementById('cbt-modal'); if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /cancel|close|dismiss|done/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // Self-Compassion modal
  await inspectModal(page,
    () => { try { if (typeof openSelfCompassionModal === 'function') openSelfCompassionModal(); } catch(e) {} },
    'self-compassion-modal', 'Self-Compassion Modal',
    () => {
      const m = document.getElementById('self-compassion-modal'); if (!m) return;
      const btn = Array.from(m.querySelectorAll('button')).find(b => /close|done|cancel/i.test(b.textContent));
      if (btn) btn.click(); else m.style.display = 'none';
    }
  );

  // Exit Session modal (simulate it being open)
  await inspectModal(page,
    () => {
      const m = document.getElementById('exit-session-modal');
      if (m) m.style.display = 'flex';
    },
    'exit-session-modal', 'Exit Session Modal',
    () => {
      const m = document.getElementById('exit-session-modal'); if (!m) return;
      m.style.display = 'none';
    }
  );

  // Tutorial modal
  await inspectModal(page,
    () => { try { if (typeof openTutorial === 'function') openTutorial(); } catch(e) {} },
    'tutorial-modal', 'Tutorial / Guide Modal',
    () => { try { if (typeof exitTutorial === 'function') exitTutorial(); } catch(e) {} }
  );

  // Install Welcome overlay
  await inspectModal(page,
    () => {
      const m = document.getElementById('install-welcome');
      if (m) m.style.display = 'flex';
    },
    'install-welcome', 'Install Welcome / PWA Prompt',
    () => {
      const m = document.getElementById('install-welcome'); if (!m) return;
      m.style.display = 'none';
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advance sessions to trigger week-state UI changes
// ─────────────────────────────────────────────────────────────────────────────
async function advanceSessions(page, count, label) {
  console.log(`  Advancing ${count} sessions for: ${label}`);
  await page.evaluate((n) => {
    for (let i = 0; i < n; i++) {
      try {
        const raw = localStorage.getItem('ts-muscle-state');
        if (!raw) break;
        const s = JSON.parse(raw);
        if (!s.program || !s.program.length) break;
        const dayIdx = (s.totalSessions || 0) % s.program.length;
        const day = s.program[dayIdx];
        // Minimal session log
        s.history = s.history || [];
        s.history.push({
          id: `sim-${Date.now()}-${i}`,
          date: new Date().toISOString(),
          dayId: day.id,
          dayLabel: day.label,
          exercises: [],
          duration: 1800,
          weekCount: s.weekCount || 1,
          cycleCount: s.cycleCount || 1,
          isDeload: s.isDeloadWeek || false,
        });
        s.totalSessions = (s.totalSessions || 0) + 1;
        // Advance week
        const tpw = s.trainingDaysPerWeek || 4;
        if (s.totalSessions % tpw === 0) {
          if ((s.weekCount || 1) >= 8) {
            s.weekCount = 1;
            s.cycleCount = (s.cycleCount || 1) + 1;
            s.isDeloadWeek = false;
          } else {
            s.weekCount = (s.weekCount || 1) + 1;
            s.isDeloadWeek = (s.weekCount === 7);
          }
        }
        localStorage.setItem('ts-muscle-state', JSON.stringify(s));
      } catch(e) {}
    }
    try {
      if (typeof loadState === 'function') loadState();
      if (typeof renderHome === 'function') renderHome();
    } catch(e) {}
  }, count);
  await page.waitForTimeout(600);
  await dismissOverlays(page);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('👁️  TS-Muscle Visual Inspection Starting...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14-style viewport
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  // Capture JS console errors as issues
  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logIssue('JS Console', msg.text(), 'INFO');
    }
  });
  page.on('pageerror', err => logIssue('Page Error', err.message, 'ERROR'));

  // Load app
  await page.goto(APP_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  await shot(page, 'app_initial_load');
  await checkVisuals(page, 'Initial Load');

  // ── Phase 0: Onboarding ──────────────────────────────────────────────────
  await doOnboarding(page);
  await page.waitForTimeout(500);
  await dismissOverlays(page);

  // ── Phase 1: Home (fresh — Week 1) ──────────────────────────────────────
  await inspectHome(page, 'week1_fresh');

  // ── Phase 2: All main screens ────────────────────────────────────────────
  await inspectHistory(page);
  await inspectCardio(page);
  await inspectMindset(page);
  await inspectSettings(page);

  // ── Phase 3: Live session UI ─────────────────────────────────────────────
  await goToScreen(page, 'home');
  await inspectLiveSession(page);

  // ── Phase 4: All modals ──────────────────────────────────────────────────
  await inspectAllModals(page);

  // ── Phase 5: Week 7 (deload state) home screen ──────────────────────────
  console.log('\n━━━ ADVANCING TO WEEK 7 (DELOAD) ━━━');
  await advanceSessions(page, 24, 'reach week 7');
  await goToScreen(page, 'home');
  await page.evaluate(() => {
    try { if (typeof renderHome === 'function') renderHome(); } catch(e) {}
  });
  await page.waitForTimeout(500);
  await dismissOverlays(page);
  await shot(page, 'home_week7_deload_banner');
  await checkVisuals(page, 'Home Week 7 Deload Banner');
  await shot(page, 'home_week7_fullpage', true);

  // ── Phase 6: Cycle rollover (Week 9 / Cycle 2) ──────────────────────────
  console.log('\n━━━ ADVANCING TO CYCLE 2 ━━━');
  await advanceSessions(page, 8, 'reach cycle 2');
  await goToScreen(page, 'home');
  await page.evaluate(() => {
    try { if (typeof renderHome === 'function') renderHome(); } catch(e) {}
  });
  await page.waitForTimeout(500);
  await dismissOverlays(page);
  await shot(page, 'home_cycle2');
  await checkVisuals(page, 'Home Cycle 2');

  // Final history
  await inspectHistory(page);

  await browser.close();

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(64));
  console.log('  VISUAL INSPECTION REPORT');
  console.log('═'.repeat(64));

  const errors  = issues.filter(i => i.severity === 'ERROR');
  const warns   = issues.filter(i => i.severity === 'WARN');
  const infos   = issues.filter(i => i.severity === 'INFO');

  // Deduplicate by description prefix
  const dedup = (arr) => {
    const seen = new Set();
    return arr.filter(i => {
      const k = i.area + '|' + i.description.slice(0, 80);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  };

  const printGroup = (label, arr) => {
    if (!arr.length) return;
    console.log(`\n  📌 ${label} (${arr.length}):`);
    dedup(arr).forEach(i => console.log(`     [${i.area}] ${i.description}`));
  };

  printGroup('ERRORS', errors);
  printGroup('WARNINGS', warns);
  printGroup('INFO / Low priority', infos);

  if (!issues.length) {
    console.log('  ✅ No visual issues detected.');
  }

  console.log(`\n  Screenshots: ${SHOT_DIR}`);
  console.log('═'.repeat(64) + '\n');

  // Write JSON report
  const reportPath = path.resolve(__dirname, 'visual_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ issues, totalShots: shotIdx }, null, 2));
  console.log(`  Full report: ${reportPath}`);
})();
