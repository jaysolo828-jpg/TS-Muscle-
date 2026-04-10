/**
 * T&S Muscle — Forearm Exercise Library
 * All forearm exercises across every equipment category.
 *
 * Key anatomy note:
 *   Wrist flexors (flexor carpi radialis/ulnaris) – front of forearm; trained by wrist curls.
 *   Wrist extensors (extensor carpi radialis/ulnaris) – back of forearm; trained by reverse curls
 *     and wrist extensions.
 *   Brachioradialis – the thick bridge muscle on the thumb side; trained by hammer/neutral curls.
 *   Grip strength – finger flexors; trained by carries, dead hangs, and pinch work.
 *   Complete forearm development requires flexion, extension, and grip patterns.
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

const FOREARM_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-wrist-curl',
    name: 'Barbell Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Barbell',
    snapshot: 'Forearms on bench curl bar up with wrists only',
    cues: [
      'Rest your forearms on a bench or your thighs with your wrists hanging off the edge and palms facing up',
      'Let the bar roll to your fingertips at the bottom — this full stretch is critical for wrist flexor development',
      'Curl your wrists upward as high as they will go and squeeze the flexors at the peak',
      'Lower slowly on a 3-count — the eccentric is where the wrist flexors are most loaded'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: true,
    similarityGroup: 'wrist-curl-barbell',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'barbell-reverse-wrist-curl',
    name: 'Barbell Reverse Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Barbell',
    snapshot: 'Forearms on bench extend bar up with palms down',
    cues: [
      'Rest your forearms on a bench with your wrists hanging off the edge and palms facing down',
      'Lower your wrists toward the floor for a full extensor stretch, then raise them as high as possible',
      'The wrist extensors are significantly weaker than the flexors — use about half the weight',
      'Move slowly in both directions — wrist extensors are prone to strain if loaded carelessly'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: false,
    similarityGroup: 'wrist-extension-barbell',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'behind-back-wrist-curl',
    name: 'Behind-the-Back Barbell Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Barbell',
    snapshot: 'Hold bar behind back and curl wrists upward',
    cues: [
      'Stand holding a barbell behind your body with a pronated grip at arm length',
      'Let the bar roll to your fingertips, then curl your wrists upward against gravity',
      'The behind-body position allows a longer range of motion than the bench-supported version',
      'Keep your forearms still — only your wrists move throughout the entire set'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: false,
    similarityGroup: 'wrist-curl-barbell',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-wrist-curl',
    name: 'Dumbbell Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Dumbbell',
    snapshot: 'Single dumbbell wrist curl forearm resting on thigh',
    cues: [
      'Sit on a bench and rest one forearm on your thigh with your wrist hanging off your knee',
      'Hold the dumbbell with a supinated grip and lower it until you feel a full flexor stretch',
      'Curl your wrist upward as far as possible and squeeze at the peak before lowering',
      'One arm at a time lets you focus on range of motion and feel for each side independently'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: false,
    similarityGroup: 'wrist-curl-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-reverse-wrist-curl',
    name: 'Dumbbell Reverse Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Dumbbell',
    snapshot: 'Forearm on thigh extend wrist up with palm facing down',
    cues: [
      'Rest one forearm on your thigh with your wrist hanging off your knee, palm facing down',
      'Lower your wrist toward the floor for a full extensor stretch before raising',
      'Raise your wrist as high as possible — the range of motion here is smaller than a flexion curl',
      'Use very light weight — wrist extensors fatigue quickly and are easily strained by excessive load'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: true,
    similarityGroup: 'wrist-extension-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    muscleGroup: 'forearms',
    equipment: 'Dumbbell',
    snapshot: 'Walk heavy dumbbells at sides gripping hard',
    cues: [
      'Pick up the heaviest dumbbells you can hold and walk with purpose for 20-40 meters',
      'Stand tall with your shoulders packed back and down — do not let the weight pull them forward',
      'Grip as hard as you can throughout — this is the point, the forearm and hand are under constant isometric load',
      'Walk in a straight controlled line — this also trains core stability and posture under load'
    ],
    ytUrl: 'https://youtu.be/rt0MR6CTCGE',
    goldStar: true,
    similarityGroup: 'loaded-carry',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-wrist-curl',
    name: 'Cable Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Cable',
    snapshot: 'Forearm on pad curl cable handle with wrist',
    cues: [
      'Set the pulley low and kneel or sit facing it with your forearm resting on a pad or your thigh',
      'Hold the handle with a supinated grip and let your wrist drop to a full stretch before each rep',
      'Curl your wrist upward against the cable — the constant tension at the bottom stretch is the advantage over dumbbells',
      'Lower slowly on every rep — the cable resists throughout the full range in both directions'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: false,
    similarityGroup: 'wrist-curl-cable',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-reverse-wrist-curl',
    name: 'Cable Reverse Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Cable',
    snapshot: 'Forearm on pad extend wrist against low cable',
    cues: [
      'Set the pulley low and rest your forearm on a pad with your palm facing down, holding the handle',
      'Lower your wrist toward the floor then extend it upward as high as possible against the cable',
      'The cable maintains tension at the fully extended position — a key advantage over the barbell version',
      'Use light weight and controlled movement — wrist extensors are more vulnerable to overuse than flexors'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: true,
    similarityGroup: 'wrist-extension-cable',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'wrist-roller',
    name: 'Wrist Roller',
    muscleGroup: 'forearms',
    equipment: 'Machine',
    snapshot: 'Roll weight up and down on rope alternating hands',
    cues: [
      'Hold the wrist roller at shoulder height with arms extended straight in front of you',
      'Alternate wrist curling each hand to wind the rope and raise the weight plate',
      'Once fully wound, reverse the winding to lower the plate back down — both directions count',
      'Keep your arms parallel to the floor throughout — letting them drop shifts the load away from your forearms'
    ],
    ytUrl: 'https://youtu.be/gZMiLNfNDN0',
    goldStar: true,
    similarityGroup: 'wrist-roller',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'plate-pinch',
    name: 'Plate Pinch',
    muscleGroup: 'forearms',
    equipment: 'Bodyweight',
    snapshot: 'Pinch two plates together between fingers and thumb',
    cues: [
      'Hold two weight plates together smooth-side out with only your fingers and thumb — no palm contact',
      'Stand tall and hold for time — typically 20-45 seconds per set',
      'The pinch grip isolates the finger flexors and thumb in a way that bar-grip exercises cannot replicate',
      'Progress by using a single thicker plate or by increasing hold time'
    ],
    ytUrl: 'https://youtu.be/jt4DJIxwMac',
    goldStar: true,
    similarityGroup: 'grip-strength',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'dead-hang',
    name: 'Dead Hang',
    muscleGroup: 'forearms',
    equipment: 'Bodyweight',
    snapshot: 'Hang from pull-up bar at full arm extension',
    cues: [
      'Jump or step to a bar and hang with fully extended arms and a relaxed shoulder girdle',
      'Grip the bar as hard as you can throughout the hold — passive hanging defeats the purpose',
      'Keep your body as still as possible — swinging reduces the grip demand and also stresses the shoulder',
      'Build hold time progressively — 60 seconds is a good initial target for grip endurance'
    ],
    ytUrl: 'https://youtu.be/t-Qb14N9gYM',
    goldStar: false,
    similarityGroup: 'grip-strength',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'towel-pull-up',
    name: 'Towel Pull-Up',
    muscleGroup: 'forearms',
    equipment: 'Bodyweight',
    snapshot: 'Drape towels over bar and pull up gripping cloth',
    cues: [
      'Drape two towels over a pull-up bar and grip each towel near the bar — not at the ends',
      'The unstable cloth requires your grip and forearms to work far harder than gripping a solid bar',
      'Pull up with the same mechanics as a standard pull-up — elbows toward hips, chin over bar',
      'If you cannot complete a full rep, use the towels for dead hangs first to build grip endurance'
    ],
    ytUrl: 'https://youtu.be/t-Qb14N9gYM',
    goldStar: false,
    similarityGroup: 'grip-strength',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-wrist-curl',
    name: 'Band Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'Resistance Band',
    snapshot: 'Step on band and curl wrist upward seated',
    cues: [
      'Sit on a bench and step on the band, holding the other end with a supinated grip, forearm resting on your thigh',
      'Lower your wrist to a full stretch then curl it upward against the band tension',
      'The band provides increasing resistance as you curl — hardest at peak wrist flexion',
      'Move slowly in both directions — band resistance is active throughout the full range unlike a plate at rest'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: false,
    similarityGroup: 'wrist-curl-band',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-wrist-extension',
    name: 'Band Wrist Extension',
    muscleGroup: 'forearms',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band low and extend wrist against resistance',
    cues: [
      'Anchor the band at floor level and hold it with a pronated grip, forearm resting on your thigh',
      'Lower your wrist toward the floor then extend it upward against the band',
      'The band keeps tension at the stretched position, which is critical for wrist extensor development',
      'Use a light band — wrist extensors are a small muscle group and will fatigue quickly under heavy load'
    ],
    ytUrl: 'https://youtu.be/pO2W6cTG-Wc',
    goldStar: false,
    similarityGroup: 'wrist-extension-band',
    alsoInProgram: false,
    tier: 'isolation'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FOREARM_EXERCISE_LIBRARY };
}
