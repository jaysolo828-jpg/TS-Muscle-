/**
 * T&S Muscle — Hamstring Exercise Library
 * All hamstring exercises across every equipment category.
 *
 * Dedup notes (duplicate IDs removed):
 *   barbell-conventional-deadlift — REMOVED from this file. Canonical entry lives in
 *             exercise-library-back.js under id 'conventional-deadlift'. The back
 *             version is the authoritative entry (full posterior chain compound).
 *   cable-pull-through — CANONICAL entry. Removed from exercise-library-back.js and
 *             exercise-library-glutes.js. alsoInProgram set to true to match the
 *             back.js version (which had alsoInProgram: true).
 *   barbell-good-morning — CANONICAL entry. Removed from exercise-library-back.js.
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

const HAMSTRING_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-rdl',
    name: 'Romanian Deadlift',
    muscleGroup: 'hamstrings',
    equipment: 'Barbell',
    snapshot: 'Hinge hips back lowering bar along legs',
    cues: [
      'Push your hips straight back — this is a hip hinge, not a squat, so your knees stay soft and mostly still',
      'Keep the bar dragging close to your shins and thighs the entire way down',
      'Lower until you feel a strong stretch in your hamstrings — depth depends on your mobility, not a fixed point',
      'Drive your hips forward to stand and squeeze your glutes hard at the top'
    ],
    ytUrl: 'https://youtu.be/QR6HDEmBQNo',
    goldStar: true,
    similarityGroup: 'rdl-bilateral',
    alsoInProgram: true,   // id: 'rdl'
    tier: 'compound'
  },
  {
    id: 'barbell-stiff-leg-deadlift',
    name: 'Stiff-Leg Deadlift',
    muscleGroup: 'hamstrings',
    equipment: 'Barbell',
    snapshot: 'Deadlift with minimal knee bend for hamstring stretch',
    cues: [
      'Keep your legs nearly straight with just a slight, fixed knee bend — not fully locked',
      'Hinge from the hips and lower the bar down your legs, keeping it close to your body',
      'Feel a deeper hamstring stretch than a standard RDL since your knees are more extended',
      'Keep your lower back flat throughout — rounding is the main risk when knees are straight'
    ],
    ytUrl: 'https://youtu.be/1uDiW5--rAE',
    goldStar: false,
    similarityGroup: 'rdl-bilateral',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'barbell-good-morning',
    name: 'Good Morning',
    muscleGroup: 'hamstrings',
    equipment: 'Barbell',
    snapshot: 'Bar on traps, hinge forward at hips to parallel',
    cues: [
      'Place the bar on your upper back like a squat and stand with soft knees',
      'Hinge your hips back and lean your torso forward until it is near parallel to the floor',
      'Keep your back flat and your chest up — this is the same hip hinge as an RDL but with bar on your back',
      'Drive your hips forward to return to standing and squeeze your glutes at the top'
    ],
    ytUrl: 'https://youtu.be/YA-h3n9L4YU',
    goldStar: true,
    similarityGroup: 'good-morning',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-rdl',
    name: 'Dumbbell Romanian Deadlift',
    muscleGroup: 'hamstrings',
    equipment: 'Dumbbell',
    snapshot: 'Hip hinge lowering dumbbells along thighs to floor',
    cues: [
      'Hold dumbbells in front of your thighs and push your hips straight back to start the hinge',
      'Lower the dumbbells along your legs — they should stay in contact with your body the whole way',
      'Stop when you feel a strong hamstring stretch — most people reach mid-shin depending on their mobility',
      'Drive your hips forward to stand and squeeze your glutes — do not hyperextend at the top'
    ],
    ytUrl: 'https://youtu.be/QR6HDEmBQNo',
    goldStar: false,
    similarityGroup: 'rdl-bilateral',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-sumo-deadlift',
    name: 'Dumbbell Sumo Deadlift',
    muscleGroup: 'hamstrings',
    equipment: 'Dumbbell',
    snapshot: 'Wide stance deadlift holding dumbbell between legs',
    cues: [
      'Stand wide with toes turned out and hold one dumbbell vertically between your legs',
      'Hinge your hips back and bend your knees to lower the dumbbell toward the floor',
      'Keep your chest tall and back flat — the wide stance shifts work toward the inner hamstrings and adductors',
      'Drive through your heels and squeeze your glutes hard at the top of every rep'
    ],
    ytUrl: 'https://youtu.be/LGIS9vs65Sk',
    goldStar: false,
    similarityGroup: 'rdl-bilateral',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-single-leg-rdl',
    name: 'Single Leg Romanian Deadlift (Dumbbell)',
    muscleGroup: 'hamstrings',
    equipment: 'Dumbbell',
    snapshot: 'Balance on one leg hinging forward with dumbbell',
    cues: [
      'Hold a dumbbell in the opposite hand to your standing leg — this helps your balance',
      'Hinge from your hip and let your rear leg float straight back as a counterweight',
      'Lower until your torso and rear leg form a straight line parallel to the floor',
      'Drive through your standing heel to return upright — complete all reps on one side before switching'
    ],
    ytUrl: 'https://youtu.be/Zfr6wizR8rs',
    goldStar: true,
    similarityGroup: 'rdl-unilateral',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-prone-curl',
    name: 'Dumbbell Prone Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Dumbbell',
    snapshot: 'Lie face down and curl dumbbell between feet up',
    cues: [
      'Lie face down on a bench and hold a dumbbell between the soles of both feet',
      'Curl your heels toward your glutes by bending your knees — do not let your hips lift off the bench',
      'Squeeze your hamstrings hard at the top before lowering slowly',
      'Use a lighter weight than you think — holding a dumbbell with your feet is unstable and requires control'
    ],
    ytUrl: 'https://youtu.be/ELOCsoDSmrg',
    goldStar: false,
    similarityGroup: 'lying-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    muscleGroup: 'hamstrings',
    equipment: 'Cable',
    snapshot: 'Rope between legs hinge forward then drive hips through',
    cues: [
      'Set the pulley low, attach a rope, and stand facing away with the rope between your legs',
      'Hinge your hips back until you feel a strong hamstring stretch — let the cable tension pull you into a good hip hinge',
      'Drive your hips forward and squeeze your glutes to stand — this is a hip thrust pattern, not a squat',
      'Keep your arms relaxed — they are just holding the rope, your hips are doing all the work'
    ],
    ytUrl: 'https://youtu.be/pv8e6OSyETE',
    goldStar: true,
    similarityGroup: 'cable-pull-through',
    alsoInProgram: true,
    tier: 'compound'
  },
  {
    id: 'cable-standing-curl',
    name: 'Cable Standing Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Cable',
    snapshot: 'Ankle cuff on low cable curl heel to glute standing',
    cues: [
      'Attach an ankle cuff to the low pulley and face the machine with one foot on the floor',
      'Hold the machine frame lightly for balance and curl your working heel up toward your glute',
      'Keep your thigh vertical and stationary — only your lower leg moves from the knee down',
      'Lower slowly against the cable tension — constant resistance throughout is the key advantage over the machine'
    ],
    ytUrl: 'https://youtu.be/1Tq3QdYUuHs',
    goldStar: true,
    similarityGroup: 'cable-standing-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-single-leg-rdl',
    name: 'Single Leg Romanian Deadlift (Cable)',
    muscleGroup: 'hamstrings',
    equipment: 'Cable',
    snapshot: 'Balance one leg hinging with low cable handle',
    cues: [
      'Set the pulley low and hold the handle in the opposite hand to your standing leg',
      'Hinge from your hip and let your rear leg float back as a counterweight to your torso',
      'The cable provides constant tension at the stretched position — better stimulus than a dumbbell which goes slack',
      'Drive through your standing heel to return and squeeze your glute at the top'
    ],
    ytUrl: 'https://youtu.be/Zfr6wizR8rs',
    goldStar: false,
    similarityGroup: 'rdl-unilateral',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-lying-curl',
    name: 'Lying Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Machine',
    snapshot: 'Face down on machine curl heels to glutes',
    cues: [
      'Adjust the pad so it sits just above your heels — not at your ankles or calves',
      'Curl your heels toward your glutes without letting your hips rise off the bench',
      'Squeeze your hamstrings hard at the peak and hold for one second before lowering',
      'Lower on a slow 3-count — the eccentric phase under load is where most of the growth stimulus comes from'
    ],
    ytUrl: 'https://youtu.be/1Tq3QdYUuHs',
    goldStar: true,
    similarityGroup: 'lying-curl',
    alsoInProgram: true,   // id: 'ham-curl-a'
    tier: 'isolation'
  },
  {
    id: 'machine-seated-curl',
    name: 'Seated Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Machine',
    snapshot: 'Seated with hip flexed curl legs down under pad',
    cues: [
      'Adjust the seat back so your hips are flexed — this keeps the hamstring in a stretched position throughout the set',
      'The seated position provides a better lengthened stimulus than lying curl, which current science shows drives more growth',
      'Pull your heels all the way down toward the floor for a full range of motion',
      'Return slowly — the hamstring is most loaded in the lengthened position on the way back up'
    ],
    ytUrl: 'https://youtu.be/ELOCsoDSmrg',
    goldStar: true,
    similarityGroup: 'seated-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'machine-single-leg-curl',
    name: 'Single Leg Lying Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Machine',
    snapshot: 'Curl one leg at a time on lying curl machine',
    cues: [
      'Use the same setup as the bilateral lying curl but work one leg at a time',
      'Reduce the weight significantly — one hamstring cannot curl what two can',
      'Keep your non-working leg still and flat against the bench pad',
      'One leg at a time reveals strength imbalances and forces each hamstring to do its fair share'
    ],
    ytUrl: 'https://youtu.be/1Tq3QdYUuHs',
    goldStar: false,
    similarityGroup: 'lying-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'smith-rdl',
    name: 'Smith Machine Romanian Deadlift',
    muscleGroup: 'hamstrings',
    equipment: 'Machine',
    snapshot: 'Hip hinge on Smith bar for guided hamstring stretch',
    cues: [
      'Position the Smith bar at mid-thigh height and stand close enough that it drags along your legs',
      'Unlock the bar and hinge your hips straight back — the fixed path helps beginners learn the movement',
      'Lower until you feel a strong hamstring stretch, keeping your back flat throughout',
      'Drive your hips forward to stand and re-rack by rotating the bar at the top'
    ],
    ytUrl: 'https://youtu.be/QR6HDEmBQNo',
    goldStar: false,
    similarityGroup: 'rdl-bilateral',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'nordic-curl',
    name: 'Nordic Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Bodyweight',
    snapshot: 'Kneel with feet anchored and lower torso to floor',
    cues: [
      'Kneel on a pad with your feet anchored under a bar, bench, or held by a partner',
      'Lower your torso toward the floor as slowly as possible by letting your knees extend — keep your hips straight',
      'Use your hands to catch yourself at the bottom if needed, then use them to push back to the start',
      'The eccentric phase is everything here — even beginners who cannot do a full rep get massive benefit from just the lowering'
    ],
    ytUrl: 'https://youtu.be/8zWDuWKdBZU',
    goldStar: true,
    similarityGroup: 'nordic-style-curl',
    alsoInProgram: true,   // id: 'ham-curl-b'
    tier: 'compound'
  },
  {
    id: 'glute-ham-raise',
    name: 'Glute-Ham Raise',
    muscleGroup: 'hamstrings',
    equipment: 'Bodyweight',
    snapshot: 'On GHR machine extend then curl body upright',
    cues: [
      'Set up on the GHR machine with your knees just behind the pad and feet secured in the footplate',
      'Lower your torso forward and down toward the floor with your hips fully extended — not bent',
      'Curl your body back up by flexing your knees and driving your hips into the pad',
      'Keep your torso rigid throughout — the movement comes from knee flexion and hip extension, not from bending at the waist'
    ],
    ytUrl: 'https://youtu.be/c2pWqsHR7FU',
    goldStar: false,
    similarityGroup: 'nordic-style-curl',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'stability-ball-curl',
    name: 'Stability Ball Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Bodyweight',
    snapshot: 'Heels on ball bridge up then curl ball in',
    cues: [
      'Lie on your back and place both heels on top of a stability ball with your legs straight',
      'Bridge your hips up so your body forms a straight line from shoulders to heels',
      'Roll the ball toward your glutes by curling your heels in — keep your hips high throughout',
      'Roll back slowly to the straight-leg position before the next rep — do not let your hips drop'
    ],
    ytUrl: 'https://youtu.be/1Tq3QdYUuHs',
    goldStar: true,
    similarityGroup: 'stability-ball-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-lying-curl',
    name: 'Band Lying Hamstring Curl',
    muscleGroup: 'hamstrings',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band at foot and curl prone against resistance',
    cues: [
      'Anchor the band at a low point, loop it around one ankle, and lie face down on the floor',
      'Curl your heel toward your glute against the band tension — keep your hips flat on the floor',
      'Squeeze hard at the top before lowering slowly — the band increases resistance the higher you curl',
      'This is a great at-home substitute for the lying curl machine when equipment is unavailable'
    ],
    ytUrl: 'https://youtu.be/1Tq3QdYUuHs',
    goldStar: false,
    similarityGroup: 'lying-curl',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-pull-through',
    name: 'Band Pull-Through',
    muscleGroup: 'hamstrings',
    equipment: 'Resistance Band',
    snapshot: 'Band between legs hinge forward and drive hips through',
    cues: [
      'Anchor the band at a low point behind you, step over it, and hold both ends between your legs',
      'Hinge your hips back until you feel a strong hamstring stretch — let the band tension guide you',
      'Drive your hips forward and squeeze your glutes to stand — same hip pattern as a cable pull-through',
      'Use a band with enough tension that you feel resistance throughout the entire range of motion'
    ],
    ytUrl: 'https://youtu.be/pv8e6OSyETE',
    goldStar: false,
    similarityGroup: 'cable-pull-through',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'band-good-morning',
    name: 'Band Good Morning',
    muscleGroup: 'hamstrings',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band looped over neck hinge forward',
    cues: [
      'Stand on the middle of the band with both feet and loop the ends over the back of your neck and shoulders',
      'Hinge your hips back and lean your torso forward with soft knees — keep your back completely flat',
      'Lower until your torso is near parallel to the floor and you feel a deep hamstring stretch',
      'Drive your hips forward to return to standing — band resistance increases as you stand up'
    ],
    ytUrl: 'https://youtu.be/YA-h3n9L4YU',
    goldStar: false,
    similarityGroup: 'good-morning',
    alsoInProgram: false,
    tier: 'compound'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HAMSTRING_EXERCISE_LIBRARY };
}
