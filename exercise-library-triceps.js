/**
 * T&S Muscle — Tricep Exercise Library
 * All tricep exercises across every equipment category.
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
 */

const TRICEP_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'skull-crushers',
    name: 'Skull Crushers (EZ Bar)',
    muscleGroup: 'triceps',
    equipment: 'Barbell',
    snapshot: 'Lower EZ bar to forehead lying on bench',
    cues: [
      'Lie flat on the bench and hold the EZ bar with an overhand grip, arms straight up',
      'Only your forearms move — hinge at the elbow and lower the bar toward your forehead or just behind it',
      'Keep your upper arms completely vertical and stationary throughout each rep',
      'Press back to straight arms slowly — the long head of the tricep is under maximum stretch here'
    ],
    ytUrl: 'https://youtu.be/ZLIKPa4Iunc',
    goldStar: true,
    similarityGroup: 'lying-extension',
    alsoInProgram: false
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    muscleGroup: 'triceps',
    equipment: 'Barbell',
    snapshot: 'Press barbell with narrow grip, elbows tucked in',
    cues: [
      'Grip the bar just inside shoulder-width — going too narrow stresses your wrists without adding benefit',
      'Tuck your elbows close to your sides as you lower the bar — this is what shifts emphasis from chest to triceps',
      'Lower to your lower chest under control and press to full lockout',
      'Squeeze your triceps hard at the top of each rep before lowering again'
    ],
    ytUrl: 'https://youtu.be/4yKLxOsrGfg',
    goldStar: true,
    similarityGroup: 'compound-press-barbell',
    alsoInProgram: false
  },
  {
    id: 'barbell-overhead-extension',
    name: 'Standing Barbell Overhead Extension',
    muscleGroup: 'triceps',
    equipment: 'Barbell',
    snapshot: 'Lower barbell behind head overhead arms extended',
    cues: [
      'Grip the bar close together and press it overhead until your arms are fully extended',
      'Hinge only at the elbows and lower the bar behind your head — keep your upper arms pointing straight up',
      'Brace your core hard — this overhead position puts your lower back at risk if you let it arch',
      'Extend back to lockout slowly and squeeze the long head of the tricep at the top'
    ],
    ytUrl: 'https://youtu.be/ZLIKPa4Iunc',
    goldStar: true,
    similarityGroup: 'overhead-extension-barbell',
    alsoInProgram: false
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-overhead-extension',
    name: 'Dumbbell Overhead Extension (Two-Arm)',
    muscleGroup: 'triceps',
    equipment: 'Dumbbell',
    snapshot: 'Hold single dumbbell overhead and lower behind head',
    cues: [
      'Hold one dumbbell with both hands underneath the top plate and press it straight overhead',
      'Lower the dumbbell behind your head by hinging at the elbows — upper arms stay vertical',
      'Brace your core and avoid flaring your ribs — keep your torso neutral throughout',
      'Extend back to full lockout for a complete tricep contraction before lowering again'
    ],
    ytUrl: 'https://youtu.be/popGXI-qs98',
    goldStar: false,
    similarityGroup: 'overhead-extension-db',
    alsoInProgram: false
  },
  {
    id: 'single-arm-db-overhead-extension',
    name: 'Single Arm DB Overhead Extension',
    muscleGroup: 'triceps',
    equipment: 'Dumbbell',
    snapshot: 'Lower single dumbbell behind head one arm at a time',
    cues: [
      'Press one dumbbell overhead and support your working elbow lightly with your free hand',
      'Lower the dumbbell behind your head by hinging at the elbow only — upper arm stays vertical',
      'One arm at a time allows a deeper range of motion and corrects any strength imbalances between sides',
      'Extend fully to lockout and squeeze the long head hard before lowering for the next rep'
    ],
    ytUrl: 'https://youtu.be/popGXI-qs98',
    goldStar: true,
    similarityGroup: 'overhead-extension-db',
    alsoInProgram: true   // id: 'overhead-tri'
  },
  {
    id: 'db-skull-crusher',
    name: 'Dumbbell Skull Crusher',
    muscleGroup: 'triceps',
    equipment: 'Dumbbell',
    snapshot: 'Lower dumbbells toward temples lying on bench',
    cues: [
      'Lie flat on the bench and hold the dumbbells with palms facing each other, arms straight up',
      'Hinge only at the elbows and lower the dumbbells toward your temples or ears — not straight back',
      'Neutral grip reduces wrist strain compared to the barbell version — a key advantage',
      'Press back to straight arms and feel the full tricep stretch at the bottom of each rep'
    ],
    ytUrl: 'https://youtu.be/ZLIKPa4Iunc',
    goldStar: false,
    similarityGroup: 'lying-extension',
    alsoInProgram: false
  },
  {
    id: 'db-kickback',
    name: 'Dumbbell Kickback',
    muscleGroup: 'triceps',
    equipment: 'Dumbbell',
    snapshot: 'Hinge over and extend arm back behind body',
    cues: [
      'Hinge your torso forward until it is nearly parallel to the floor and brace your core',
      'Raise your upper arm until it is parallel to your torso — this position stays fixed throughout',
      'Extend your forearm back and up until your arm is completely straight',
      'Hold briefly at full extension — there is zero tension at the bottom so the peak squeeze is everything'
    ],
    ytUrl: 'https://youtu.be/6SS6K3lAwZ8',
    goldStar: false,
    similarityGroup: 'kickback',
    alsoInProgram: false
  },
  {
    id: 'db-tate-press',
    name: 'Tate Press',
    muscleGroup: 'triceps',
    equipment: 'Dumbbell',
    snapshot: 'Flare elbows out and press dumbbells to chest',
    cues: [
      'Lie flat on the bench and hold dumbbells over your chest with elbows pointing straight out to the sides',
      'Lower the dumbbells by letting your elbows flare wide toward your chest — not tucking them in',
      'Touch the dumbbells lightly to your chest then press them back by extending your elbows',
      'Keep the movement controlled — this is an isolation exercise, not a press, so go lighter than you think'
    ],
    ytUrl: 'https://youtu.be/9Ark9S11uXw',
    goldStar: false,
    similarityGroup: 'lying-extension',
    alsoInProgram: false
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-pushdown',
    name: 'Tricep Cable Pushdown',
    muscleGroup: 'triceps',
    equipment: 'Cable',
    snapshot: 'Push straight bar down from high pulley to hips',
    cues: [
      'Set the pulley high and use a straight bar or angled bar attachment',
      'Keep your elbows pinned to your sides — they should not move forward or back during the set',
      'Push down to full lockout and squeeze your triceps hard before letting the bar rise',
      'Control the return — do not let the stack pull your arms back up without resistance'
    ],
    ytUrl: 'https://youtu.be/_w-HpW70nSQ',
    goldStar: false,
    similarityGroup: 'pushdown',
    alsoInProgram: true   // id: 'pushdown'
  },
  {
    id: 'cable-rope-pushdown',
    name: 'Cable Rope Pushdown',
    muscleGroup: 'triceps',
    equipment: 'Cable',
    snapshot: 'Push rope down and flare ends apart at bottom',
    cues: [
      'Attach a rope to the high pulley and hold each end with your palms facing each other',
      'Pin your elbows to your sides and push the rope down to full extension',
      'At the bottom, flare the rope ends apart and outward — this extra motion adds full tricep contraction',
      'Lower the rope back slowly under control before the next rep'
    ],
    ytUrl: 'https://youtu.be/kiuVA0gs3EI',
    goldStar: true,
    similarityGroup: 'pushdown',
    alsoInProgram: false
  },
  {
    id: 'cable-reverse-grip-pushdown',
    name: 'Reverse Grip Cable Pushdown',
    muscleGroup: 'triceps',
    equipment: 'Cable',
    snapshot: 'Push cable bar down with palms facing up',
    cues: [
      'Use a straight bar and flip your grip so your palms face upward throughout',
      'This supinated grip shifts more emphasis onto the medial head of the tricep',
      'Keep your elbows pinned to your sides just like a standard pushdown',
      'Push to full lockout and squeeze — use a lighter weight than your regular pushdown'
    ],
    ytUrl: 'https://youtu.be/OJniFg2ijRk',
    goldStar: false,
    similarityGroup: 'pushdown',
    alsoInProgram: false
  },
  {
    id: 'cable-single-arm-pushdown',
    name: 'Single Arm Cable Pushdown',
    muscleGroup: 'triceps',
    equipment: 'Cable',
    snapshot: 'Push single cable handle down one arm at a time',
    cues: [
      'Use a single D-handle on the high pulley and work one arm at a time',
      'Place your free hand on your hip or thigh — do not brace it against the cable stack',
      'Pin your working elbow to your side and push to full lockout before returning',
      'One side at a time reveals and fixes any strength imbalances between your triceps'
    ],
    ytUrl: 'https://youtu.be/_w-HpW70nSQ',
    goldStar: false,
    similarityGroup: 'pushdown',
    alsoInProgram: false
  },
  {
    id: 'cable-overhead-extension',
    name: 'Cable Overhead Extension (Rope)',
    muscleGroup: 'triceps',
    equipment: 'Cable',
    snapshot: 'Face away from pulley and extend rope overhead',
    cues: [
      'Attach a rope to the low pulley, face away, and hold both ends behind your head',
      'Your upper arms should be pointing forward and up — only your forearms move',
      'Extend your arms forward and up to full lockout — the cable keeps tension at the bottom unlike dumbbells',
      'Lower slowly to get the full stretch on the long head before pressing into the next rep'
    ],
    ytUrl: 'https://youtu.be/9Ark9S11uXw',
    goldStar: true,
    similarityGroup: 'overhead-extension-cable',
    alsoInProgram: false
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    muscleGroup: 'triceps',
    equipment: 'Cable',
    snapshot: 'Hinge forward and extend arm back via low pulley',
    cues: [
      'Set the pulley low and hinge your torso forward until nearly parallel to the floor',
      'Raise your upper arm to parallel with your torso and hold it there — it does not move',
      'Extend your forearm back to full lockout by straightening your elbow',
      'Cable maintains tension throughout the range — the dumbbell version has zero tension at the bottom'
    ],
    ytUrl: 'https://youtu.be/6SS6K3lAwZ8',
    goldStar: true,
    similarityGroup: 'kickback',
    alsoInProgram: false
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-tricep-extension',
    name: 'Machine Tricep Extension',
    muscleGroup: 'triceps',
    equipment: 'Machine',
    snapshot: 'Push machine handles down in guided arc motion',
    cues: [
      'Adjust the seat so your elbows line up with the machine axis point — misalignment causes joint stress',
      'Keep your elbows on the pads throughout — lifting them off turns this into a press',
      'Push to full lockout and squeeze hard before returning slowly',
      'Use a slow 3-count on the way up — eccentric loading on the tricep machine builds size fast'
    ],
    ytUrl: 'https://youtu.be/NNyuuN2sJb0',
    goldStar: true,
    similarityGroup: 'machine-tricep-extension',
    alsoInProgram: false
  },
  {
    id: 'machine-overhead-extension',
    name: 'Machine Overhead Extension',
    muscleGroup: 'triceps',
    equipment: 'Machine',
    snapshot: 'Sit in overhead extension machine and press up',
    cues: [
      'Adjust the seat so the handles start behind your head at a comfortable depth',
      'Your upper arms should point straight up — only your forearms move during the rep',
      'Press to full lockout overhead and squeeze your triceps at the top',
      'Lower slowly all the way back to the start position — the long head stretch is the whole point'
    ],
    ytUrl: 'https://youtu.be/popGXI-qs98',
    goldStar: true,
    similarityGroup: 'overhead-extension-machine',
    alsoInProgram: false
  },
  {
    id: 'tricep-dip-machine',
    name: 'Tricep Dip Machine',
    muscleGroup: 'triceps',
    equipment: 'Machine',
    snapshot: 'Push machine handles down in assisted dip pattern',
    cues: [
      'Sit upright and grip the handles at shoulder width — keep your torso vertical to target triceps',
      'Push the handles down to full extension and lock out your elbows at the bottom',
      'Do not lean forward — staying upright is what separates a tricep focus from a chest focus',
      'Return slowly under control — do not let the stack slam at the top between reps'
    ],
    ytUrl: 'https://youtu.be/NNyuuN2sJb0',
    goldStar: false,
    similarityGroup: 'compound-press-bodyweight',
    alsoInProgram: false
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    muscleGroup: 'triceps',
    equipment: 'Bodyweight',
    snapshot: 'Lower and press body between parallel bars upright',
    cues: [
      'Stay upright — leaning forward shifts work to the chest, so keep your torso as vertical as possible',
      'Lower yourself until your upper arms are parallel to the floor, then press back up to full lockout',
      'Keep your elbows pointing back, not out wide, to keep the focus on the tricep',
      'Add weight with a dip belt once bodyweight becomes easy — dips scale very well with load'
    ],
    ytUrl: 'https://youtu.be/wjUmnZH528Y',
    goldStar: true,
    similarityGroup: 'compound-press-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'bench-dips',
    name: 'Bench Dips',
    muscleGroup: 'triceps',
    equipment: 'Bodyweight',
    snapshot: 'Lower hips off bench with hands on edge behind you',
    cues: [
      'Place your hands on the edge of a bench behind you with fingers pointing forward',
      'Keep your hips close to the bench — walking your feet far out makes this harder on your shoulders',
      'Lower until your elbows reach about 90 degrees, then press back up to full lockout',
      'Add a weight plate on your lap to progress — bodyweight alone gets easy quickly'
    ],
    ytUrl: 'https://youtu.be/c3ZGl4pnLZs',
    goldStar: false,
    similarityGroup: 'compound-press-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'diamond-push-ups',
    name: 'Diamond Push-Ups',
    muscleGroup: 'triceps',
    equipment: 'Bodyweight',
    snapshot: 'Push up with hands forming diamond under chest',
    cues: [
      'Place your hands together under your chest with thumbs and forefingers touching to form a diamond shape',
      'Keep your elbows tucked close to your sides as you lower — do not let them flare wide',
      'Lower your chest to your hands with full control, then press back to lockout',
      'Keep your body in a straight plank throughout — do not let your hips sag or pike up'
    ],
    ytUrl: 'https://youtu.be/J0DnG1_S92I',
    goldStar: false,
    similarityGroup: 'compound-press-bodyweight',
    alsoInProgram: false
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-pushdown',
    name: 'Band Pushdown',
    muscleGroup: 'triceps',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band high and push down to full lockout',
    cues: [
      'Anchor the band at head height or above on a door or rack',
      'Pin your elbows to your sides — they should not drift forward or back',
      'Push down to full extension and squeeze hard at the bottom before the band pulls you back',
      'Control the return — band resistance increases as you push down so the eccentric is loaded at the top'
    ],
    ytUrl: 'https://youtu.be/PtHlGbiCglY',
    goldStar: false,
    similarityGroup: 'pushdown',
    alsoInProgram: false
  },
  {
    id: 'band-overhead-extension',
    name: 'Band Overhead Extension',
    muscleGroup: 'triceps',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band and extend overhead behind head',
    cues: [
      'Step on the middle of the band and hold both ends behind your head with elbows pointing up',
      'Your upper arms should stay pointed at the ceiling — only your forearms move',
      'Extend to full lockout overhead and squeeze before lowering back behind your head',
      'The band gets harder as you extend — resistance is highest at lockout where you are strongest'
    ],
    ytUrl: 'https://youtu.be/9Ark9S11uXw',
    goldStar: true,
    similarityGroup: 'overhead-extension-band',
    alsoInProgram: false
  },
  {
    id: 'band-kickback',
    name: 'Band Kickback',
    muscleGroup: 'triceps',
    equipment: 'Resistance Band',
    snapshot: 'Step on band, hinge forward, extend arm back',
    cues: [
      'Step on the band with one foot and hinge your torso forward until nearly parallel',
      'Raise your upper arm to parallel with your torso — this position holds for the entire set',
      'Extend your forearm back to full lockout against the band tension',
      'Keep the motion slow and controlled — the band provides resistance throughout unlike the dumbbell version'
    ],
    ytUrl: 'https://youtu.be/6SS6K3lAwZ8',
    goldStar: false,
    similarityGroup: 'kickback',
    alsoInProgram: false
  },
  {
    id: 'band-skull-crusher',
    name: 'Band Skull Crusher',
    muscleGroup: 'triceps',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band behind head and extend arms lying down',
    cues: [
      'Anchor the band behind you at floor level and lie down so the band runs over your head',
      'Hold the band with both hands and start with arms pointing straight up overhead',
      'Lower your hands toward your forehead by hinging at the elbows only',
      'Extend back to straight arms under full band tension — hardest at lockout where you are strongest'
    ],
    ytUrl: 'https://youtu.be/ZLIKPa4Iunc',
    goldStar: false,
    similarityGroup: 'lying-extension',
    alsoInProgram: false
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRICEP_EXERCISE_LIBRARY };
}
