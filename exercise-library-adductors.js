/**
 * T&S Muscle — Adductor Exercise Library
 * All adductor exercises across every equipment category.
 *
 * Key anatomy note:
 *   Adductors (adductor magnus/longus/brevis, gracilis, pectineus) –
 *     inner thigh muscles; pull the leg toward the midline.
 *   Adductor magnus (posterior head) also acts as a hip extensor — trained
 *     by Copenhagen planks and deep squats.
 *   Adductor longus/brevis – most active in direct adduction exercises
 *     (machine, cable, side-lying).
 *   Complete adductor development requires both direct adduction patterns
 *     and loaded isometric squeeze work (Copenhagen variants).
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

const ADDUCTOR_EXERCISE_LIBRARY = [

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-hip-adduction',
    name: 'Cable Hip Adduction',
    muscleGroup: 'adductors',
    equipment: 'Cable',
    snapshot: 'Stand sideways and pull cable leg across body',
    cues: [
      'Set the pulley at ankle height, attach an ankle cuff, and stand side-on with the working leg away from the machine',
      'Keep a slight bend in the working knee and sweep the leg across your body in a smooth arc — do not let the hip hike',
      'Hold a light contraction at peak adduction before releasing slowly — this eccentric is where the adductors are most loaded',
      'Keep your torso upright and avoid leaning away from the machine — that shifts the load to your hip flexors'
    ],
    ytUrl: 'https://youtu.be/3I3KQN1UKds',
    goldStar: true,
    similarityGroup: 'standing-adduction',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-hip-adduction',
    name: 'Machine Hip Adduction',
    muscleGroup: 'adductors',
    equipment: 'Machine',
    snapshot: 'Sit on adductor machine and squeeze legs together',
    cues: [
      'Set the pads to the widest range you can reach without feeling a groin pull — the stretch at the open position is the most productive part',
      'Squeeze your legs together with controlled force and hold a 1-second peak contraction before releasing',
      'Lower the weight slowly on a 3-count — the eccentric portion of this movement is critically important for adductor development',
      'Sit upright throughout — do not round or lean forward, which takes tension off the adductors'
    ],
    ytUrl: 'https://youtu.be/c2O-4SLQnjo',
    goldStar: true,
    similarityGroup: 'machine-adduction',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'copenhagen-plank',
    name: 'Copenhagen Plank',
    muscleGroup: 'adductors',
    equipment: 'Bodyweight',
    snapshot: 'Side plank with top leg on bench adductors braced',
    cues: [
      'Set up in a side plank with your top foot resting on a bench and your bottom leg hanging freely below it',
      'Drive your top leg into the bench while simultaneously lifting your bottom leg to meet it — both legs squeeze together at the top',
      'Hold for 2-3 seconds at peak then lower slowly — this is a loaded isometric for the adductors, not a dynamic rep',
      'Beginners: rest the top knee (not foot) on the bench to shorten the lever arm until you build adequate hip strength'
    ],
    ytUrl: 'https://youtu.be/YR_j8-ZBfgM',
    goldStar: true,
    similarityGroup: 'copenhagen-plank',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'side-lying-hip-adduction',
    name: 'Side-Lying Hip Adduction',
    muscleGroup: 'adductors',
    equipment: 'Bodyweight',
    snapshot: 'Lie on side and lift bottom leg up toward top',
    cues: [
      'Lie on your side with your top leg crossed in front of the bottom leg, foot flat on the floor for balance',
      'Lift your bottom leg upward toward the ceiling — the adductors of the bottom leg are fully working against gravity in this position',
      'Pause at the top of the range and lower slowly — the adductors fire hardest in the lower half of the lift',
      'Add an ankle weight or resistance band around both ankles to progress beyond bodyweight once this becomes easy'
    ],
    ytUrl: 'https://youtu.be/J4lfVOR-Vkg',
    goldStar: false,
    similarityGroup: 'side-lying-adduction',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-hip-adduction-standing',
    name: 'Band Standing Hip Adduction',
    muscleGroup: 'adductors',
    equipment: 'Resistance Band',
    snapshot: 'Anchor band at ankle and sweep leg across body',
    cues: [
      'Anchor a resistance band at ankle height and loop it around the ankle of the leg closest to the anchor point',
      'Step laterally away from the anchor until the band has tension at the start position with your legs shoulder-width apart',
      'Sweep the banded leg across your midline in a controlled arc — the band resists throughout the full range',
      'Balance on the supporting leg — if balance is an issue, hold a wall lightly until you build stability'
    ],
    ytUrl: 'https://youtu.be/3I3KQN1UKds',
    goldStar: false,
    similarityGroup: 'standing-adduction',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-adductor-squeeze',
    name: 'Band Adductor Squeeze',
    muscleGroup: 'adductors',
    equipment: 'Resistance Band',
    snapshot: 'Sit with band around knees and squeeze legs together',
    cues: [
      'Sit upright on a bench or chair with a resistance band looped around both knees just above the joint',
      'Push your knees outward against the band to create pre-tension, then squeeze your knees together against band resistance',
      'Hold the peak squeeze for 2 seconds before releasing slowly — the adductors fire hardest at full adduction',
      'Use a band with enough resistance that 15-20 reps produces a clear burn in the inner thigh'
    ],
    ytUrl: 'https://youtu.be/c2O-4SLQnjo',
    goldStar: false,
    similarityGroup: 'adductor-squeeze',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-copenhagen-plank',
    name: 'Band Copenhagen Plank',
    muscleGroup: 'adductors',
    equipment: 'Resistance Band',
    snapshot: 'Copenhagen plank with band adding squeeze resistance',
    cues: [
      'Set up in a standard Copenhagen plank position (side plank, top foot on bench)',
      'Loop a resistance band around both ankles so the band is taut when your legs are together at the top',
      'Drive your top leg into the bench and pull your bottom leg up to meet it — the band adds extra adductor load at peak squeeze',
      'This variation bridges bodyweight and weighted Copenhagen planks — use it as a progression before adding dumbbell weight'
    ],
    ytUrl: 'https://youtu.be/YR_j8-ZBfgM',
    goldStar: false,
    similarityGroup: 'copenhagen-plank',
    alsoInProgram: false,
    tier: 'compound'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'weighted-adductor-squeeze',
    name: 'Weighted Adductor Squeeze',
    muscleGroup: 'adductors',
    equipment: 'Dumbbell',
    snapshot: 'Sit with dumbbell between knees and squeeze',
    cues: [
      'Sit on the edge of a bench and place a dumbbell vertically between your knees, gripping it only with your inner thighs',
      'Squeeze your knees together hard enough to hold the dumbbell in place for sets of 10-20 seconds or rhythmic reps',
      'Use a dumbbell you can squeeze without tilting your pelvis or leaning — the torso stays straight throughout',
      'Progress by using a heavier dumbbell or by squeezing for longer holds — this is purely isometric adductor work'
    ],
    ytUrl: 'https://youtu.be/c2O-4SLQnjo',
    goldStar: true,
    similarityGroup: 'adductor-squeeze',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'weighted-copenhagen-plank',
    name: 'Weighted Copenhagen Plank',
    muscleGroup: 'adductors',
    equipment: 'Dumbbell',
    snapshot: 'Copenhagen plank holding dumbbell between ankles',
    cues: [
      'Set up in a Copenhagen plank with your top foot on the bench, then place a light dumbbell between your ankles',
      'Grip the dumbbell with both ankles as you perform the plank — both the squeeze and the static hold load the adductors',
      'Keep the dumbbell from dropping by actively squeezing the legs together throughout the entire set',
      'This is an advanced variation — master the bodyweight Copenhagen plank for 30+ seconds before adding weight'
    ],
    ytUrl: 'https://youtu.be/YR_j8-ZBfgM',
    goldStar: false,
    similarityGroup: 'copenhagen-plank',
    alsoInProgram: false,
    tier: 'compound'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ADDUCTOR_EXERCISE_LIBRARY };
}
