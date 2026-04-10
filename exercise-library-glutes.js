/**
 * T&S Muscle — Glute Exercise Library
 * All glute exercises across every equipment category.
 *
 * Dedup notes (duplicate IDs removed):
 *   cable-pull-through — REMOVED from this file. Canonical entry lives in
 *             exercise-library-hamstrings.js (primary mover is the hamstring
 *             in the hip hinge pattern; glutes are synergist).
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

const GLUTE_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'Barbell',
    snapshot: 'Drive barbell on hips up to full extension',
    cues: [
      'Sit with your upper back against a bench and the bar over your hip crease — use a pad for comfort',
      'Drive through your heels and squeeze your glutes hard at the top until your body forms a straight line from knees to shoulders',
      'Do not hyperextend your lower back at the top — tuck your chin and think about leveling your pelvis',
      'Lower with control and reset your brace before every rep — do not bounce off the bottom'
    ],
    ytUrl: 'https://youtu.be/0od5lwWMGV8',
    goldStar: true,
    similarityGroup: 'hip-thrust',
    alsoInProgram: true,   // id: 'hip-thrust-a'
    tier: 'compound'
  },
  {
    id: 'barbell-glute-bridge',
    name: 'Barbell Glute Bridge',
    muscleGroup: 'glutes',
    equipment: 'Barbell',
    snapshot: 'Lie flat and drive barbell on hips upward',
    cues: [
      'Lie flat on the floor with the bar over your hip crease and knees bent at about 90 degrees',
      'Drive through your heels and squeeze your glutes to lift your hips straight up',
      'Squeeze hard at the top and hold for one second before lowering — the floor limits your range compared to a hip thrust',
      'Progress to a hip thrust when the floor version becomes easy — the bench elevation adds significant range of motion'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: false,
    similarityGroup: 'hip-thrust',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'barbell-sumo-deadlift',
    name: 'Barbell Sumo Deadlift',
    muscleGroup: 'glutes',
    equipment: 'Barbell',
    snapshot: 'Wide stance deadlift toes out, upright torso pull',
    cues: [
      'Stand with feet wider than shoulder-width, toes pointed out to about 45 degrees',
      'Grip the bar just inside your legs and keep your torso more upright than a conventional deadlift',
      'Drive your knees out hard as you pull — this is what recruits the glutes and inner hamstrings over the lower back',
      'Lock out by squeezing your glutes at the top — do not lean back aggressively'
    ],
    ytUrl: 'https://youtu.be/LGIS9vs65Sk',
    goldStar: true,
    similarityGroup: 'sumo-deadlift',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-hip-thrust',
    name: 'Dumbbell Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'Dumbbell',
    snapshot: 'Upper back on bench drive dumbbell on hips up',
    cues: [
      'Place a dumbbell horizontally across your hip crease and hold it in place with both hands',
      'Drive through your heels and squeeze your glutes to push your hips up to a flat bridge position',
      'Hold the top for one second and squeeze hard — dumbbell load is lighter than a barbell so use peak squeeze to compensate',
      'Lower under control and reset before repeating — do not rush the bottom of the rep'
    ],
    ytUrl: 'https://youtu.be/0od5lwWMGV8',
    goldStar: false,
    similarityGroup: 'hip-thrust',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-sumo-squat',
    name: 'Dumbbell Sumo Squat',
    muscleGroup: 'glutes',
    equipment: 'Dumbbell',
    snapshot: 'Wide stance squat holding dumbbell between legs',
    cues: [
      'Stand wide with toes turned out and hold one dumbbell vertically with both hands between your legs',
      'Keep your chest tall and push your knees outward in the direction of your toes as you descend',
      'Squat until your thighs are at least parallel to the floor for a full glute stretch',
      'Drive through your heels to stand and squeeze your glutes at the top'
    ],
    ytUrl: 'https://youtu.be/sQ-lwJtpwUc',
    goldStar: false,
    similarityGroup: 'sumo-deadlift',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-curtsy-lunge',
    name: 'Curtsy Lunge',
    muscleGroup: 'glutes',
    equipment: 'Dumbbell',
    snapshot: 'Step rear foot behind and across for glute med',
    cues: [
      'Hold dumbbells at your sides and step one foot diagonally behind and across your body — like a curtsy',
      'Lower your back knee toward the floor while keeping your front knee tracking over your toes',
      'The cross-behind motion targets the glute medius on your front leg more than a standard lunge',
      'Drive through your front heel to return to standing and repeat on the same side or alternate'
    ],
    ytUrl: 'https://youtu.be/bH3mRwnAN88',
    goldStar: true,
    similarityGroup: 'curtsy-lunge',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-lateral-lunge',
    name: 'Dumbbell Lateral Lunge',
    muscleGroup: 'glutes',
    equipment: 'Dumbbell',
    snapshot: 'Step wide to one side and sink into side lunge',
    cues: [
      'Hold dumbbells at your sides and take a wide step directly to one side',
      'Sink into the side you stepped onto by pushing your hips back and bending that knee — keep the other leg straight',
      'Keep your chest up and your bent knee tracking over your foot — do not let it cave inward',
      'Drive through your bent leg heel to return to center and repeat on the same side or alternate'
    ],
    ytUrl: 'https://youtu.be/R8jArZG2J6Q',
    goldStar: true,
    similarityGroup: 'lateral-lunge',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-donkey-kick',
    name: 'Cable Donkey Kick',
    muscleGroup: 'glutes',
    equipment: 'Cable',
    snapshot: 'On all fours kick ankle-cuffed leg straight back',
    cues: [
      'Attach an ankle cuff to the low pulley and get on all fours facing the machine',
      'Keep your knee bent at 90 degrees and drive your heel straight back and up toward the ceiling',
      'Stop when your thigh is parallel to the floor — going higher arches your lower back, not your glute',
      'Squeeze hard at the top and lower slowly — the cable keeps tension throughout unlike bodyweight versions'
    ],
    ytUrl: 'https://youtu.be/SqO-VUEak2M',
    goldStar: true,
    similarityGroup: 'kickback',
    alsoInProgram: true,   // id: 'donkey-kick'
    tier: 'isolation'
  },
  {
    id: 'cable-standing-kickback',
    name: 'Cable Standing Glute Kickback',
    muscleGroup: 'glutes',
    equipment: 'Cable',
    snapshot: 'Stand facing pulley kick ankle-cuffed leg back',
    cues: [
      'Attach an ankle cuff to the low pulley and face the machine, holding the frame for balance',
      'Keep a slight lean forward from your hips and kick your working leg straight back',
      'Focus on squeezing the glute at the peak — the movement is small, not a big swing',
      'Lower slowly and controlled — rushing kills the tension that makes this exercise work'
    ],
    ytUrl: 'https://youtu.be/SqO-VUEak2M',
    goldStar: false,
    similarityGroup: 'kickback',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-hip-abduction',
    name: 'Cable Hip Abduction',
    muscleGroup: 'glutes',
    equipment: 'Cable',
    snapshot: 'Stand sideways lift ankle-cuffed leg out to side',
    cues: [
      'Attach an ankle cuff to the low pulley and stand sideways to the machine',
      'Hold the machine frame for balance and lift your outside leg out to the side',
      'Keep your torso completely still — movement comes only from your hip, not a sideways lean',
      'Lower slowly under cable tension rather than letting your leg drop — the eccentric is equally valuable'
    ],
    ytUrl: 'https://youtu.be/SqO-VUEak2M',
    goldStar: false,
    similarityGroup: 'hip-abduction',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-hip-abduction',
    name: 'Hip Abduction Machine',
    muscleGroup: 'glutes',
    equipment: 'Machine',
    snapshot: 'Seated push pads apart to work outer glutes',
    cues: [
      'Sit tall with your back against the pad and feet resting on the footrests',
      'Push your legs outward against the pads in a slow, controlled motion — do not slam them open',
      'Hold at the widest point for one second to maximize glute medius contraction',
      'Return slowly by resisting the pads coming back together — the adductor also works on the return'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: true,
    similarityGroup: 'hip-abduction',
    alsoInProgram: true,   // id: 'hip-abduction'
    tier: 'isolation'
  },
  {
    id: 'machine-hip-thrust',
    name: 'Machine Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'Machine',
    snapshot: 'Hip thrust on dedicated glute machine with pad',
    cues: [
      'Adjust the machine so the hip pad sits across your hip crease — not your stomach or thighs',
      'Drive your hips forward and up against the pad by squeezing your glutes hard',
      'Hold the fully extended position for one second before returning — the machine removes setup so use the extra focus for better contractions',
      'Lower under control — do not let the machine push your hips back without resistance'
    ],
    ytUrl: 'https://youtu.be/0od5lwWMGV8',
    goldStar: false,
    similarityGroup: 'hip-thrust',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'smith-hip-thrust',
    name: 'Smith Machine Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'Machine',
    snapshot: 'Hip thrust under Smith bar for guided stability',
    cues: [
      'Set the Smith bar low enough to sit the bar over your hip crease when your back is against a bench',
      'The fixed bar path makes setup easier and allows you to focus fully on the glute contraction',
      'Drive through your heels and squeeze hard at the top — the Smith is more stable than a free barbell so really feel the peak',
      'Rotate the bar to re-rack at the end of your set rather than trying to hold it still'
    ],
    ytUrl: 'https://youtu.be/0od5lwWMGV8',
    goldStar: false,
    similarityGroup: 'hip-thrust',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'glute-iso-machine',
    name: 'Glute Isolator Machine',
    muscleGroup: 'glutes',
    equipment: 'Machine',
    snapshot: 'Kneel on Precor machine drive heel back and up',
    cues: [
      'Kneel on the padded platform and position the working leg with your foot hooked under the roller pad',
      'Keep your hips square to the machine throughout — rotating your hip means your glute is not doing the work',
      'Drive your heel back and up against the pad in a controlled arc, squeezing your glute at the top',
      'Lower slowly under resistance — the machine provides resistance in both directions so use both'
    ],
    ytUrl: 'https://youtu.be/SqO-VUEak2M',
    goldStar: true,
    similarityGroup: 'glute-iso-machine',
    alsoInProgram: true,   // id: 'glute-iso'
    tier: 'isolation'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    muscleGroup: 'glutes',
    equipment: 'Bodyweight',
    snapshot: 'Lie on floor bridge hips up squeezing glutes',
    cues: [
      'Lie on your back with knees bent and feet flat on the floor hip-width apart',
      'Drive through your heels and squeeze your glutes to lift your hips until your body forms a straight line',
      'Hold the top for two full seconds with a hard glute squeeze before lowering',
      'Add a dumbbell or plate on your hips once bodyweight alone stops feeling challenging'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: false,
    similarityGroup: 'hip-thrust',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'single-leg-hip-thrust',
    name: 'Single Leg Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'Bodyweight',
    snapshot: 'Hip thrust with one leg extended in the air',
    cues: [
      'Set up the same as a standard hip thrust with your upper back on the bench',
      'Extend one leg straight out and drive your hips up using only the grounded leg',
      'Keep your hips level — do not let the unsupported side drop during the movement',
      'Complete all reps on one side before switching — unilateral work reveals and corrects glute imbalances'
    ],
    ytUrl: 'https://youtu.be/0od5lwWMGV8',
    goldStar: true,
    similarityGroup: 'hip-thrust-unilateral',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'donkey-kick-bodyweight',
    name: 'Donkey Kick (Bodyweight)',
    muscleGroup: 'glutes',
    equipment: 'Bodyweight',
    snapshot: 'On all fours kick bent knee back and up',
    cues: [
      'Get on all fours with your wrists under your shoulders and knees under your hips',
      'Keep your knee bent at 90 degrees and drive your heel straight toward the ceiling',
      'Stop when your thigh is parallel to the floor — going higher arches your lower back instead of working your glute',
      'Add a resistance band around your thighs when bodyweight alone no longer challenges you'
    ],
    ytUrl: 'https://youtu.be/SqO-VUEak2M',
    goldStar: false,
    similarityGroup: 'kickback',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'frog-pump',
    name: 'Frog Pump',
    muscleGroup: 'glutes',
    equipment: 'Bodyweight',
    snapshot: 'Lie on back butterfly feet together pump hips up',
    cues: [
      'Lie on your back and bring the soles of your feet together with your knees flared wide like a butterfly stretch',
      'Drive your hips straight up by squeezing your glutes — the externally rotated leg position changes the angle of glute recruitment',
      'Hold at the top for one second then lower under control before pumping back up',
      'Use high reps and a band across your hips for added resistance once bodyweight becomes easy'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: true,
    similarityGroup: 'frog-pump',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'banded-clamshell',
    name: 'Banded Clamshell',
    muscleGroup: 'glutes',
    equipment: 'Resistance Band',
    snapshot: 'Side lie band around thighs open top knee up',
    cues: [
      'Lie on your side with a band around your thighs, knees bent at 45 degrees and feet stacked',
      'Rotate your top knee up toward the ceiling like a clamshell opening — keep your feet together',
      'Only open as far as your glute medius allows without your pelvis rotating backward',
      'Hold at the top for one second and lower slowly — the band creates resistance in both directions'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: true,
    similarityGroup: 'clamshell',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-lateral-walk',
    name: 'Banded Lateral Walk',
    muscleGroup: 'glutes',
    equipment: 'Resistance Band',
    snapshot: 'Band around ankles step side to side in squat',
    cues: [
      'Place a band around your ankles and get into a quarter-squat position — stay low throughout',
      'Step sideways by leading with one foot then bringing the other foot to hip-width — do not let them touch',
      'Keep constant tension in the band — do not let your feet come close enough to reduce resistance',
      'Keep your toes forward and avoid hiking your hip up on the stepping side — that is your hip flexor, not your glute medius'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: true,
    similarityGroup: 'lateral-walk',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-glute-kickback',
    name: 'Banded Kickback',
    muscleGroup: 'glutes',
    equipment: 'Resistance Band',
    snapshot: 'Band anchored kick leg back standing or all fours',
    cues: [
      'Loop a band around one ankle and anchor the other end at a low point in front of you',
      'Stand or get on all fours and kick your working leg straight back against the band tension',
      'Keep your hips square — rotating to get more range takes the glute out of the movement',
      'Lower slowly and feel the band resist the return — both directions count for growth'
    ],
    ytUrl: 'https://youtu.be/SqO-VUEak2M',
    goldStar: false,
    similarityGroup: 'kickback',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-glute-bridge',
    name: 'Banded Glute Bridge',
    muscleGroup: 'glutes',
    equipment: 'Resistance Band',
    snapshot: 'Glute bridge with band across hips adding resistance',
    cues: [
      'Lie on your back with a band anchored to something heavy across your hips or looped under your feet',
      'Drive through your heels and squeeze your glutes to lift your hips against the band tension',
      'Hold the top for two seconds with a hard glute squeeze — the band peaks in resistance right where you need it most',
      'Lower slowly under band resistance before the next rep'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: false,
    similarityGroup: 'hip-thrust',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'band-hip-abduction',
    name: 'Banded Hip Abduction (Side-Lying)',
    muscleGroup: 'glutes',
    equipment: 'Resistance Band',
    snapshot: 'Band around thighs lie on side lift top leg',
    cues: [
      'Place a band around your thighs and lie on your side with your legs stacked and straight',
      'Lift your top leg upward against the band tension — keep your toes pointing forward, not toward the ceiling',
      'Raise as high as you can without your pelvis rotating — the movement is small and controlled',
      'Lower slowly to just above the bottom leg before raising again — do not rest between reps'
    ],
    ytUrl: 'https://youtu.be/OUgsJ8-Vi0E',
    goldStar: false,
    similarityGroup: 'hip-abduction',
    alsoInProgram: false,
    tier: 'isolation'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GLUTE_EXERCISE_LIBRARY };
}
