/**
 * T&S Muscle — Calf Exercise Library
 * All calf exercises across every equipment category.
 *
 * Key anatomy note:
 *   Gastrocnemius – the outer visible calf muscle; crosses both knee and ankle.
 *   Best targeted with knee STRAIGHT (standing variations).
 *   Soleus – the deeper, wider muscle beneath the gastrocnemius; crosses ankle only.
 *   Best targeted with knee BENT (seated variations).
 *   Complete calf development requires both patterns in a program.
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

const CALF_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-standing-calf-raise',
    name: 'Barbell Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Barbell',
    snapshot: 'Bar on back rise onto toes with straight knees',
    cues: [
      'Position the bar on your upper back like a squat and stand with the balls of your feet on a plate or step',
      'Lower your heels as far below the step as your ankle mobility allows — the full stretch at the bottom is critical for growth',
      'Rise onto your toes as high as possible and pause for one second at the peak',
      'Lower on a slow 3-count — rushing the descent is the most common mistake that limits calf development'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'barbell-seated-calf-raise',
    name: 'Barbell Seated Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Barbell',
    snapshot: 'Bar across knees seated rise onto toes for soleus',
    cues: [
      'Sit on a bench with the balls of your feet on a step and rest a padded barbell across your lower thighs — just above your knees',
      'Your knees bent at 90 degrees switches emphasis to the soleus, which the gastrocnemius cannot override',
      'Lower your heels to a full stretch below the step, then rise to full height',
      'Use a towel or pad under the bar — the load across bare thighs will cut the set short before your calves are done'
    ],
    ytUrl: 'https://youtu.be/JbyjNymZOt0',
    goldStar: false,
    similarityGroup: 'seated-calf-raise',
    alsoInProgram: false
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-standing-calf-raise',
    name: 'Dumbbell Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Dumbbell',
    snapshot: 'Hold dumbbell at side rise onto toes standing',
    cues: [
      'Hold a dumbbell in one hand and use the other hand to hold something for light balance support',
      'Stand with the ball of your foot on a step and lower your heel to a full stretch before each rep',
      'Rise to your absolute maximum height — partial reps keep the calf in its comfortable mid-range and limit growth',
      'Lower on a slow 3-count every single rep — calves adapt fast to sloppy technique'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'db-single-leg-calf-raise',
    name: 'Dumbbell Single Leg Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Dumbbell',
    snapshot: 'One foot on step hold dumbbell curl toes up',
    cues: [
      'Hold a dumbbell on the same side as your working leg and rest your non-working foot behind your ankle',
      'Lower your heel as far below the step as possible for a full gastrocnemius stretch',
      'Rise onto your toes as high as you can and squeeze at the top for one full second',
      'Do all reps on one side before switching — unilateral work forces each calf to work at full capacity'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'single-leg-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'db-seated-calf-raise',
    name: 'Dumbbell Seated Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Dumbbell',
    snapshot: 'Dumbbells on knees seated rise onto toes for soleus',
    cues: [
      'Sit on a bench with the balls of your feet on a step and a dumbbell balanced on each knee',
      'The bent-knee position targets the soleus — the deeper calf muscle that gives the calf width and thickness',
      'Lower your heels below the step for a full stretch, then rise to full height on each rep',
      'Move slowly — the soleus responds better to controlled time under tension than to fast reps'
    ],
    ytUrl: 'https://youtu.be/JbyjNymZOt0',
    goldStar: false,
    similarityGroup: 'seated-calf-raise',
    alsoInProgram: false
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-standing-calf-raise',
    name: 'Cable Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Cable',
    snapshot: 'Cable over shoulders rise onto toes standing on step',
    cues: [
      'Attach a straight bar to a high pulley and drape it across your shoulders like a yoke, or use a low pulley between your legs for upward tension',
      'Stand with the balls of your feet on a plate or step so your heels can drop freely',
      'Lower to a full stretch, then rise to full height — the cable maintains constant tension unlike a barbell',
      'Lower on a slow 3-count and pause at the bottom stretch before rising again'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'cable-seated-calf-raise',
    name: 'Cable Seated Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Cable',
    snapshot: 'Seated feet on low cable plate push toes down',
    cues: [
      'Sit facing a low pulley and attach the cable to a belt or wrap it around a plate resting on your knees',
      'Your knees are bent at 90 degrees which targets the soleus — the cable keeps resistance constant through the full range',
      'Push your toes forward and down against the cable, hold the peak, then return slowly',
      'The cable version provides resistance at the very bottom stretch unlike most seated calf machines'
    ],
    ytUrl: 'https://youtu.be/JbyjNymZOt0',
    goldStar: false,
    similarityGroup: 'seated-calf-raise',
    alsoInProgram: false
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-standing-calf-raise',
    name: 'Standing Calf Raise Machine',
    muscleGroup: 'calves',
    equipment: 'Machine',
    snapshot: 'Shoulders on pads rise onto toes loaded machine',
    cues: [
      'Position the shoulder pads on your upper traps and stand with the balls of your feet on the step',
      'Lower your heels as far below the step as your ankle mobility allows — this full stretch is what separates results from spinning your wheels',
      'Rise to your absolute maximum height and hold for one second at the top',
      'Lower on a slow 3-count for every rep — calves have a high proportion of slow-twitch fibers that respond to time under tension'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: true,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: true   // id: 'calf-a'
  },
  {
    id: 'machine-seated-calf-raise',
    name: 'Seated Calf Raise Machine',
    muscleGroup: 'calves',
    equipment: 'Machine',
    snapshot: 'Knee pads press down rise onto toes for soleus',
    cues: [
      'Adjust the knee pad so it sits just above your knees — too high stresses the knee, too low slips off',
      'The 90-degree knee position isolates the soleus which cannot be adequately trained with standing raises alone',
      'Lower your heels to a full stretch below the footplate, then press up to maximum height',
      'Pause one second at the bottom stretch before rising — the stretch stimulus at long muscle length is highly effective for soleus hypertrophy'
    ],
    ytUrl: 'https://youtu.be/JbyjNymZOt0',
    goldStar: true,
    similarityGroup: 'seated-calf-raise',
    alsoInProgram: true   // id: 'calf-b'
  },
  {
    id: 'leg-press-calf-raise',
    name: 'Leg Press Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Machine',
    snapshot: 'Feet at bottom of leg press push platform with toes',
    cues: [
      'After finishing your leg press set, move your feet to the very bottom edge of the platform with just the balls of your feet on it',
      'Keep your legs only slightly bent — enough to unlock the knees but not enough to engage the soleus significantly',
      'Push through your toes to extend your ankles fully, hold one second, then lower with control',
      'This is an excellent way to add heavy calf volume without needing a separate machine — use the weight already loaded'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: true,
    similarityGroup: 'leg-press-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'smith-machine-calf-raise',
    name: 'Smith Machine Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Machine',
    snapshot: 'Bar on shoulders rise onto toes on Smith machine',
    cues: [
      'Set the Smith bar at shoulder height and stand with the balls of your feet on a plate or step under the bar',
      'The fixed bar path means you can load heavier and focus entirely on ankle range of motion',
      'Lower your heels to a full stretch below the step before each rep',
      'Rise to maximum height, pause one second, and lower on a 3-count — the Smith removes all balance demand so there is no excuse for sloppy reps'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'donkey-calf-raise',
    name: 'Donkey Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Machine',
    snapshot: 'Hips hinged forward weight on lower back toes on step',
    cues: [
      'Hinge forward at the hips about 90 degrees and rest your forearms on a bench or the machine pad',
      'This hip-flexed position stretches the gastrocnemius across both the knee and ankle simultaneously for maximum range',
      'Lower your heels as far below the step as possible, then rise to maximum height',
      'The donkey position provides a deeper calf stretch than a standing raise — use it when you plateau on standard calf raises'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: true,
    similarityGroup: 'donkey-calf-raise',
    alsoInProgram: false
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'standing-calf-raise-bodyweight',
    name: 'Bodyweight Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Bodyweight',
    snapshot: 'Rise onto toes on step with straight knees',
    cues: [
      'Stand with the balls of both feet on a step or curb and lower your heels below the step level',
      'Rise to maximum height and hold one second before lowering — without load, the pause and squeeze matter more',
      'Lower on a slow 4-count — making the bodyweight version harder through tempo is more effective than rushing higher reps',
      'Progress to the single leg version once you can do 20 or more reps with perfect form'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'single-leg-calf-raise-step',
    name: 'Single Leg Calf Raise (Step)',
    muscleGroup: 'calves',
    equipment: 'Bodyweight',
    snapshot: 'One foot on step lower heel fully and rise high',
    cues: [
      'Stand on one foot on the edge of a step with the other foot crossed behind your ankle for balance',
      'Lower your heel as far below the step as possible — the full stretch at long muscle length is where growth happens',
      'Rise onto your toes as high as you can and pause for one second at the peak',
      'Lower on a slow 3-4 count every rep — this is one of the most effective calf exercises available at any level of training'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: true,
    similarityGroup: 'single-leg-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope (Calf Finisher)',
    muscleGroup: 'calves',
    equipment: 'Bodyweight',
    snapshot: 'Continuous skipping on toes for calf endurance',
    cues: [
      'Stay on the balls of your feet throughout — landing on your heels defeats the purpose and risks ankle injury',
      'Keep jumps small and controlled — you only need to clear the rope, not jump for height',
      'Use this as a calf finisher for 2-3 minutes after your main calf sets for endurance and blood flow',
      'The fast repetition rate trains calf endurance and the Achilles tendon in a way that slow raises cannot replicate'
    ],
    ytUrl: 'https://youtu.be/FJmRQ5iTXKE',
    goldStar: true,
    similarityGroup: 'jump-rope',
    alsoInProgram: false
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-standing-calf-raise',
    name: 'Band Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band looped over shoulders rise onto toes',
    cues: [
      'Stand on the middle of the band with the balls of your feet on a step and loop both ends over your shoulders',
      'The band increases resistance as you rise — hardest at the top where you are strongest',
      'Lower your heels to a full stretch at the bottom before each rep',
      'Use a heavy enough band that the top of the movement is genuinely challenging — bands for calves need real tension'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: false,
    similarityGroup: 'standing-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'band-seated-calf-raise',
    name: 'Band Seated Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Resistance Band',
    snapshot: 'Band across knees seated push toes down against resistance',
    cues: [
      'Sit on a bench with the balls of your feet on a step and loop a heavy band across your lower thighs',
      'Anchor the band to something behind you so it pulls your knees down while you press up against it',
      'The bent-knee position targets the soleus — this is your seated calf raise substitute when no machine is available',
      'Lower to a full heel stretch and rise to full height on every rep — do not shorten the range to manage band tension'
    ],
    ytUrl: 'https://youtu.be/JbyjNymZOt0',
    goldStar: false,
    similarityGroup: 'seated-calf-raise',
    alsoInProgram: false
  },
  {
    id: 'band-single-leg-calf-raise',
    name: 'Band Single Leg Calf Raise',
    muscleGroup: 'calves',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band one foot rise onto toes single leg',
    cues: [
      'Stand on the band with one foot and loop both ends over the shoulder of the same side',
      'Stand with the ball of your foot on a step and lower your heel to a full stretch',
      'Rise to maximum height against the band tension — one leg at a time forces each calf to its full capacity',
      'Hold the top for one second and lower slowly — the band provides progressive resistance that peaks at your strongest point'
    ],
    ytUrl: 'https://youtu.be/lUeI-IwVXFM',
    goldStar: true,
    similarityGroup: 'single-leg-calf-raise',
    alsoInProgram: false
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CALF_EXERCISE_LIBRARY };
}
