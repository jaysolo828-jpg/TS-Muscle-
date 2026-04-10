/**
 * T&S Muscle — Bicep Exercise Library
 * All bicep exercises across every equipment category.
 *
 * Dedup notes (canonical entries moved elsewhere):
 *   chin-up — REMOVED from this file. Canonical entry lives in exercise-library-back.js
 *             (primary mover is the lats/upper back; biceps are synergist).
 *             assisted-chin-up-machine, negative-chin-up, and inverted-row-underhand remain
 *             here because they are most commonly thought of as bicep assistance work.
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
 *   tier            – 'compound' (multi-joint) or 'isolation' (single-joint)
 */

const BICEP_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'ez-bar-curl',
    name: 'EZ Bar Curl',
    muscleGroup: 'biceps',
    equipment: 'Barbell',
    snapshot: 'Curl EZ bar from hips to chin standing',
    cues: [
      'Pin your elbows to your sides — they should not drift forward as the bar rises',
      'The angled grip takes wrist and elbow stress off compared to a straight bar',
      'Curl all the way to chin height for a full contraction, then lower slowly',
      'Take 3 seconds on the way down — the eccentric phase is where most growth happens'
    ],
    ytUrl: 'https://youtu.be/QZEqB6wUPxQ',
    goldStar: true,
    similarityGroup: 'standing-curl-barbell',
    alsoInProgram: true,   // id: 'ez-curl'
    tier: 'isolation'
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    muscleGroup: 'biceps',
    equipment: 'Barbell',
    snapshot: 'Curl straight bar from hips to chin standing',
    cues: [
      'Use a shoulder-width grip — going too wide shifts emphasis away from the bicep peak',
      'Keep your elbows pinned to your sides throughout the entire rep',
      'Do not lean back to get the weight up — that is your lower back doing the work',
      'Lower under control on a slow 3-count and feel the stretch at the bottom'
    ],
    ytUrl: 'https://youtu.be/ykJmrZ5v0Oo',
    goldStar: false,
    similarityGroup: 'standing-curl-barbell',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'ez-bar-preacher-curl',
    name: 'EZ Bar Preacher Curl',
    muscleGroup: 'biceps',
    equipment: 'Barbell',
    snapshot: 'Curl EZ bar on preacher pad, elbows fully braced',
    cues: [
      'Set the pad height so your armpits sit just above the top edge — not on top of it',
      'Lower the bar slowly until your arms are almost fully extended — do not drop it',
      'Curl to the top without letting your elbows lift off the pad at any point',
      'Squeeze hard at the top before lowering — the pad removes your ability to cheat'
    ],
    ytUrl: 'https://youtu.be/nbcgEmZ0Be4',
    goldStar: false,
    similarityGroup: 'preacher-curl',
    alsoInProgram: true,   // id: 'preacher'
    tier: 'isolation'
  },
  {
    id: 'barbell-reverse-curl',
    name: 'Barbell Reverse Curl',
    muscleGroup: 'biceps',
    equipment: 'Barbell',
    snapshot: 'Curl bar with palms facing down, works forearms',
    cues: [
      'Use an overhand grip with your palms facing the floor throughout the movement',
      'Keep your wrists straight and neutral — do not let them curl downward under load',
      'Elbows stay pinned to your sides — this movement is shorter range than a regular curl',
      'Use a lighter weight than your standard curl — this is a forearm and brachialis builder'
    ],
    ytUrl: 'https://youtu.be/Dd1wdWUqIGo',
    goldStar: false,
    similarityGroup: 'reverse-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-curl',
    name: 'Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Curl dumbbells up and supinate wrists at top',
    cues: [
      'Start with palms facing each other and rotate them upward as you curl — this supination recruits the bicep fully',
      'Keep your elbows pinned to your sides and do not swing your torso back',
      'Alternate arms or do both at once — both work, alternating allows better focus per side',
      'Lower slowly and fully — let your arm extend all the way down before the next rep'
    ],
    ytUrl: 'https://youtu.be/ykJmrZ5v0Oo',
    goldStar: true,
    similarityGroup: 'standing-curl-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Curl dumbbells with neutral palms-facing grip',
    cues: [
      'Keep your palms facing each other throughout — do not rotate like a standard curl',
      'This neutral grip targets the brachialis under the bicep and the brachioradialis in the forearm',
      'Pin your elbows tight to your sides and curl straight up without swinging',
      'Lower slowly — the brachialis responds very well to controlled eccentric loading'
    ],
    ytUrl: 'https://youtu.be/zC3nLlEvin4',
    goldStar: false,
    similarityGroup: 'hammer-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'incline-db-curl',
    name: 'Incline Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Curl dumbbells lying back on incline bench',
    cues: [
      'Set the bench to 45-60 degrees and lie back so your arms hang freely behind your body',
      'This arm-behind-body position creates a deep stretch on the long head of the bicep at the start',
      'Curl up slowly and supinate your wrists as you go — do not rush through the stretch',
      'Lower all the way back to a full hang — the stretch is the entire point of this exercise'
    ],
    ytUrl: 'https://youtu.be/sAq_ocpRh_I',
    goldStar: true,
    similarityGroup: 'incline-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'concentration-curl',
    name: 'Concentration Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Brace elbow on inner thigh and curl for peak',
    cues: [
      'Sit on a bench and brace the back of your upper arm on your inner thigh for a fixed anchor',
      'Curl slowly and twist your wrist outward slightly at the top to get full bicep contraction',
      'Do not rock your torso to help — the point is to isolate the bicep completely',
      'Lower all the way to a full extension every rep — partial reps miss the peak stretch'
    ],
    ytUrl: 'https://youtu.be/0AUGkch3tzc',
    goldStar: true,
    similarityGroup: 'concentration-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-preacher-curl',
    name: 'Dumbbell Preacher Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Curl single dumbbell on preacher pad, arm braced',
    cues: [
      'Use one arm at a time so you can focus on full range of motion each side',
      'Lower the dumbbell slowly until your arm is nearly fully extended — do not drop it',
      'Curl to the top without letting your elbow lift off the pad',
      'Supinate your wrist slightly at the top for a peak squeeze before lowering'
    ],
    ytUrl: 'https://youtu.be/nbcgEmZ0Be4',
    goldStar: false,
    similarityGroup: 'preacher-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'spider-curl',
    name: 'Spider Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Curl dumbbells lying face down on incline bench',
    cues: [
      'Lie face down on an incline bench set to 45 degrees and let your arms hang straight down',
      'Curl the dumbbells up toward your shoulders — your upper arms should not move at all',
      'Squeeze hard at the top then lower slowly — gravity is working against you the whole time',
      'Use a lighter weight than a standing curl — the short head is isolated with no cheating possible'
    ],
    ytUrl: 'https://youtu.be/ivS3G35bapw',
    goldStar: true,
    similarityGroup: 'spider-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'zottman-curl',
    name: 'Zottman Curl',
    muscleGroup: 'biceps',
    equipment: 'Dumbbell',
    snapshot: 'Curl supinated up then rotate and lower pronated',
    cues: [
      'Curl up with palms facing up like a standard dumbbell curl',
      'At the top, rotate your wrists so palms face the floor before lowering',
      'Lower slowly on the way down — the pronated eccentric hammers the brachioradialis and forearms',
      'Rotate back to the supinated start position before the next rep'
    ],
    ytUrl: 'https://youtu.be/OLhqRXNYKMY',
    goldStar: true,
    similarityGroup: 'zottman-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-curl',
    name: 'Cable Curl',
    muscleGroup: 'biceps',
    equipment: 'Cable',
    snapshot: 'Curl cable bar from low pulley to chin',
    cues: [
      'Set the pulley to the lowest position and use a straight bar or EZ attachment',
      'Pin your elbows to your sides — cables pull from a fixed angle so stay disciplined',
      'Cable maintains tension at the bottom of the range where dumbbells go slack',
      'Lower on a 3-count and let your arms fully extend before the next rep'
    ],
    ytUrl: 'https://youtu.be/NFzTWp2qpiE',
    goldStar: true,
    similarityGroup: 'standing-curl-cable',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-rope-hammer-curl',
    name: 'Cable Rope Hammer Curl',
    muscleGroup: 'biceps',
    equipment: 'Cable',
    snapshot: 'Curl rope attachment with neutral grip from low pulley',
    cues: [
      'Attach a rope to the low pulley and hold each end with a neutral thumbs-up grip',
      'Keep your elbows pinned to your sides and curl the rope up to shoulder height',
      'At the top, pull the rope ends apart slightly to feel the brachialis contract hard',
      'Lower slowly and fully — the cable keeps constant tension even at the bottom'
    ],
    ytUrl: 'https://youtu.be/zC3nLlEvin4',
    goldStar: true,
    similarityGroup: 'hammer-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-preacher-curl',
    name: 'Cable Preacher Curl',
    muscleGroup: 'biceps',
    equipment: 'Cable',
    snapshot: 'Curl cable on preacher pad with constant tension',
    cues: [
      'Set the low pulley next to a preacher bench and sit so the cable comes straight to your arm',
      'The cable keeps tension at the bottom where the EZ bar goes completely slack',
      'Lower all the way to near full extension — do not stop halfway down',
      'Curl to the top and squeeze before returning slowly — no swinging, the pad eliminates it'
    ],
    ytUrl: 'https://youtu.be/NFzTWp2qpiE',
    goldStar: true,
    similarityGroup: 'preacher-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-reverse-curl',
    name: 'Cable Reverse Curl',
    muscleGroup: 'biceps',
    equipment: 'Cable',
    snapshot: 'Curl cable bar with palms facing down throughout',
    cues: [
      'Use a straight bar on the low pulley and grip it with palms facing the floor',
      'Keep your wrists flat and neutral — curling the wrists takes the forearms out of the movement',
      'Pin your elbows to your sides and curl to shoulder height with control',
      'The constant cable tension at the bottom makes this more effective than the barbell version'
    ],
    ytUrl: 'https://youtu.be/Dd1wdWUqIGo',
    goldStar: true,
    similarityGroup: 'reverse-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-overhead-curl',
    name: 'Cable Overhead Curl (Bayesian)',
    muscleGroup: 'biceps',
    equipment: 'Cable',
    snapshot: 'Stand back to pulley and curl with arm behind body',
    cues: [
      'Set the pulley to shoulder height and stand facing away, holding the handle with one hand',
      'Your upper arm is behind your body — this stretches the long head just like an incline curl',
      'Curl your hand toward your head without letting your elbow drift forward',
      'Lower slowly back to the fully stretched position — the stretch is the key benefit here'
    ],
    ytUrl: 'https://youtu.be/sAq_ocpRh_I',
    goldStar: false,
    similarityGroup: 'incline-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-arm-curl',
    name: 'Machine Arm Curl',
    muscleGroup: 'biceps',
    equipment: 'Machine',
    snapshot: 'Curl machine handles seated with guided arm path',
    cues: [
      'Adjust the seat so your elbows line up with the machine axis point — this is critical for joint health',
      'Curl to the top slowly and squeeze the bicep hard before lowering',
      'Lower all the way down to a full extension — do not stop halfway and bounce back up',
      'The machine removes stabilizer demand, so slow it down and focus on feel instead'
    ],
    ytUrl: 'https://youtu.be/ykJmrZ5v0Oo',
    goldStar: true,
    similarityGroup: 'machine-arm-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'machine-preacher-curl',
    name: 'Machine Preacher Curl',
    muscleGroup: 'biceps',
    equipment: 'Machine',
    snapshot: 'Curl machine handles on fixed preacher arm rest',
    cues: [
      'Adjust the seat so your upper arms rest flat on the pad with your elbows at the pivot',
      'Grip the handles lightly — squeezing too hard recruits your forearms instead of your biceps',
      'Curl to full contraction and hold briefly before lowering',
      'Lower all the way until your arms are nearly straight — short reps mean half the growth'
    ],
    ytUrl: 'https://youtu.be/nbcgEmZ0Be4',
    goldStar: false,
    similarityGroup: 'preacher-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'assisted-chin-up-machine',
    name: 'Assisted Chin-Up Machine',
    muscleGroup: 'biceps',
    equipment: 'Machine',
    snapshot: 'Chin-up with machine counterweight reducing bodyweight',
    cues: [
      'Use an underhand shoulder-width grip — supinated grip recruits the bicep much more than overhand',
      'Set the assistance weight so you can do 8-12 clean reps — reduce it as you get stronger',
      'Pull your chin over the bar by driving your elbows down and back, not by shrugging',
      'Lower slowly on the way down — even with assistance, a controlled eccentric builds strength faster'
    ],
    ytUrl: 'https://youtu.be/ePFNOFMiMxs',
    goldStar: false,
    similarityGroup: 'chin-up',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'negative-chin-up',
    name: 'Negative Chin-Up',
    muscleGroup: 'biceps',
    equipment: 'Bodyweight',
    snapshot: 'Jump to top position and lower slowly under control',
    cues: [
      'Jump or use a box to get your chin over the bar in the top position',
      'Lower yourself as slowly as possible — aim for a 5-10 second descent per rep',
      'Keep your body in a straight line — do not kick or swing your legs during the descent',
      'Stop when your arms are fully extended and repeat — this builds chin-up strength faster than any other method'
    ],
    ytUrl: 'https://youtu.be/TlCuKKcLDwo',
    goldStar: false,
    similarityGroup: 'chin-up',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'inverted-row-underhand',
    name: 'Inverted Row (Underhand Grip)',
    muscleGroup: 'biceps',
    equipment: 'Bodyweight',
    snapshot: 'Pull chest up to bar with underhand grip horizontal',
    cues: [
      'Set a bar at hip height and hang underneath it with a supinated underhand grip',
      'Keep your body in a straight plank — do not let your hips sag toward the floor',
      'Pull your chest to the bar by driving your elbows back and squeezing your shoulder blades',
      'Adjust difficulty by changing your foot position — feet further out makes it harder'
    ],
    ytUrl: 'https://youtu.be/LMdNTHH6G8I',
    goldStar: false,
    similarityGroup: 'chin-up',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-curl',
    name: 'Band Curl',
    muscleGroup: 'biceps',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band and curl both handles up supinated',
    cues: [
      'Stand on the middle of the band with feet shoulder-width and hold each end with palms facing up',
      'Pin your elbows to your sides and curl just like a standard dumbbell curl',
      'Band resistance increases as you curl higher — the top of the movement is where it is hardest',
      'Lower slowly all the way to full extension before repeating'
    ],
    ytUrl: 'https://youtu.be/NFzTWp2qpiE',
    goldStar: true,
    similarityGroup: 'band-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-hammer-curl',
    name: 'Band Hammer Curl',
    muscleGroup: 'biceps',
    equipment: 'Resistance Band',
    snapshot: 'Curl band with neutral grip, palms facing each other',
    cues: [
      'Stand on the band and grip each end with palms facing each other throughout',
      'Keep your elbows pinned to your sides — do not let them swing forward',
      'Curl to shoulder height and squeeze the brachialis before lowering',
      'Lower slowly to full extension — band tension means the eccentric is working even at the bottom'
    ],
    ytUrl: 'https://youtu.be/zC3nLlEvin4',
    goldStar: false,
    similarityGroup: 'hammer-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-preacher-curl',
    name: 'Band Preacher Curl',
    muscleGroup: 'biceps',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band low and curl on preacher pad',
    cues: [
      'Anchor the band to a low point and set up on a preacher bench facing the anchor',
      'The band provides increasing resistance as you curl — hardest at the top where you are strongest',
      'Keep your elbows flat on the pad throughout — do not lift them to assist the curl',
      'Lower slowly all the way to near full extension before the next rep'
    ],
    ytUrl: 'https://youtu.be/nbcgEmZ0Be4',
    goldStar: false,
    similarityGroup: 'preacher-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-reverse-curl',
    name: 'Band Reverse Curl',
    muscleGroup: 'biceps',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band and curl with palms facing down',
    cues: [
      'Stand on the band and hold each end with an overhand pronated grip',
      'Keep your wrists flat and neutral throughout — do not let them curl under load',
      'Curl to shoulder height, keeping elbows pinned to your sides',
      'Lower fully on a slow 3-count — this works the brachialis and forearms more than the bicep peak'
    ],
    ytUrl: 'https://youtu.be/Dd1wdWUqIGo',
    goldStar: false,
    similarityGroup: 'reverse-curl',
    alsoInProgram: false,
    tier: 'isolation'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BICEP_EXERCISE_LIBRARY };
}
