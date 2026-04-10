/**
 * T&S Muscle — Chest Exercise Library
 * All chest exercises across every equipment category.
 *
 * Dedup notes (duplicate IDs removed):
 *   close-grip-bench-press — REMOVED from this file. Canonical entry lives in
 *             exercise-library-triceps.js (primary mover is the tricep; the
 *             narrow grip is the defining tricep compound movement).
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

const CHEST_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    muscleGroup: 'chest',
    equipment: 'Barbell',
    snapshot: 'Press bar from chest to full lockout',
    cues: [
      'Retract your shoulder blades and keep them pinched throughout the set',
      'Plant your feet flat and drive them into the floor for a stable base',
      'Lower the bar to the lower half of your chest, not your neck',
      'Keep your wrists stacked over your elbows as you press'
    ],
    ytUrl: 'https://youtu.be/ysUTNll8JQ8',
    goldStar: true,
    similarityGroup: 'horizontal-press-barbell',
    alsoInProgram: true,   // id: 'bench'
    tier: 'compound'
  },
  {
    id: 'decline-barbell-press',
    name: 'Decline Barbell Press',
    muscleGroup: 'chest',
    equipment: 'Barbell',
    snapshot: 'Press bar on declined bench for lower chest',
    cues: [
      'Lock your feet securely under the pads before unracking',
      'Lower the bar to your lower chest, just above the sternum base',
      'Keep elbows at roughly 75 degrees — not flared out wide',
      'Press in a slight arc back toward your lower face at lockout'
    ],
    ytUrl: 'https://youtu.be/6fotcWsMb0c',
    goldStar: false,
    similarityGroup: 'decline-press-barbell',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'incline-barbell-press',
    name: 'Incline Barbell Press',
    muscleGroup: 'chest',
    equipment: 'Barbell',
    snapshot: 'Press bar up on inclined bench for upper chest',
    cues: [
      'Set the bench to 30-45 degrees — steeper shifts work to front delts',
      'Keep your back flat against the pad, no excessive arch',
      'Lower the bar to your upper chest, not your chin or throat',
      'Drive the bar straight up and slightly back to lockout'
    ],
    ytUrl: 'https://youtu.be/DbFgADa2PL8',
    goldStar: true,
    similarityGroup: 'incline-press-barbell',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'floor-press-barbell',
    name: 'Barbell Floor Press',
    muscleGroup: 'chest',
    equipment: 'Barbell',
    snapshot: 'Bench press lying on floor, limited range',
    cues: [
      'Keep your legs flat or bent — either works, choose what is stable',
      'Lower until your triceps touch the floor, pause briefly, then press',
      'This shortened range reduces shoulder stress at the bottom',
      'Squeeze the bar hard and tuck elbows slightly to protect the joint'
    ],
    ytUrl: 'https://youtu.be/T2gXB8DvTvY',
    goldStar: false,
    similarityGroup: 'horizontal-press-barbell',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-bench-press',
    name: 'Dumbbell Bench Press',
    muscleGroup: 'chest',
    equipment: 'Dumbbell',
    snapshot: 'Press two dumbbells from chest to full extension',
    cues: [
      'Start with dumbbells at chest height, palms facing forward',
      'Allow a natural arc — the dumbbells can drift slightly inward at the top',
      'Lower until you feel a good stretch without losing shoulder position',
      'Keep your core tight and lower back from lifting off the bench'
    ],
    ytUrl: 'https://youtu.be/Y_7aHqXeCfQ',
    goldStar: true,
    similarityGroup: 'horizontal-press-db',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    equipment: 'Dumbbell',
    snapshot: 'Press dumbbells on incline for upper chest emphasis',
    cues: [
      'Set bench to 30-45 degrees — this angle is the sweet spot for upper chest',
      'Lower dumbbells until they are level with your upper chest',
      'Keep elbows just under wrists throughout the movement',
      'Press up and slightly inward, following a natural arc'
    ],
    ytUrl: 'https://youtu.be/hChjZQhX1Ls',
    goldStar: true,
    similarityGroup: 'incline-press-db',
    alsoInProgram: true,   // id: 'incline'
    tier: 'compound'
  },
  {
    id: 'decline-db-press',
    name: 'Decline Dumbbell Press',
    muscleGroup: 'chest',
    equipment: 'Dumbbell',
    snapshot: 'Press dumbbells on decline for lower chest focus',
    cues: [
      'Secure feet firmly before starting — decline is unforgiving if you slip',
      'Lower dumbbells to the outer lower chest, elbows at 60-75 degrees',
      'Press straight up and touch the dumbbells lightly at the top',
      'Control the descent over 2-3 seconds for maximum tension'
    ],
    ytUrl: 'https://youtu.be/LfyQSUdqB60',
    goldStar: false,
    similarityGroup: 'decline-press-db',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-flye',
    name: 'Dumbbell Flye',
    muscleGroup: 'chest',
    equipment: 'Dumbbell',
    snapshot: 'Arc dumbbells wide then squeeze together overhead',
    cues: [
      'Maintain a slight bend in your elbows throughout — never lock them out',
      'Think of hugging a big tree as you arc the weights back up',
      'Stop at chest level on the way down — going too deep strains the shoulder',
      'Squeeze the chest hard at the top but do not crash the weights together'
    ],
    ytUrl: 'https://youtu.be/eozdVDA78K0',
    goldStar: false,
    similarityGroup: 'flye-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'incline-db-flye',
    name: 'Incline Dumbbell Flye',
    muscleGroup: 'chest',
    equipment: 'Dumbbell',
    snapshot: 'Wide arc on incline bench targets upper chest stretch',
    cues: [
      'Set bench to 30 degrees — steeper shifts too much tension to front delts',
      'Keep a consistent slight bend in the elbows all the way through',
      'Lower dumbbells until you feel a deep stretch in the upper chest',
      'Initiate the upward squeeze by thinking chest first, not arms'
    ],
    ytUrl: 'https://youtu.be/0G2_XV7slIg',
    goldStar: false,
    similarityGroup: 'flye-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-pullover',
    name: 'Dumbbell Pullover',
    muscleGroup: 'chest',
    equipment: 'Dumbbell',
    snapshot: 'Arc dumbbell overhead and back to chest level',
    cues: [
      'Keep hips low — this keeps stretch on the chest rather than lats',
      'Maintain a slight elbow bend and hold it constant throughout',
      'Lower the dumbbell until you feel the chest and ribcage fully stretched',
      'Pull back by squeezing your chest and pec minor, not your lats'
    ],
    ytUrl: 'https://youtu.be/hpDAMhh4KNc',
    goldStar: false,
    similarityGroup: 'pullover',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-flye-mid',
    name: 'Cable Flye (Mid)',
    muscleGroup: 'chest',
    equipment: 'Cable',
    snapshot: 'Bring cable handles together at chest height',
    cues: [
      'Set pulleys at shoulder height and step forward into a stagger stance',
      'Maintain a slight bend in the elbows and keep it consistent',
      'Lead with your elbows and think about squeezing the chest inward',
      'Control the return — the stretch under load is where the gains are'
    ],
    ytUrl: 'https://youtu.be/fwN2ECQsvGg',
    goldStar: true,
    similarityGroup: 'cable-flye',
    alsoInProgram: true,   // id: 'flye'
    tier: 'isolation'
  },
  {
    id: 'cable-flye-high',
    name: 'High Cable Crossover',
    muscleGroup: 'chest',
    equipment: 'Cable',
    snapshot: 'Pull high cables down and across to target lower chest',
    cues: [
      'Set pulleys above head height and lean slightly forward',
      'Pull handles down and inward in an arc, ending at hip level',
      'Keep elbows soft and let the shoulder blade move naturally',
      'Pause and squeeze hard when hands cross at the bottom'
    ],
    ytUrl: 'https://youtu.be/taI4XduLpTk',
    goldStar: false,
    similarityGroup: 'cable-flye',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-flye-low',
    name: 'Low Cable Crossover',
    muscleGroup: 'chest',
    equipment: 'Cable',
    snapshot: 'Pull low cables up and across for upper chest',
    cues: [
      'Set pulleys at ankle or hip height and lean slightly forward',
      'Pull handles up and inward, finishing at chest or chin height',
      'Focus on driving the motion from the upper chest, not shoulders',
      'Squeeze the upper chest at the top and hold for one count'
    ],
    ytUrl: 'https://youtu.be/taI4XduLpTk',
    goldStar: false,
    similarityGroup: 'cable-flye',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-chest-press',
    name: 'Cable Chest Press',
    muscleGroup: 'chest',
    equipment: 'Cable',
    snapshot: 'Press handles forward from chest with constant tension',
    cues: [
      'Stand in a stagger stance and brace your core before pressing',
      'Keep elbows at roughly 60-75 degrees — not flared to 90',
      'Press straight out and let hands travel slightly inward at extension',
      'Control the return slowly — cables keep tension through the whole rep'
    ],
    ytUrl: 'https://youtu.be/LNH_lPYJnpw',
    goldStar: false,
    similarityGroup: 'horizontal-press-cable',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'cable-incline-press',
    name: 'Cable Incline Press',
    muscleGroup: 'chest',
    equipment: 'Cable',
    snapshot: 'Press low cables upward at an incline angle',
    cues: [
      'Set pulleys low, sit or stand angled away, and press up at 45 degrees',
      'Focus on driving from the upper chest, avoid shrugging the shoulders',
      'Squeeze at the top when hands are nearly together',
      'Return slowly for maximum upper chest stretch under load'
    ],
    ytUrl: 'https://youtu.be/LNH_lPYJnpw',
    goldStar: false,
    similarityGroup: 'incline-press-cable',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'single-arm-cable-flye',
    name: 'Single-Arm Cable Flye',
    muscleGroup: 'chest',
    equipment: 'Cable',
    snapshot: 'One arm cable arc to fix left-right strength imbalance',
    cues: [
      'Stand side-on to the pulley and brace with your free hand on the frame',
      'Arc the handle across your body while keeping the elbow angle fixed',
      'Focus on feeling the stretch at the start and squeeze at the end',
      'Complete all reps on the weaker side first, then match on the stronger'
    ],
    ytUrl: 'https://youtu.be/fwN2ECQsvGg',
    goldStar: false,
    similarityGroup: 'cable-flye',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    muscleGroup: 'chest',
    equipment: 'Machine',
    snapshot: 'Push machine handles forward from seated chest position',
    cues: [
      'Adjust the seat so handles are at mid-chest height when gripped',
      'Keep your back flat against the pad throughout every rep',
      'Press to just short of full lockout to maintain chest tension',
      'Lower slowly and feel the chest stretch before driving the next rep'
    ],
    ytUrl: 'https://youtu.be/NsEbXsTwas8',
    goldStar: true,
    similarityGroup: 'machine-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'pec-deck-flye',
    name: 'Pec Deck Flye',
    muscleGroup: 'chest',
    equipment: 'Machine',
    snapshot: 'Squeeze forearms together on pec deck machine',
    cues: [
      'Adjust seat so your elbows are level with your shoulders on the pads',
      'Lead with your elbows and think of squeezing your chest inward',
      'Stop just before your forearms meet — keep tension rather than resting',
      'Control the return and feel a full stretch before the next rep'
    ],
    ytUrl: 'https://youtu.be/Z57CtFmRMxA',
    goldStar: true,
    similarityGroup: 'machine-flye',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'smith-machine-bench',
    name: 'Smith Machine Bench Press',
    muscleGroup: 'chest',
    equipment: 'Machine',
    snapshot: 'Fixed-path barbell press on Smith machine flat bench',
    cues: [
      'Position the bench so the bar touches your lower chest at the bottom',
      'Keep your feet planted and maintain your natural arch throughout',
      'The fixed path means you can push more weight safely solo',
      'Lower fully to the chest — do not half-rep just because it feels heavier'
    ],
    ytUrl: 'https://youtu.be/E4G-M8Vvzps',
    goldStar: false,
    similarityGroup: 'machine-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'smith-machine-incline',
    name: 'Smith Machine Incline Press',
    muscleGroup: 'chest',
    equipment: 'Machine',
    snapshot: 'Fixed-path incline press for upper chest on Smith',
    cues: [
      'Set bench to 30-45 degrees and position so bar hits upper chest at bottom',
      'Do not let the fixed bar path force your elbows to flare unnaturally',
      'Drive straight up — the fixed path handles any lateral stability for you',
      'Use a full range of motion; do not cut the movement short'
    ],
    ytUrl: 'https://youtu.be/DbFgADa2PL8',
    goldStar: false,
    similarityGroup: 'incline-press-machine',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'hammer-strength-incline',
    name: 'Hammer Strength Incline Press',
    muscleGroup: 'chest',
    equipment: 'Machine',
    snapshot: 'Plate-loaded incline machine press with neutral grip',
    cues: [
      'Adjust the seat height so hands start at upper chest level',
      'Drive through the chest — resist the urge to use shoulder momentum',
      'Neutral grip reduces shoulder impingement compared to barbell incline',
      'Pause at the bottom for one count to eliminate stored elastic energy'
    ],
    ytUrl: 'https://youtu.be/VesHgJR14E8',
    goldStar: false,
    similarityGroup: 'incline-press-machine',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'push-up',
    name: 'Push-Up',
    muscleGroup: 'chest',
    equipment: 'Bodyweight',
    snapshot: 'Lower and press your chest from the floor up',
    cues: [
      'Keep your body in a straight line from head to heels — no sagging hips',
      'Place hands slightly wider than shoulder-width and point fingers forward',
      'Lower until your chest nearly touches the floor for full range',
      'Squeeze your glutes and core to prevent your lower back from arching'
    ],
    ytUrl: 'https://youtu.be/IODxDxX7oi4',
    goldStar: true,
    similarityGroup: 'bodyweight-horizontal-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'wide-grip-push-up',
    name: 'Wide-Grip Push-Up',
    muscleGroup: 'chest',
    equipment: 'Bodyweight',
    snapshot: 'Wide hand placement shifts stress to outer chest',
    cues: [
      'Place hands much wider than shoulder-width — roughly 1.5x shoulder width',
      'Elbows will flare more; keep this intentional and controlled',
      'Lower chest between your hands, not in front of them',
      'Body stays rigid — place a resistance band across your back to feel sagging'
    ],
    ytUrl: 'https://youtu.be/IODxDxX7oi4',
    goldStar: false,
    similarityGroup: 'bodyweight-horizontal-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'incline-push-up',
    name: 'Incline Push-Up',
    muscleGroup: 'chest',
    equipment: 'Bodyweight',
    snapshot: 'Hands elevated on surface for easier push-up regression',
    cues: [
      'The higher the surface, the less bodyweight you press — use to scale down',
      'Keep the same straight line from head to heels as a standard push-up',
      'Lower your chest to the surface for a full range of motion',
      'Good for learning the pattern before progressing to a flat push-up'
    ],
    ytUrl: 'https://youtu.be/IODxDxX7oi4',
    goldStar: false,
    similarityGroup: 'bodyweight-horizontal-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'decline-push-up',
    name: 'Decline Push-Up',
    muscleGroup: 'chest',
    equipment: 'Bodyweight',
    snapshot: 'Feet elevated push-up targets upper chest fibres',
    cues: [
      'Place feet on a bench or box — higher feet shifts more work to upper chest',
      'Keep your core braced to prevent your lower back from hyperextending',
      'Hands stay at shoulder width or slightly wider for comfort',
      'Lower your chest toward the floor — do not stop halfway down'
    ],
    ytUrl: 'https://youtu.be/IODxDxX7oi4',
    goldStar: false,
    similarityGroup: 'bodyweight-decline-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'chest-dip',
    name: 'Chest Dip',
    muscleGroup: 'chest',
    equipment: 'Bodyweight',
    snapshot: 'Dip forward-leaning to emphasise chest over triceps',
    cues: [
      'Lean your torso forward throughout — upright posture shifts focus to triceps',
      'Lower until your upper arms are roughly parallel to the floor',
      'Keep elbows slightly flared outward rather than tucked tight',
      'Press back up by squeezing the chest and think of pushing the bars apart'
    ],
    ytUrl: 'https://youtu.be/2z8JmcrW-As',
    goldStar: true,
    similarityGroup: 'bodyweight-dip',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'weighted-push-up',
    name: 'Weighted Push-Up',
    muscleGroup: 'chest',
    equipment: 'Bodyweight',
    snapshot: 'Push-up with plate or vest for progressive overload',
    cues: [
      'Place a weight plate on your upper back or wear a weighted vest',
      'Have a training partner place the plate to keep your form intact',
      'All standard push-up cues apply — rigid body, full range, chest to floor',
      'Progress by adding 5 lb increments rather than changing form'
    ],
    ytUrl: 'https://youtu.be/IODxDxX7oi4',
    goldStar: false,
    similarityGroup: 'bodyweight-horizontal-press',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-chest-press',
    name: 'Resistance Band Chest Press',
    muscleGroup: 'chest',
    equipment: 'Resistance Band',
    snapshot: 'Press band handles forward from chest with increasing tension',
    cues: [
      'Anchor the band behind you at chest height and step forward for tension',
      'Keep elbows at 60-75 degrees — do not let them flare to 90 degrees',
      'Press straight out, let hands drift slightly inward at full extension',
      'Control the return — bands increase tension as you stretch them more'
    ],
    ytUrl: 'https://youtu.be/8lDC4Ri9zAQ',
    goldStar: true,
    similarityGroup: 'band-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'band-flye',
    name: 'Resistance Band Flye',
    muscleGroup: 'chest',
    equipment: 'Resistance Band',
    snapshot: 'Arc band handles together in a flye pattern',
    cues: [
      'Anchor band behind you and hold handles with a slight elbow bend',
      'Bring handles together in an arc, squeezing the chest at the front',
      'Keep your core tight — do not let the band pull you backward',
      'Use a band with enough resistance that the last two reps are a challenge'
    ],
    ytUrl: 'https://youtu.be/8lDC4Ri9zAQ',
    goldStar: false,
    similarityGroup: 'band-flye',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-push-up',
    name: 'Resistance Band Push-Up',
    muscleGroup: 'chest',
    equipment: 'Resistance Band',
    snapshot: 'Push-up with band across back for added resistance',
    cues: [
      'Thread the band under your palms and loop it across your upper back',
      'The band adds resistance at the top where push-ups are normally easiest',
      'Keep all standard push-up cues — rigid body, full range of motion',
      'Choose a band tension that makes the last two reps genuinely hard'
    ],
    ytUrl: 'https://youtu.be/8lDC4Ri9zAQ',
    goldStar: false,
    similarityGroup: 'bodyweight-horizontal-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'band-incline-press',
    name: 'Resistance Band Incline Press',
    muscleGroup: 'chest',
    equipment: 'Resistance Band',
    snapshot: 'Press band upward at incline angle for upper chest',
    cues: [
      'Anchor band low, step forward, and press at a 45-degree upward angle',
      'Focus on driving from the upper chest, not the front shoulder',
      'Maintain tension in the band at the bottom — do not let it go slack',
      'Squeeze at the top and hold one second before returning'
    ],
    ytUrl: 'https://youtu.be/8lDC4Ri9zAQ',
    goldStar: false,
    similarityGroup: 'band-press',
    alsoInProgram: false,
    tier: 'compound'
  }

];

// Export for use in other modules or directly in index.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHEST_EXERCISE_LIBRARY };
}
