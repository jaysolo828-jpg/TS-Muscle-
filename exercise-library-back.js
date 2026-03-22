/**
 * T&S Muscle — Back Exercise Library
 * All back exercises across every equipment category.
 *
 * Fields:
 *   id              – lowercase-hyphenated unique identifier
 *   name            – display name
 *   muscleGroup     – primary muscle group
 *   equipment       – equipment category
 *   snapshot        – 6-8 word plain-language movement description
 *   cues            – 4 evidence-based form cues (plain language)
 *   ytUrl           – best YouTube reference
 *   goldStar        – top pick per movement pattern (one true per similarityGroup)
 *   similarityGroup – movement pattern bucket for grouping/swapping
 *   alsoInProgram   – true if this exercise appears in the default program
 *                     (cross-referenced: chest-row, pulldown, db-row, pull-through)
 */

const BACK_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-bent-over-row',
    name: 'Barbell Bent-Over Row',
    muscleGroup: 'back',
    equipment: 'Barbell',
    snapshot: 'Hinge forward and row bar to lower ribs',
    cues: [
      'Hinge to roughly 45 degrees and keep your chest up throughout',
      'Pull the bar to your lower ribcage — not your belly or upper chest',
      'Drive your elbows back and squeeze shoulder blades together at the top',
      'Keep your lower back neutral — no rounding as the weight gets heavy'
    ],
    ytUrl: 'https://youtu.be/G8l_8chR5BE',
    goldStar: true,
    similarityGroup: 'horizontal-row-barbell',
    alsoInProgram: false
  },
  {
    id: 'pendlay-row',
    name: 'Pendlay Row',
    muscleGroup: 'back',
    equipment: 'Barbell',
    snapshot: 'Dead-stop barbell row from floor each rep',
    cues: [
      'Start each rep from a dead stop on the floor — no bouncing the weight',
      'Torso is nearly parallel to the floor, more horizontal than a standard row',
      'Explode the bar to your chest using full back engagement',
      'Lower the bar all the way back to the floor under control after each rep'
    ],
    ytUrl: 'https://youtu.be/Weu9HMHdiDA',
    goldStar: false,
    similarityGroup: 'horizontal-row-barbell',
    alsoInProgram: false
  },
  {
    id: 'conventional-deadlift',
    name: 'Conventional Deadlift',
    muscleGroup: 'back',
    equipment: 'Barbell',
    snapshot: 'Lift bar from floor by extending hips and knees',
    cues: [
      'Set hips above knees but below shoulders before you pull',
      'Take the slack out of the bar by squeezing the handle before lifting',
      'Push the floor away rather than thinking about pulling the bar up',
      'Lock hips out fully at the top — do not hyperextend the lower back'
    ],
    ytUrl: 'https://youtu.be/op9kVnSso6Q',
    goldStar: true,
    similarityGroup: 'hip-hinge-barbell',
    alsoInProgram: false
  },
  {
    id: 'barbell-shrug',
    name: 'Barbell Shrug',
    muscleGroup: 'back',
    equipment: 'Barbell',
    snapshot: 'Elevate shoulders straight up to target upper traps',
    cues: [
      'Hold the bar at hip height with a shoulder-width grip',
      'Shrug straight up — no rolling the shoulders backward or forward',
      'Pause at the top for one second with full trap contraction',
      'Lower slowly over two counts rather than letting the weight drop'
    ],
    ytUrl: 'https://youtu.be/NAqCVe2mwzM',
    goldStar: true,
    similarityGroup: 'trap-shrug',
    alsoInProgram: false
  },
  {
    id: 'barbell-good-morning',
    name: 'Barbell Good Morning',
    muscleGroup: 'back',
    equipment: 'Barbell',
    snapshot: 'Hinge forward with bar on back, erectors under load',
    cues: [
      'Bar sits on your upper traps, not your neck — same as a squat',
      'Push your hips back as you hinge, maintaining a neutral spine throughout',
      'Keep a slight bend in the knees — this is a hip hinge, not a squat',
      'Return to upright by squeezing glutes and driving hips forward'
    ],
    ytUrl: 'https://youtu.be/YA-h3n9L4YU',
    goldStar: false,
    similarityGroup: 'spinal-erector-barbell',
    alsoInProgram: false
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'single-arm-db-row',
    name: 'Single-Arm Dumbbell Row',
    muscleGroup: 'back',
    equipment: 'Dumbbell',
    snapshot: 'One arm row with dumbbell, braced on bench',
    cues: [
      'Support yourself on the bench so your back is flat and parallel to the floor',
      'Pull elbow straight up past your hip — not flared out to the side',
      'Let your arm hang fully at the bottom every rep to get the full stretch',
      'Do not twist your torso to help lift — keep the movement isolated to the lat'
    ],
    ytUrl: 'https://youtu.be/sUqz6oaISkQ',
    goldStar: true,
    similarityGroup: 'horizontal-row-db',
    alsoInProgram: true   // id: 'db-row'
  },
  {
    id: 'db-bent-over-row',
    name: 'Dumbbell Bent-Over Row',
    muscleGroup: 'back',
    equipment: 'Dumbbell',
    snapshot: 'Hinge forward and row both dumbbells simultaneously',
    cues: [
      'Hinge to 45 degrees with chest up and lower back neutral',
      'Pull both dumbbells toward your lower ribs at the same time',
      'Squeeze shoulder blades together hard at the top of each rep',
      'Lower the dumbbells until arms are straight before the next rep'
    ],
    ytUrl: 'https://youtu.be/sUqz6oaISkQ',
    goldStar: false,
    similarityGroup: 'horizontal-row-db',
    alsoInProgram: false
  },
  {
    id: 'chest-supported-db-row',
    name: 'Chest-Supported Dumbbell Row',
    muscleGroup: 'back',
    equipment: 'Dumbbell',
    snapshot: 'Row dumbbells lying chest-down on incline bench',
    cues: [
      'Set the bench to 30-45 degrees and lie face-down so your chest is fully supported',
      'Let the dumbbells hang at full arm extension before each rep',
      'Pull elbows back and up until upper arms are parallel with your torso',
      'Squeeze shoulder blades together at the top and hold for one second'
    ],
    ytUrl: 'https://youtu.be/d_Ron-Ia880',
    goldStar: false,
    similarityGroup: 'horizontal-row-db',
    alsoInProgram: false
  },
  {
    id: 'db-shrug',
    name: 'Dumbbell Shrug',
    muscleGroup: 'back',
    equipment: 'Dumbbell',
    snapshot: 'Elevate shoulders holding two dumbbells at sides',
    cues: [
      'Hold dumbbells at your sides with a neutral grip, arms fully extended',
      'Shrug straight up — think of trying to touch your ears with your shoulders',
      'No rolling, no bouncing — pure vertical elevation of the shoulder girdle',
      'Pause at the top for one second then lower slowly'
    ],
    ytUrl: 'https://youtu.be/g6qbq4Lf1FI',
    goldStar: false,
    similarityGroup: 'trap-shrug',
    alsoInProgram: false
  },
  {
    id: 'db-pullover-back',
    name: 'Dumbbell Pullover (Lat Focus)',
    muscleGroup: 'back',
    equipment: 'Dumbbell',
    snapshot: 'Arc dumbbell overhead to stretch and load the lats',
    cues: [
      'Lie across a bench with hips low — this position targets lats over chest',
      'Keep your arms nearly straight with only a very slight elbow bend',
      'Lower the dumbbell until you feel a deep stretch in the lats and ribcage',
      'Pull back by driving your elbows toward your hips, not by pushing with your arms'
    ],
    ytUrl: 'https://youtu.be/hpDAMhh4KNc',
    goldStar: false,
    similarityGroup: 'pullover',
    alsoInProgram: false
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'Pull wide bar down to upper chest from overhead',
    cues: [
      'Grip just outside shoulder width with palms facing away from you',
      'Lean back slightly — a natural, comfortable angle not an aggressive lean',
      'Drive your elbows straight down toward your hips as you pull',
      'Let your arms extend fully at the top every rep to stretch the lats'
    ],
    ytUrl: 'https://youtu.be/CAwf7n6Luuc',
    goldStar: true,
    similarityGroup: 'vertical-pull-cable',
    alsoInProgram: true   // id: 'pulldown'
  },
  {
    id: 'close-grip-pulldown',
    name: 'Close-Grip Pulldown',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'Narrow neutral grip pulldown targets lower lat thickness',
    cues: [
      'Use a narrow neutral-grip attachment and sit tall under the cable',
      'Pull the handle to your upper chest while keeping your elbows close to your torso',
      'Think of driving elbows down toward your hips to engage the lower lats',
      'Fully extend at the top every single rep — no partial reps'
    ],
    ytUrl: 'https://youtu.be/CAwf7n6Luuc',
    goldStar: false,
    similarityGroup: 'vertical-pull-cable',
    alsoInProgram: false
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'Pull cable handle to lower ribs while seated',
    cues: [
      'Keep your torso upright and still — do not rock back to generate momentum',
      'Pull the handle to your lower ribs, elbows tracking close to your sides',
      'Squeeze your shoulder blades together hard at the end of the pull',
      'Let arms extend fully between reps to get the full lat stretch'
    ],
    ytUrl: 'https://youtu.be/GZbfZ033f74',
    goldStar: true,
    similarityGroup: 'horizontal-row-cable',
    alsoInProgram: false
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'Hip hinge pulling rope cable through legs behind you',
    cues: [
      'Stand facing away from the cable, rope handle between your legs',
      'Hinge at the hips and push them back — keep your spine neutral throughout',
      'Drive hips forward to stand and squeeze your glutes hard at the top',
      'Let the cable pull your arms back through your legs on the way down'
    ],
    ytUrl: 'https://youtu.be/pv8e6OSyETE',
    goldStar: true,
    similarityGroup: 'hip-hinge-cable',
    alsoInProgram: true   // id: 'pull-through'
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight-Arm Cable Pulldown',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'Pull rope or bar down with straight arms, lat isolation',
    cues: [
      'Stand a step back from the cable and keep a slight bend in your elbows fixed',
      'Initiate the motion by driving the elbows toward your hips, not pulling with hands',
      'Keep your core braced — do not let your lower back round during the pull',
      'Control the return until arms are fully extended overhead before the next rep'
    ],
    ytUrl: 'https://youtu.be/14Se-ENHBkM',
    goldStar: true,
    similarityGroup: 'straight-arm-pulldown',
    alsoInProgram: false
  },
  {
    id: 'single-arm-cable-row',
    name: 'Single-Arm Cable Row',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'One arm row from cable to fix left-right imbalances',
    cues: [
      'Sit or stand and brace your core before each rep',
      'Pull the handle to your lower rib on the same side as the working arm',
      'Allow a natural slight trunk rotation — do not restrict it completely',
      'Complete all reps on the weaker side first, then match on the stronger'
    ],
    ytUrl: 'https://youtu.be/GZbfZ033f74',
    goldStar: false,
    similarityGroup: 'horizontal-row-cable',
    alsoInProgram: false
  },
  {
    id: 'cable-face-pull',
    name: 'Cable Face Pull',
    muscleGroup: 'back',
    equipment: 'Cable',
    snapshot: 'Pull rope to face to target rear delts and mid traps',
    cues: [
      'Set the pulley at forehead height and use a rope attachment',
      'Pull the rope to your face, spreading the ends apart as you pull in',
      'Elbows stay high and flare outward — do not let them drop below shoulder level',
      'Pause at full contraction and squeeze the rear delts and mid traps hard'
    ],
    ytUrl: 'https://youtu.be/rep-qVOkqgk',
    goldStar: true,
    similarityGroup: 'rear-delt-cable',
    alsoInProgram: false
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Machine Row',
    muscleGroup: 'back',
    equipment: 'Machine',
    snapshot: 'Chest-braced row machine removes lower back involvement',
    cues: [
      'Keep your chest flat against the pad the entire set — do not lift off',
      'Pull handles straight back, driving elbows behind your body',
      'Squeeze shoulder blades together hard at the peak of each rep',
      'Let arms extend fully at the bottom for a complete lat stretch'
    ],
    ytUrl: 'https://youtu.be/axoeDmW0oAY',
    goldStar: true,
    similarityGroup: 'horizontal-row-machine',
    alsoInProgram: true   // id: 'chest-row'
  },
  {
    id: 'machine-lat-pulldown',
    name: 'Machine Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'Machine',
    snapshot: 'Fixed-path pulldown machine for lat width',
    cues: [
      'Adjust knee pads so your legs are anchored firmly throughout the set',
      'Pull the handles down to your upper chest while driving elbows toward hips',
      'Keep a natural slight lean back — avoid aggressive leaning',
      'Extend arms fully at the top every rep to maximise the lat stretch'
    ],
    ytUrl: 'https://youtu.be/CAwf7n6Luuc',
    goldStar: false,
    similarityGroup: 'vertical-pull-machine',
    alsoInProgram: false
  },
  {
    id: 'seated-machine-row',
    name: 'Seated Machine Row',
    muscleGroup: 'back',
    equipment: 'Machine',
    snapshot: 'Seated row machine for horizontal back pulling',
    cues: [
      'Adjust chest pad height so arms are parallel to the floor at full extension',
      'Pull handles back while keeping your chest lightly in contact with the pad',
      'Drive elbows back past your torso for a full range of motion',
      'Control the return — do not let the stack crash between reps'
    ],
    ytUrl: 'https://youtu.be/GZbfZ033f74',
    goldStar: false,
    similarityGroup: 'horizontal-row-machine',
    alsoInProgram: false
  },
  {
    id: 'hammer-strength-row',
    name: 'Hammer Strength Row',
    muscleGroup: 'back',
    equipment: 'Machine',
    snapshot: 'Plate-loaded row machine with independent arm handles',
    cues: [
      'Lie chest-down on the pad and grip the neutral handles at full extension',
      'Pull both handles back simultaneously, elbows tracking close to the torso',
      'Squeeze the shoulder blades together hard at the top of every rep',
      'Independent handles correct left-right imbalances — let each side work alone'
    ],
    ytUrl: 'https://youtu.be/axoeDmW0oAY',
    goldStar: false,
    similarityGroup: 'horizontal-row-machine',
    alsoInProgram: false
  },
  {
    id: 'assisted-pull-up-machine',
    name: 'Assisted Pull-Up Machine',
    muscleGroup: 'back',
    equipment: 'Machine',
    snapshot: 'Machine-assisted pull-up for building toward bodyweight',
    cues: [
      'Higher assistance weight means less effort — use just enough to complete clean reps',
      'Grip just outside shoulder width with palms facing away',
      'Pull until your chin clears the bar, driving elbows down and back',
      'Lower under full control — the eccentric builds real pull-up strength'
    ],
    ytUrl: 'https://youtu.be/CAwf7n6Luuc',
    goldStar: false,
    similarityGroup: 'vertical-pull-machine',
    alsoInProgram: false
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscleGroup: 'back',
    equipment: 'Bodyweight',
    snapshot: 'Hang from bar and pull chin above it',
    cues: [
      'Start from a dead hang with arms fully extended — no partial reps',
      'Grip just outside shoulder width with palms facing away from you',
      'Drive your elbows down toward your hips as you pull your chin over the bar',
      'Lower slowly and controlled all the way back to a full hang'
    ],
    ytUrl: 'https://youtu.be/eGo4IYlbE5g',
    goldStar: true,
    similarityGroup: 'vertical-pull-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'chin-up',
    name: 'Chin-Up',
    muscleGroup: 'back',
    equipment: 'Bodyweight',
    snapshot: 'Underhand grip pull-up with more bicep involvement',
    cues: [
      'Use a shoulder-width underhand grip — palms facing toward you',
      'Pull yourself up until your chin clearly clears the bar',
      'Keep your elbows close to your torso throughout the pull',
      'Lower slowly to a full dead hang — do not let gravity do it for you'
    ],
    ytUrl: 'https://youtu.be/eGo4IYlbE5g',
    goldStar: false,
    similarityGroup: 'vertical-pull-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'inverted-row',
    name: 'Inverted Row',
    muscleGroup: 'back',
    equipment: 'Bodyweight',
    snapshot: 'Horizontal row under a bar using bodyweight',
    cues: [
      'Set bar at hip height and hang underneath it with heels on the floor',
      'Keep your body in a rigid plank from head to heels — no sagging hips',
      'Pull your chest up to the bar by driving elbows back and squeezing shoulder blades',
      'Make it harder by lowering the bar or elevating your feet on a bench'
    ],
    ytUrl: 'https://youtu.be/7Fd7-3RUAss',
    goldStar: true,
    similarityGroup: 'horizontal-row-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'wide-grip-pull-up',
    name: 'Wide-Grip Pull-Up',
    muscleGroup: 'back',
    equipment: 'Bodyweight',
    snapshot: 'Extra-wide grip pull-up for upper lat width',
    cues: [
      'Grip wider than shoulder width — roughly 1.5 times shoulder width',
      'Pull your chest toward the bar rather than your chin, for a deeper squeeze',
      'The wider grip reduces the range of motion — compensate by squeezing hard at top',
      'Lower to a complete dead hang every rep'
    ],
    ytUrl: 'https://youtu.be/eGo4IYlbE5g',
    goldStar: false,
    similarityGroup: 'vertical-pull-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'scapular-pull-up',
    name: 'Scapular Pull-Up',
    muscleGroup: 'back',
    equipment: 'Bodyweight',
    snapshot: 'Depress shoulder blades from dead hang, no elbow bend',
    cues: [
      'Hang from a bar with straight arms and a relaxed shoulder girdle',
      'Pull your shoulder blades down and back without bending your elbows at all',
      'Your body will rise an inch or two from this shoulder blade movement alone',
      'This builds the foundation for full pull-ups and protects the shoulder joint'
    ],
    ytUrl: 'https://youtu.be/nbpSNCYSBkg',
    goldStar: false,
    similarityGroup: 'vertical-pull-bodyweight',
    alsoInProgram: false
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-pull-apart',
    name: 'Band Pull-Apart',
    muscleGroup: 'back',
    equipment: 'Resistance Band',
    snapshot: 'Pull band apart at chest height to target rear delts',
    cues: [
      'Hold the band at chest height with arms straight in front of you',
      'Pull the band apart until it touches your chest, squeezing shoulder blades together',
      'Keep arms straight throughout — this is not a row, do not bend elbows',
      'Control the return — do not let the band snap back quickly'
    ],
    ytUrl: 'https://youtu.be/9YKBLkqo9bw',
    goldStar: true,
    similarityGroup: 'rear-delt-band',
    alsoInProgram: false
  },
  {
    id: 'band-row',
    name: 'Resistance Band Row',
    muscleGroup: 'back',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band and row handles to lower ribs',
    cues: [
      'Anchor the band at lower chest height and sit or stand back for tension',
      'Pull handles toward your lower ribs while keeping your torso upright',
      'Squeeze shoulder blades together at the end of the pull',
      'Control the stretch back out — bands increase tension as you pull them more'
    ],
    ytUrl: 'https://youtu.be/9YKBLkqo9bw',
    goldStar: true,
    similarityGroup: 'horizontal-row-band',
    alsoInProgram: false
  },
  {
    id: 'band-pulldown',
    name: 'Resistance Band Pulldown',
    muscleGroup: 'back',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band overhead and pull down to chest height',
    cues: [
      'Anchor the band above you and kneel or stand back to create tension',
      'Pull the band down toward your chest while driving elbows down toward your hips',
      'Keep your core braced to prevent your back from arching excessively',
      'Let arms extend fully overhead again before the next rep'
    ],
    ytUrl: 'https://youtu.be/9YKBLkqo9bw',
    goldStar: true,
    similarityGroup: 'vertical-pull-band',
    alsoInProgram: false
  },
  {
    id: 'band-good-morning',
    name: 'Resistance Band Good Morning',
    muscleGroup: 'back',
    equipment: 'Resistance Band',
    snapshot: 'Step on band and loop it behind neck, hinge forward',
    cues: [
      'Stand on the band and loop it over your neck like a barbell good morning',
      'Keep your lower back neutral and push hips back as you hinge forward',
      'Go only as low as you can with a flat back — stop before the spine rounds',
      'Drive hips forward to stand and squeeze glutes at the top'
    ],
    ytUrl: 'https://youtu.be/YA-h3n9L4YU',
    goldStar: false,
    similarityGroup: 'spinal-erector-band',
    alsoInProgram: false
  },
  {
    id: 'band-straight-arm-pulldown',
    name: 'Band Straight-Arm Pulldown',
    muscleGroup: 'back',
    equipment: 'Resistance Band',
    snapshot: 'Pull anchored overhead band down with straight arms',
    cues: [
      'Anchor the band above your head and hold with straight arms in front',
      'Keep the elbow angle fixed — this movement comes from the shoulder joint only',
      'Drive the band down toward your hips by squeezing the lats',
      'Control the return until arms are fully extended before the next rep'
    ],
    ytUrl: 'https://youtu.be/14Se-ENHBkM',
    goldStar: false,
    similarityGroup: 'straight-arm-pulldown',
    alsoInProgram: false
  }

];

// Export for use in other modules or directly in index.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BACK_EXERCISE_LIBRARY };
}
