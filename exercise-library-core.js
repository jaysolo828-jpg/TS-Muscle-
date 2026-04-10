/**
 * T&S Muscle — Core Exercise Library
 * All core exercises across every equipment category.
 *
 * Movement patterns covered:
 *   spinal-flexion   – crunches, sit-ups (rectus abdominis)
 *   leg-raise        – hip flexion / lower ab emphasis
 *   plank            – anti-extension isometric
 *   side-plank       – lateral isometric stability
 *   anti-rotation    – Pallof press pattern (transverse abdominis, obliques)
 *   rotation         – wood chop, twists (obliques)
 *   lateral-flexion  – side bends (obliques, QL)
 *   rollout          – dynamic anti-extension (rectus abdominis)
 *   dead-bug         – contralateral stability (deep core)
 *   back-extension   – posterior chain / erector spinae
 *   carry            – loaded unilateral stability (full core)
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
 *   alsoInProgram   – false for all (no core exercises currently in program)
 *   tier            – 'compound' (multi-joint) or 'isolation' (single-joint)
 *                     All core exercises are 'isolation' — they target core musculature
 *                     specifically without loading primary movers in other muscle groups.
 */

const CORE_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-rollout',
    name: 'Barbell Rollout',
    muscleGroup: 'core',
    equipment: 'Barbell',
    snapshot: 'Roll barbell forward from knees extending body out',
    cues: [
      'Load a small amount of weight on each side to keep the bar from sliding and kneel on a pad',
      'Brace your core hard before you move — your spine must stay neutral the entire time',
      'Roll the bar forward as far as you can without your hips sagging or your lower back arching',
      'Pull the bar back by driving your elbows toward your knees — your abs do the pulling, not your arms'
    ],
    ytUrl: 'https://youtu.be/L78bRBGCAIo',
    goldStar: false,
    similarityGroup: 'rollout',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'landmine-rotation',
    name: 'Landmine Rotation',
    muscleGroup: 'core',
    equipment: 'Barbell',
    snapshot: 'Sweep barbell end in arc from hip to hip standing',
    cues: [
      'Anchor the bar in a landmine or corner and hold the sleeve with both hands at chest height',
      'Keep your arms straight and rotate your torso to sweep the bar from one hip to the other in a controlled arc',
      'Your hips should rotate slightly — this is a full rotational movement, not just an arm swing',
      'Control the arc both ways — the eccentric return against rotation is where the oblique work happens'
    ],
    ytUrl: 'https://youtu.be/nCKG7nMNhHs',
    goldStar: false,
    similarityGroup: 'rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'barbell-suitcase-carry',
    name: 'Barbell Suitcase Carry',
    muscleGroup: 'core',
    equipment: 'Barbell',
    snapshot: 'Walk holding barbell one side fighting lateral tilt',
    cues: [
      'Hold a loaded barbell in one hand at your side and walk for distance or time',
      'Resist the urge to lean toward the weight — your core must fight to keep your torso completely upright',
      'Keep your shoulder on the loaded side packed down and back, not shrugged up toward your ear',
      'Short steps, tall posture, deliberate breathing — this is a core stability drill, not a race'
    ],
    ytUrl: 'https://youtu.be/YzZ2fPBr1DE',
    goldStar: false,
    similarityGroup: 'carry',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'weighted-crunch',
    name: 'Weighted Crunch',
    muscleGroup: 'core',
    equipment: 'Dumbbell',
    snapshot: 'Hold dumbbell at chest crunch shoulders off floor',
    cues: [
      'Hold a dumbbell or plate against your chest and lie on your back with knees bent',
      'Curl your shoulders off the floor by contracting your abs — your lower back stays in contact with the floor',
      'Do not pull on your neck or use momentum — the movement is small and controlled',
      'Pause at the top of the crunch for one second before lowering slowly — the slow eccentric adds more stimulus than the upward crunch'
    ],
    ytUrl: 'https://youtu.be/9FGilxCbdz8',
    goldStar: false,
    similarityGroup: 'spinal-flexion',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-russian-twist',
    name: 'Dumbbell Russian Twist',
    muscleGroup: 'core',
    equipment: 'Dumbbell',
    snapshot: 'Seated lean back rotate dumbbell side to side',
    cues: [
      'Sit on the floor with knees bent, heels slightly raised, and lean back until you feel your abs engage',
      'Hold a dumbbell with both hands and rotate your torso to touch it to the floor on each side',
      'The rotation comes from your ribcage twisting — do not just swing your arms across',
      'Keep your lower back from rounding — if it collapses, raise your feet less or use a lighter weight'
    ],
    ytUrl: 'https://youtu.be/wkD8rjkodUI',
    goldStar: false,
    similarityGroup: 'rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-side-bend',
    name: 'Dumbbell Side Bend',
    muscleGroup: 'core',
    equipment: 'Dumbbell',
    snapshot: 'Stand hold dumbbell bend sideways and return upright',
    cues: [
      'Hold a dumbbell in one hand at your side and stand tall with your other hand behind your head',
      'Bend directly to the side — not forward or backward — and feel the stretch on the opposite oblique',
      'Drive back to upright by contracting the oblique on the weighted side',
      'Do not use momentum — a slow, deliberate side bend is far more effective than swinging the weight'
    ],
    ytUrl: 'https://youtu.be/LQdgGEEgdEo',
    goldStar: false,
    similarityGroup: 'lateral-flexion',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-suitcase-carry',
    name: 'Dumbbell Suitcase Carry',
    muscleGroup: 'core',
    equipment: 'Dumbbell',
    snapshot: 'Walk holding heavy dumbbell one side torso upright',
    cues: [
      'Hold a heavy dumbbell in one hand at your side and walk with purpose for 20-40 meters',
      'Keep your torso completely upright — do not lean toward or away from the weight',
      'Your obliques and QL are working hard to resist the lateral pull — that is the entire point',
      'Keep your loaded shoulder depressed and your chin up — collapsing the shoulder transfers stress to your neck and traps'
    ],
    ytUrl: 'https://youtu.be/YzZ2fPBr1DE',
    goldStar: true,
    similarityGroup: 'carry',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    muscleGroup: 'core',
    equipment: 'Cable',
    snapshot: 'Kneel pull rope down crunching abs against weight',
    cues: [
      'Attach a rope to a high pulley, kneel on a pad, and hold the rope behind your head or beside your ears',
      'Crunch your ribcage toward your pelvis — do not pull down with your arms or flex at the hip',
      'Keep your hips locked in place throughout — if your hips move, the resistance is being shared with your hip flexors',
      'Lower slowly back to the start for a full stretch — the loaded eccentric is a major advantage over bodyweight crunches'
    ],
    ytUrl: 'https://youtu.be/2fbujeH3F0E',
    goldStar: true,
    similarityGroup: 'spinal-flexion',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-pallof-press',
    name: 'Cable Pallof Press',
    muscleGroup: 'core',
    equipment: 'Cable',
    snapshot: 'Stand sideways to cable press handle straight out resisting rotation',
    cues: [
      'Set the pulley at chest height and stand sideways to the machine, holding the handle with both hands at your sternum',
      'Press the handle straight out in front of you and hold for two seconds — resist any rotation toward the cable',
      'The further you press the handle out, the harder your core works to resist the rotational pull',
      'Return the handle to your chest under control — do not let the cable yank your torso toward the machine'
    ],
    ytUrl: 'https://youtu.be/AabdomSpfZs',
    goldStar: true,
    similarityGroup: 'anti-rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-wood-chop',
    name: 'Cable Wood Chop (High to Low)',
    muscleGroup: 'core',
    equipment: 'Cable',
    snapshot: 'Pull cable from high outside hip across body down',
    cues: [
      'Set the pulley high and stand sideways to the machine, holding the handle with both hands',
      'Pull the handle diagonally across your body from high outside your shoulder down to your opposite hip',
      'Your torso rotates through the movement — think of throwing a punch from high to low',
      'Control the return against the cable tension — the obliques work just as hard resisting the return'
    ],
    ytUrl: 'https://youtu.be/nCKG7nMNhHs',
    goldStar: true,
    similarityGroup: 'rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-reverse-wood-chop',
    name: 'Cable Reverse Wood Chop (Low to High)',
    muscleGroup: 'core',
    equipment: 'Cable',
    snapshot: 'Pull cable from low hip up across body overhead',
    cues: [
      'Set the pulley low and stand sideways to the machine, holding the handle with both hands at your outer hip',
      'Pull diagonally upward across your body from your outer hip to your opposite shoulder overhead',
      'Rotate your torso and extend your arms as you go — this hits the external oblique of the upper side',
      'Return slowly against the cable — control the movement in both directions for full oblique development'
    ],
    ytUrl: 'https://youtu.be/nCKG7nMNhHs',
    goldStar: false,
    similarityGroup: 'rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-side-bend',
    name: 'Cable Side Bend',
    muscleGroup: 'core',
    equipment: 'Cable',
    snapshot: 'Stand side to low cable bend torso away and back',
    cues: [
      'Set the pulley low and stand sideways to the machine holding the handle in the nearest hand',
      'Bend your torso directly away from the cable — the cable provides constant resistance through the full lateral range',
      'Return to upright slowly by contracting the oblique on the cable side — do not lean past upright',
      'The cable maintains tension at the start where a dumbbell has none — this makes it superior to the dumbbell side bend'
    ],
    ytUrl: 'https://youtu.be/LQdgGEEgdEo',
    goldStar: true,
    similarityGroup: 'lateral-flexion',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-crunch',
    name: 'Machine Crunch',
    muscleGroup: 'core',
    equipment: 'Machine',
    snapshot: 'Sit in crunch machine and flex torso against weight',
    cues: [
      'Adjust the seat so the axis of the machine aligns with your upper abs, not your hips',
      'Cross your arms over the pads and crunch your ribcage toward your pelvis — your hips stay planted',
      'Squeeze at the bottom of the crunch for one full second before returning',
      'Lower slowly under control — the machine provides resistance on the way back up which most people waste by letting it snap back'
    ],
    ytUrl: 'https://youtu.be/2fbujeH3F0E',
    goldStar: false,
    similarityGroup: 'spinal-flexion',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'hyperextension',
    name: '45-Degree Back Extension',
    muscleGroup: 'core',
    equipment: 'Machine',
    snapshot: 'Hinge forward on 45-degree bench extend back to straight',
    cues: [
      'Position the pad just below your hip bones so you can hinge freely at the hip',
      'Cross your arms at your chest or hold a plate and lower your torso toward the floor by hinging at the hips',
      'Extend back to straight — do not hyperextend past neutral, which compresses the lumbar spine',
      'Add a plate or dumbbell at your chest once bodyweight alone becomes easy for more erector stimulus'
    ],
    ytUrl: 'https://youtu.be/ph3pddpKzzw',
    goldStar: true,
    similarityGroup: 'back-extension',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'roman-chair-leg-raise',
    name: 'Roman Chair Leg Raise',
    muscleGroup: 'core',
    equipment: 'Machine',
    snapshot: 'Back against pad arms on rests raise legs up',
    cues: [
      'Press your back flat against the back pad and support your weight on your forearms on the arm rests',
      'Raise your legs by curling your pelvis upward — do not just swing your legs forward, which turns this into a hip flexor exercise',
      'Raise until your thighs are parallel to the floor or higher if your strength allows, squeezing your lower abs',
      'Lower slowly — do not let your legs drop, which removes all tension and risks lower back strain'
    ],
    ytUrl: 'https://youtu.be/Pr1ieGZ5atk',
    goldStar: false,
    similarityGroup: 'leg-raise',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'plank',
    name: 'Plank',
    muscleGroup: 'core',
    equipment: 'Bodyweight',
    snapshot: 'Hold push-up position rigid body straight line',
    cues: [
      'Hold yourself on forearms and toes with your body forming a completely straight line from head to heels',
      'Squeeze your glutes and brace your abs as hard as you can — a proper plank is maximally contracted, not passively held',
      'Do not let your hips pike up or sag down — both positions unload the core',
      'Build hold time gradually, but quality beats duration — 30 seconds of full tension beats 2 minutes of sagging'
    ],
    ytUrl: 'https://youtu.be/ASdvN_XEl_c',
    goldStar: true,
    similarityGroup: 'plank',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    muscleGroup: 'core',
    equipment: 'Bodyweight',
    snapshot: 'Hold body sideways on forearm and feet stacked',
    cues: [
      'Stack your feet or stagger them for more stability and hold yourself up on one forearm with your elbow under your shoulder',
      'Drive your hips upward so your body forms a straight diagonal line — sagging hips remove all the lateral core challenge',
      'Squeeze your glutes and brace your entire core — this is not just an oblique exercise when done correctly',
      'Elevate your top arm toward the ceiling to increase the balance demand once the basic version becomes easy'
    ],
    ytUrl: 'https://youtu.be/wqzrb67Dwf8',
    goldStar: true,
    similarityGroup: 'side-plank',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    muscleGroup: 'core',
    equipment: 'Bodyweight',
    snapshot: 'Hang from bar curl hips up raising legs to parallel',
    cues: [
      'Hang from a pull-up bar with a firm grip and dead hang before starting — let your body stop swinging',
      'Raise your legs by posteriorly tilting your pelvis — curl your hips up and forward, not just lifting your legs forward',
      'Raise until your thighs reach at least parallel to the floor — the lower abs are only challenged when the pelvis tilts',
      'Lower under control on a slow 3-count — do not drop your legs, which creates a pendulum swing that makes the next rep easier but less effective'
    ],
    ytUrl: 'https://youtu.be/Pr1ieGZ5atk',
    goldStar: true,
    similarityGroup: 'leg-raise',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    muscleGroup: 'core',
    equipment: 'Bodyweight',
    snapshot: 'Roll wheel forward from knees extending body flat',
    cues: [
      'Kneel on a pad, grip the ab wheel handles, and brace your core as hard as you can before moving',
      'Roll forward slowly while keeping your back flat — your hips should not pike up or your lower back arch',
      'Go only as far as you can keep perfect form — a short rollout with a rigid spine beats a full rollout with a sagging back',
      'Pull the wheel back by driving your elbows toward your knees using your abs, not your hip flexors'
    ],
    ytUrl: 'https://youtu.be/L78bRBGCAIo',
    goldStar: true,
    similarityGroup: 'rollout',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    muscleGroup: 'core',
    equipment: 'Bodyweight',
    snapshot: 'Lie on back extend opposite arm and leg slowly',
    cues: [
      'Lie on your back with arms pointing at the ceiling and knees bent at 90 degrees above your hips',
      'Press your lower back firmly into the floor and keep it there for the entire set — this is the whole challenge',
      'Slowly lower one arm overhead and the opposite leg toward the floor simultaneously, taking 3-4 seconds',
      'Return and repeat on the other side — if your lower back lifts off the floor even slightly, reduce your range of motion'
    ],
    ytUrl: 'https://youtu.be/4XLEnwUr1d8',
    goldStar: true,
    similarityGroup: 'dead-bug',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'bicycle-crunch',
    name: 'Bicycle Crunch',
    muscleGroup: 'core',
    equipment: 'Bodyweight',
    snapshot: 'Crunch and rotate elbow to opposite knee alternating',
    cues: [
      'Lie on your back with hands lightly behind your ears — do not pull on your neck',
      'Curl one shoulder toward the opposite knee while extending the other leg straight out',
      'Rotate through your ribcage — your shoulder moves toward the knee, not just your elbow',
      'Move slowly and deliberately — fast sloppy bicycle crunches are mostly hip flexor work, not oblique work'
    ],
    ytUrl: 'https://youtu.be/9FGilxCbdz8',
    goldStar: false,
    similarityGroup: 'spinal-flexion',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-pallof-press',
    name: 'Band Pallof Press',
    muscleGroup: 'core',
    equipment: 'Resistance Band',
    snapshot: 'Band anchored at side press handles out resisting rotation',
    cues: [
      'Anchor a band at chest height to a rack or door and stand sideways holding it with both hands at your sternum',
      'Press your hands straight out in front of you and hold for two seconds — resist the band pulling you toward the anchor',
      'The further you press out, the harder the anti-rotation challenge becomes',
      'Return the band to your chest under control before repeating — do not let it snap you back'
    ],
    ytUrl: 'https://youtu.be/AabdomSpfZs',
    goldStar: false,
    similarityGroup: 'anti-rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-wood-chop',
    name: 'Band Wood Chop',
    muscleGroup: 'core',
    equipment: 'Resistance Band',
    snapshot: 'Band anchored high pull diagonally across body down',
    cues: [
      'Anchor the band high and stand sideways, holding it with both hands at shoulder height on the anchor side',
      'Pull the band diagonally across your body from high to low, rotating your torso through the movement',
      'Your arms follow your torso — the power comes from the rotation, not the pull',
      'Control the return against the band tension — the oblique works on the way back just as hard'
    ],
    ytUrl: 'https://youtu.be/nCKG7nMNhHs',
    goldStar: false,
    similarityGroup: 'rotation',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-dead-bug',
    name: 'Band Dead Bug',
    muscleGroup: 'core',
    equipment: 'Resistance Band',
    snapshot: 'Dead bug with band adding resistance to arm extension',
    cues: [
      'Anchor the band overhead and hold it with both arms pointing at the ceiling in the dead bug start position',
      'Lower one arm overhead against the band tension while lowering the opposite leg — the band adds difficulty to the arm component',
      'Keep your lower back pressed into the floor throughout — the band makes this significantly harder than bodyweight',
      'Return both limbs slowly and repeat on the other side — this is one of the best deep core stability exercises available'
    ],
    ytUrl: 'https://youtu.be/4XLEnwUr1d8',
    goldStar: false,
    similarityGroup: 'dead-bug',
    alsoInProgram: false,
    tier: 'isolation'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CORE_EXERCISE_LIBRARY };
}
