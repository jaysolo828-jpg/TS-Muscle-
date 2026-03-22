/**
 * T&S Muscle — Quad Exercise Library
 * All quad exercises across every equipment category.
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

const QUAD_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'quads',
    equipment: 'Barbell',
    snapshot: 'Squat with barbell across upper back to depth',
    cues: [
      'Keep your chest tall and brace your core before you unrack — do not start loose',
      'Push your knees out in the direction of your toes as you descend',
      'Hit at least parallel — thighs level with the floor — before driving back up',
      'Drive through your whole foot and think about pushing the floor away from you'
    ],
    ytUrl: 'https://youtu.be/Dy28eq2PjcM',
    goldStar: false,
    similarityGroup: 'squat-barbell',
    alsoInProgram: false
  },
  {
    id: 'barbell-front-squat',
    name: 'Barbell Front Squat',
    muscleGroup: 'quads',
    equipment: 'Barbell',
    snapshot: 'Squat with bar on front shoulders, torso upright',
    cues: [
      'Rest the bar in the groove of your front shoulders and keep your elbows high — they cannot drop',
      'The upright torso this forces is what makes this the most quad-dominant barbell squat',
      'Descend slowly and keep your knees tracking over your toes throughout',
      'Drive straight up from the bottom — the bar position self-corrects if your torso leans forward'
    ],
    ytUrl: 'https://youtu.be/m4ytmcZ_Jkw',
    goldStar: true,
    similarityGroup: 'squat-barbell',
    alsoInProgram: false
  },
  {
    id: 'barbell-walking-lunge',
    name: 'Barbell Walking Lunge',
    muscleGroup: 'quads',
    equipment: 'Barbell',
    snapshot: 'Step and lunge forward alternating legs with barbell',
    cues: [
      'Place the bar on your upper back like a back squat and take controlled steps forward',
      'Step far enough that your front shin stays vertical when your knee is at 90 degrees',
      'Lower your back knee toward the floor without letting it slam down',
      'Drive through your front heel to stand and bring your feet together before the next step'
    ],
    ytUrl: 'https://youtu.be/D7KaRcUTQeE',
    goldStar: false,
    similarityGroup: 'lunge',
    alsoInProgram: false
  },
  {
    id: 'barbell-bulgarian-split-squat',
    name: 'Barbell Bulgarian Split Squat',
    muscleGroup: 'quads',
    equipment: 'Barbell',
    snapshot: 'Rear foot elevated squat with barbell on back',
    cues: [
      'Place the bar on your upper back and elevate your rear foot on a bench behind you',
      'Stand far enough from the bench so your front shin stays vertical at the bottom',
      'Lower until your front thigh is parallel to the floor — keep your torso upright for more quad emphasis',
      'Drive through your front heel to stand — let the rear leg be a passenger, not a driver'
    ],
    ytUrl: 'https://youtu.be/2C-uNgKwPLE',
    goldStar: false,
    similarityGroup: 'bulgarian-split-squat',
    alsoInProgram: false
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    muscleGroup: 'quads',
    equipment: 'Dumbbell',
    snapshot: 'Hold dumbbell at chest and squat deep upright',
    cues: [
      'Hold the dumbbell vertically at your chest with both hands cupped under the top end',
      'The counterweight pulls you into an upright torso automatically — lean into it',
      'Squat as deep as your mobility allows — the goblet position makes it easier to hit depth',
      'Drive your knees out and push through your whole foot to stand'
    ],
    ytUrl: 'https://youtu.be/MeIiIdhvXT4',
    goldStar: true,
    similarityGroup: 'squat-db',
    alsoInProgram: false
  },
  {
    id: 'db-reverse-lunge',
    name: 'Dumbbell Reverse Lunge',
    muscleGroup: 'quads',
    equipment: 'Dumbbell',
    snapshot: 'Step back into lunge and drive front leg up',
    cues: [
      'Hold dumbbells at your sides and step one foot directly backward onto your toes',
      'Lower your back knee toward the floor while keeping your front shin vertical',
      'Push exclusively through your front heel to return to standing — the rear leg assists minimally',
      'Reverse lunging reduces anterior knee shear compared to forward lunging — kinder on the knee joint'
    ],
    ytUrl: 'https://youtu.be/J9MpoAQCjos',
    goldStar: true,
    similarityGroup: 'lunge',
    alsoInProgram: false
  },
  {
    id: 'db-walking-lunge',
    name: 'Dumbbell Walking Lunge',
    muscleGroup: 'quads',
    equipment: 'Dumbbell',
    snapshot: 'Step forward into lunge alternating legs moving ahead',
    cues: [
      'Hold dumbbells at your sides and take a controlled step forward — not too short',
      'Lower your back knee toward the floor while keeping your front shin vertical',
      'Drive through your front heel to bring your rear foot forward for the next step',
      'Keep your torso tall throughout — rounding forward shifts the load away from your quads'
    ],
    ytUrl: 'https://youtu.be/D7KaRcUTQeE',
    goldStar: false,
    similarityGroup: 'lunge',
    alsoInProgram: false
  },
  {
    id: 'db-step-up',
    name: 'Dumbbell Step-Up',
    muscleGroup: 'quads',
    equipment: 'Dumbbell',
    snapshot: 'Step onto bench with dumbbells and drive up',
    cues: [
      'Use a bench or box at roughly knee height and place your full foot flat on the surface',
      'Drive through the heel of your elevated foot — avoid pushing off your trailing leg on the floor',
      'Stand tall at the top with a brief pause before stepping back down with control',
      'The higher the box, the more glute involvement — lower box keeps emphasis on quads'
    ],
    ytUrl: 'https://youtu.be/dQqApCGd5Ss',
    goldStar: true,
    similarityGroup: 'step-up',
    alsoInProgram: false
  },
  {
    id: 'db-bulgarian-split-squat',
    name: 'Bulgarian Split Squat (Dumbbell)',
    muscleGroup: 'quads',
    equipment: 'Dumbbell',
    snapshot: 'Rear foot elevated on bench, dumbbells at sides',
    cues: [
      'Hold dumbbells at your sides and place your rear foot on a bench behind you',
      'Position your front foot far enough forward that your shin stays vertical at the bottom',
      'Lower until your front thigh is parallel to the floor — keep your torso upright to maximize quad drive',
      'Drive through your front heel to stand — complete all reps on one side before switching'
    ],
    ytUrl: 'https://youtu.be/2C-uNgKwPLE',
    goldStar: true,
    similarityGroup: 'bulgarian-split-squat',
    alsoInProgram: true   // id: 'bss'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-squat',
    name: 'Cable Squat',
    muscleGroup: 'quads',
    equipment: 'Cable',
    snapshot: 'Hold low cable and squat with upright torso',
    cues: [
      'Set the pulley low, hold the rope or handle at chest height, and stand far enough for cable tension',
      'The cable pulls you slightly forward which counterbalances your weight and allows a very upright torso',
      'Squat as deep as your mobility allows — cable squats are excellent for learning depth',
      'Drive through your full foot to stand and keep the cable taut throughout the set'
    ],
    ytUrl: 'https://youtu.be/MeIiIdhvXT4',
    goldStar: true,
    similarityGroup: 'squat-cable',
    alsoInProgram: false
  },
  {
    id: 'cable-reverse-lunge',
    name: 'Cable Reverse Lunge',
    muscleGroup: 'quads',
    equipment: 'Cable',
    snapshot: 'Step back into lunge with cable anchored at waist',
    cues: [
      'Attach a belt or use a D-handle at hip height and stand facing away from the pulley',
      'Step one foot directly backward while the cable provides forward tension on your torso',
      'Lower your back knee toward the floor with your front shin vertical',
      'Drive through your front heel to return — the cable adds constant tension that dumbbells cannot replicate at this angle'
    ],
    ytUrl: 'https://youtu.be/J9MpoAQCjos',
    goldStar: false,
    similarityGroup: 'lunge',
    alsoInProgram: false
  },
  {
    id: 'cable-leg-extension',
    name: 'Cable Standing Leg Extension',
    muscleGroup: 'quads',
    equipment: 'Cable',
    snapshot: 'Attach cable to ankle and extend knee forward',
    cues: [
      'Attach an ankle cuff to the low pulley and face away from the machine',
      'Bend the working knee slightly and extend it forward and up in a controlled kick',
      'Keep your thigh still — only your lower leg moves from the knee down',
      'Lower slowly under cable tension — the eccentric here is often the hardest part'
    ],
    ytUrl: 'https://youtu.be/IhuboUEej7Y',
    goldStar: false,
    similarityGroup: 'leg-extension',
    alsoInProgram: false
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'leg-press-mid-foot',
    name: 'Leg Press (Mid-Foot, Moderate Stance)',
    muscleGroup: 'quads',
    equipment: 'Machine',
    snapshot: 'Press platform away feet mid-height shoulder-width',
    cues: [
      'Place your feet at mid-height on the platform, hip to shoulder-width apart',
      'Lower the platform until your knees reach 90 degrees — do not compress past that point',
      'Press through your whole foot — not just your toes or just your heels',
      'Do not lock out your knees fully at the top — keep a soft bend to maintain tension'
    ],
    ytUrl: 'https://youtu.be/K_BXb4e9ljo',
    goldStar: true,
    similarityGroup: 'leg-press',
    alsoInProgram: true   // id: 'legpress-a'
  },
  {
    id: 'leg-press-high-foot',
    name: 'Leg Press (High Foot, Wide Stance)',
    muscleGroup: 'quads',
    equipment: 'Machine',
    snapshot: 'Press platform with feet high and wide on pad',
    cues: [
      'Place your feet high on the platform and take a wide stance with toes angled out',
      'This foot position shifts emphasis toward the hamstrings, glutes, and inner quads',
      'Lower to a depth where your lower back stays flat against the pad — do not let it curl',
      'Press through your heels — the high foot placement naturally moves pressure toward the heel'
    ],
    ytUrl: 'https://youtu.be/K_BXb4e9ljo',
    goldStar: false,
    similarityGroup: 'leg-press',
    alsoInProgram: true   // id: 'legpress-b'
  },
  {
    id: 'single-leg-press',
    name: 'Single Leg Press',
    muscleGroup: 'quads',
    equipment: 'Machine',
    snapshot: 'Press leg press platform with one leg only',
    cues: [
      'Use roughly half your bilateral leg press weight as your starting point for one leg',
      'Place your single foot at mid-height on the platform, centered or slightly toward the working side',
      'Lower to 90 degrees and press back without locking out the knee fully at the top',
      'Single leg work reveals and corrects strength imbalances between your left and right quad'
    ],
    ytUrl: 'https://youtu.be/K_BXb4e9ljo',
    goldStar: true,
    similarityGroup: 'leg-press-unilateral',
    alsoInProgram: true   // id: 'single-legpress'
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat Machine',
    muscleGroup: 'quads',
    equipment: 'Machine',
    snapshot: 'Squat on angled machine sled with back supported',
    cues: [
      'Place your feet low and close on the platform to maximize quad recruitment over glute',
      'Keep your back flat against the pad throughout — the machine supports your spine so use it',
      'Descend until your thighs break parallel before pressing back up',
      'Drive through your full foot and keep your knees tracking over your toes the whole way'
    ],
    ytUrl: 'https://youtu.be/m2DiSYKPzqk',
    goldStar: true,
    similarityGroup: 'squat-machine',
    alsoInProgram: false
  },
  {
    id: 'smith-machine-squat',
    name: 'Smith Machine Squat',
    muscleGroup: 'quads',
    equipment: 'Machine',
    snapshot: 'Squat inside Smith machine on fixed vertical track',
    cues: [
      'Position your feet slightly in front of the bar — not directly under it like a free squat',
      'The fixed bar path means you can go deeper and closer to failure safely than with a free barbell',
      'Keep your chest tall and push your knees out as you descend',
      'Rotate the bar out of the safeties before starting and back in at the end of every set'
    ],
    ytUrl: 'https://youtu.be/m2DiSYKPzqk',
    goldStar: false,
    similarityGroup: 'squat-machine',
    alsoInProgram: false
  },
  {
    id: 'machine-leg-extension',
    name: 'Leg Extension Machine',
    muscleGroup: 'quads',
    equipment: 'Machine',
    snapshot: 'Extend both legs from bent to straight on machine',
    cues: [
      'Adjust the seat so your knee joint lines up exactly with the machine axis — misalignment causes joint stress',
      'Extend to full lockout and hold for one second — you need that peak contraction for isolation work',
      'Lower on a slow 3-count and do not let the stack slam at the bottom between reps',
      'Avoid swinging or leaning back to help — if you are doing that, reduce the weight'
    ],
    ytUrl: 'https://youtu.be/IhuboUEej7Y',
    goldStar: true,
    similarityGroup: 'leg-extension',
    alsoInProgram: true   // id: 'leg-ext-a' and 'leg-ext-b'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    muscleGroup: 'quads',
    equipment: 'Bodyweight',
    snapshot: 'Squat to parallel and stand with no weight',
    cues: [
      'Stand with feet shoulder-width and toes turned out slightly — find a stance that feels natural',
      'Keep your chest tall and push your knees outward as you lower',
      'Squat until your thighs are at least parallel to the floor before standing back up',
      'Add tempo to increase difficulty — try a 3-second descent and 1-second pause at the bottom'
    ],
    ytUrl: 'https://youtu.be/Dy28eq2PjcM',
    goldStar: true,
    similarityGroup: 'squat-bodyweight',
    alsoInProgram: false
  },
  {
    id: 'sissy-squat',
    name: 'Sissy Squat',
    muscleGroup: 'quads',
    equipment: 'Bodyweight',
    snapshot: 'Lean back and lower knees toward floor on toes',
    cues: [
      'Hold something sturdy for balance and stand with your heels slightly elevated on a plate or wedge',
      'Let your knees travel far forward while leaning your torso back — your body forms a straight line from knees to shoulders',
      'Lower until your thighs are near parallel to the floor then drive back up by extending your knees',
      'This is an advanced move — build up slowly and stop if you feel sharp knee pain rather than burn'
    ],
    ytUrl: 'https://youtu.be/AYN-U5nZieY',
    goldStar: true,
    similarityGroup: 'sissy-squat',
    alsoInProgram: false
  },
  {
    id: 'wall-sit',
    name: 'Wall Sit',
    muscleGroup: 'quads',
    equipment: 'Bodyweight',
    snapshot: 'Hold squat position with back flat against wall',
    cues: [
      'Slide your back down a flat wall until your thighs are parallel to the floor',
      'Your shins should be vertical and your knees directly over your ankles — adjust your foot position if needed',
      'Keep your back completely flat against the wall — do not let your lower back arch away',
      'Build hold time progressively — aim for 60 seconds before adding a weight plate on your thighs'
    ],
    ytUrl: 'https://youtu.be/y-wV4Venusw',
    goldStar: true,
    similarityGroup: 'wall-sit',
    alsoInProgram: false
  },
  {
    id: 'pistol-squat',
    name: 'Pistol Squat (Assisted)',
    muscleGroup: 'quads',
    equipment: 'Bodyweight',
    snapshot: 'Single leg squat to full depth one leg extended',
    cues: [
      'Hold a door frame or TRX strap with one hand for balance — reduce assistance as you get stronger',
      'Extend one leg forward and lower on the standing leg as deep as your mobility allows',
      'Keep your standing heel flat on the floor throughout — if it rises you need to work on ankle mobility',
      'Drive through your heel to stand — this is one of the hardest bodyweight leg exercises so progress patiently'
    ],
    ytUrl: 'https://youtu.be/bH3mRwnAN88',
    goldStar: false,
    similarityGroup: 'squat-bodyweight',
    alsoInProgram: false
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-squat',
    name: 'Band Squat',
    muscleGroup: 'quads',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band and squat against upward resistance',
    cues: [
      'Stand on the middle of the band with feet shoulder-width and loop both ends over your shoulders',
      'The band increases resistance as you stand — hardest at the top where you are strongest',
      'Keep your chest tall, push your knees out, and squat to at least parallel',
      'Control the descent — band deceleration on the way down is easy to rush so slow it down'
    ],
    ytUrl: 'https://youtu.be/Dy28eq2PjcM',
    goldStar: true,
    similarityGroup: 'squat-band',
    alsoInProgram: false
  },
  {
    id: 'band-step-up',
    name: 'Band Step-Up',
    muscleGroup: 'quads',
    equipment: 'Resistance Band',
    snapshot: 'Step onto box with band adding upward resistance',
    cues: [
      'Stand on the band with both feet and loop it over your shoulders for resistance',
      'Place one foot fully on the box or bench and drive through that heel to step up',
      'Stand tall at the top with hips fully extended before stepping back down slowly',
      'The band makes the top of the movement hardest — pause briefly there to feel the peak quad contraction'
    ],
    ytUrl: 'https://youtu.be/dQqApCGd5Ss',
    goldStar: false,
    similarityGroup: 'step-up',
    alsoInProgram: false
  },
  {
    id: 'band-tke',
    name: 'Terminal Knee Extension (Band)',
    muscleGroup: 'quads',
    equipment: 'Resistance Band',
    snapshot: 'Straighten slightly bent knee against band resistance',
    cues: [
      'Anchor the band at knee height behind you and loop it around the back of one knee',
      'Stand with a very slight bend in the working knee — this is your start position',
      'Straighten your knee fully against the band by contracting your quad — do not lock it aggressively',
      'This small-range exercise is excellent for VMO activation and knee rehab — high reps and light band work best'
    ],
    ytUrl: 'https://youtu.be/yE7sFjtnmZE',
    goldStar: true,
    similarityGroup: 'band-tke',
    alsoInProgram: false
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUAD_EXERCISE_LIBRARY };
}
