/**
 * T&S Muscle — Shoulder Exercise Library
 * All shoulder exercises across every equipment category.
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

const SHOULDER_EXERCISE_LIBRARY = [

  // ─── BARBELL ──────────────────────────────────────────────────────────────

  {
    id: 'barbell-ohp',
    name: 'Barbell Overhead Press',
    muscleGroup: 'shoulders',
    equipment: 'Barbell',
    snapshot: 'Press barbell overhead from collarbone to lockout',
    cues: [
      'Grip just outside shoulder-width and rest the bar on your upper chest before pressing',
      'Brace your core and squeeze your glutes hard — this protects your lower back',
      'Press straight up, move your head back slightly as the bar passes your face',
      'Shrug slightly at the top to lock the bar out over your mid-foot'
    ],
    ytUrl: 'https://youtu.be/wol7Hko8RhY',
    goldStar: true,
    similarityGroup: 'overhead-press-barbell',
    alsoInProgram: true,   // id: 'ohp'
    tier: 'compound'
  },
  {
    id: 'seated-barbell-ohp',
    name: 'Seated Barbell Overhead Press',
    muscleGroup: 'shoulders',
    equipment: 'Barbell',
    snapshot: 'Press barbell overhead seated on upright bench',
    cues: [
      'Set the bench to 90 degrees and sit tall with your back firmly against the pad',
      'Unrack with a controlled pull and hold the bar just in front of your chin',
      'Press straight up without letting your lower back hyperextend off the pad',
      'Lower back to chin height under control — do not bounce off your chest'
    ],
    ytUrl: 'https://youtu.be/0JfYxMRsUCQ',
    goldStar: false,
    similarityGroup: 'overhead-press-barbell',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'barbell-push-press',
    name: 'Barbell Push Press',
    muscleGroup: 'shoulders',
    equipment: 'Barbell',
    snapshot: 'Use leg drive to press barbell overhead explosively',
    cues: [
      'Dip your knees about 10-15 degrees — this is a quick athletic dip, not a squat',
      'Drive hard through your legs and transfer that force directly into the bar',
      'Once the bar is moving, press hard to full lockout overhead',
      'Lower the bar back to your chest under control — the eccentric still counts'
    ],
    ytUrl: 'https://youtu.be/X6-DMh-t4nQ',
    goldStar: false,
    similarityGroup: 'overhead-press-barbell',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'barbell-upright-row',
    name: 'Barbell Upright Row',
    muscleGroup: 'shoulders',
    equipment: 'Barbell',
    snapshot: 'Pull barbell up chest to chin, elbows lead',
    cues: [
      'Use a shoulder-width or slightly wider grip — narrow grips stress the wrist and shoulder joints',
      'Lead with your elbows and pull them up and out to the sides',
      'Stop when your elbows reach shoulder height — going higher impinges the shoulder',
      'Lower slowly and with control, keeping the bar close to your body'
    ],
    ytUrl: 'https://youtu.be/AWsGWt-VMl8',
    goldStar: false,
    similarityGroup: 'upright-row',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'barbell-front-raise',
    name: 'Barbell Front Raise',
    muscleGroup: 'shoulders',
    equipment: 'Barbell',
    snapshot: 'Raise barbell in front to shoulder height',
    cues: [
      'Stand tall with a pronated grip, hands just inside shoulder-width',
      'Keep a slight, fixed bend in your elbows throughout — do not swing',
      'Raise to shoulder height only — going higher loads the traps, not the front delts',
      'Lower on a slow 3-count — the front delt is heavily loaded on the way down'
    ],
    ytUrl: 'https://youtu.be/qhdMn1VBpPQ',
    goldStar: false,
    similarityGroup: 'front-raise',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── DUMBBELL ─────────────────────────────────────────────────────────────

  {
    id: 'db-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscleGroup: 'shoulders',
    equipment: 'Dumbbell',
    snapshot: 'Press dumbbells overhead from ear height seated',
    cues: [
      'Start with dumbbells at ear height, elbows at 90 degrees and slightly in front of your body',
      'Press up and in slightly so the dumbbells meet over your head without clashing',
      'Do not let your lower back arch away from the seat — keep your core braced',
      'Lower slowly back to ear height for a full range of motion on every rep'
    ],
    ytUrl: 'https://youtu.be/GFblCmuEE18',
    goldStar: true,
    similarityGroup: 'overhead-press-db',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    muscleGroup: 'shoulders',
    equipment: 'Dumbbell',
    snapshot: 'Rotating dumbbell press hits all three delt heads',
    cues: [
      'Start with palms facing you and elbows low, like the top of a curl',
      'Rotate your palms outward as you press — finish with palms facing forward at the top',
      'Keep the rotation and press happening simultaneously — one smooth motion',
      'Reverse the rotation on the way down to return to the curl position'
    ],
    ytUrl: 'https://youtu.be/pzqeWbFP1ck',
    goldStar: false,
    similarityGroup: 'overhead-press-db',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'db-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'Dumbbell',
    snapshot: 'Raise dumbbells out to sides to shoulder height',
    cues: [
      'Hinge slightly forward at the hips and keep a soft, fixed bend in your elbows',
      'Lead with your elbows, not your hands — think of pouring a pitcher of water',
      'Stop at shoulder height — going higher shifts work to your upper traps',
      'Lower on a slow 3-count — the side delt is under tension on the way down too'
    ],
    ytUrl: 'https://youtu.be/v_ZkxWzYnMc',
    goldStar: false,
    similarityGroup: 'lateral-raise-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'leaning-db-lateral-raise',
    name: 'Leaning Dumbbell Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'Dumbbell',
    snapshot: 'Raise single dumbbell laterally while leaning away',
    cues: [
      'Hold a sturdy upright with one hand and lean your body away at an angle',
      'This lean creates tension at the bottom of the range — use a lighter weight',
      'Raise the dumbbell out to the side to shoulder height with a soft elbow bend',
      'Lower slowly and feel the stretch at the bottom before the next rep'
    ],
    ytUrl: 'https://youtu.be/qWif_7SOYpQ',
    goldStar: true,
    similarityGroup: 'lateral-raise-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-rear-delt-raise',
    name: 'Bent-Over Dumbbell Rear Delt Raise',
    muscleGroup: 'shoulders',
    equipment: 'Dumbbell',
    snapshot: 'Hinge over and raise dumbbells out to sides',
    cues: [
      'Hinge at the hips until your torso is nearly parallel to the floor',
      'Keep a soft, fixed bend in your elbows — do not curl the dumbbells up',
      'Lead with your elbows and raise them to shoulder height, squeezing rear delts at the top',
      'Control the descent — do not let gravity pull the weights back down'
    ],
    ytUrl: 'https://youtu.be/ttvfGg9d76c',
    goldStar: true,
    similarityGroup: 'rear-delt-db',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'db-front-raise',
    name: 'Dumbbell Front Raise',
    muscleGroup: 'shoulders',
    equipment: 'Dumbbell',
    snapshot: 'Raise dumbbells in front to shoulder height alternating',
    cues: [
      'Stand tall with dumbbells at your thighs, palms facing down or inward',
      'Raise one arm at a time with a slight, fixed elbow bend — no swinging',
      'Stop at shoulder height for peak front delt tension without trapping over',
      'Lower under control and alternate arms to keep form consistent each side'
    ],
    ytUrl: 'https://youtu.be/UPaXKcTf5TE',
    goldStar: false,
    similarityGroup: 'front-raise',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── CABLE ────────────────────────────────────────────────────────────────

  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'Cable',
    snapshot: 'Raise cable handle out to side at shoulder height',
    cues: [
      'Set the pulley to the lowest position and stand with the cable crossing in front of you',
      'Keep a soft, fixed elbow bend and lead with your elbow — not your hand',
      'Raise to shoulder height and pause briefly before lowering',
      'Lower on a slow 3-count — cables keep tension at the bottom unlike dumbbells'
    ],
    ytUrl: 'https://youtu.be/v_ZkxWzYnMc',
    goldStar: true,
    similarityGroup: 'lateral-raise-cable',
    alsoInProgram: true,   // id: 'lateral'
    tier: 'isolation'
  },
  {
    id: 'cable-shoulder-press',
    name: 'Cable Shoulder Press',
    muscleGroup: 'shoulders',
    equipment: 'Cable',
    snapshot: 'Press cable handles overhead from shoulder height',
    cues: [
      'Set pulleys to just below shoulder height and use a split stance for balance',
      'Keep your core braced — the cable will pull you back if you let your guard down',
      'Press straight up and slightly in, meeting the handles overhead at lockout',
      'Lower slowly back to start — constant cable tension makes the eccentric demanding'
    ],
    ytUrl: 'https://youtu.be/GFblCmuEE18',
    goldStar: true,
    similarityGroup: 'overhead-press-cable',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'cable-upright-row',
    name: 'Cable Upright Row',
    muscleGroup: 'shoulders',
    equipment: 'Cable',
    snapshot: 'Pull cable bar up chest, elbows flare out',
    cues: [
      'Use a straight bar or rope attachment set at the lowest pulley',
      'Lead with your elbows — drive them up and out to the sides',
      'Stop when your elbows reach shoulder height to avoid shoulder impingement',
      'Return the bar slowly and keep tension on the cable at the bottom'
    ],
    ytUrl: 'https://youtu.be/FjlQ9Bpo0YA',
    goldStar: true,
    similarityGroup: 'upright-row',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'cable-rear-delt-flye',
    name: 'Cable Rear Delt Flye',
    muscleGroup: 'shoulders',
    equipment: 'Cable',
    snapshot: 'Cross cables and pull handles apart at shoulder height',
    cues: [
      'Set both pulleys at shoulder height and cross the cables, grabbing the opposite handle each side',
      'Hinge slightly forward at the hips to target the rear delt directly',
      'Pull your arms apart and back, squeezing your rear delts at the end range',
      'Return slowly under control — do not let the cables yank your arms forward'
    ],
    ytUrl: 'https://youtu.be/o-SxXUES-To',
    goldStar: true,
    similarityGroup: 'rear-delt-cable',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-face-pull',
    name: 'Cable Face Pull',
    muscleGroup: 'shoulders',
    equipment: 'Cable',
    snapshot: 'Pull rope to face, elbows high and wide',
    cues: [
      'Set the pulley at upper-chest or eye height and use a rope attachment',
      'Pull the rope toward your face and separate the handles at the end, like a double bicep pose',
      'Keep your elbows high — parallel to the floor or slightly above',
      'Pause with external rotation fully expressed, then return slowly'
    ],
    ytUrl: 'https://youtu.be/rep-qVOkqgk',
    goldStar: false,
    similarityGroup: 'rear-delt-cable',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'cable-front-raise',
    name: 'Cable Front Raise',
    muscleGroup: 'shoulders',
    equipment: 'Cable',
    snapshot: 'Raise cable handle in front to shoulder height',
    cues: [
      'Set the pulley to the lowest position and stand facing away from the machine',
      'Keep a slight, fixed elbow bend and avoid swinging your torso for momentum',
      'Raise to shoulder height — constant cable tension makes this more effective than dumbbells',
      'Lower slowly on a 3-count — the front delt is loaded throughout the descent'
    ],
    ytUrl: 'https://youtu.be/K2I7g8_fnc0',
    goldStar: true,
    similarityGroup: 'front-raise',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── MACHINE ──────────────────────────────────────────────────────────────

  {
    id: 'machine-shoulder-press',
    name: 'Machine Shoulder Press',
    muscleGroup: 'shoulders',
    equipment: 'Machine',
    snapshot: 'Press machine handles overhead in guided path',
    cues: [
      'Adjust the seat so handles start at shoulder height — not lower or higher',
      'Keep your back flat against the pad throughout — do not arch away from it',
      'Press to full extension overhead, then lower under control',
      'Do not slam the stack at the bottom — keep tension on the muscle throughout'
    ],
    ytUrl: 'https://youtu.be/WvLMauqrnK8',
    goldStar: true,
    similarityGroup: 'overhead-press-machine',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'smith-machine-ohp',
    name: 'Smith Machine Overhead Press',
    muscleGroup: 'shoulders',
    equipment: 'Machine',
    snapshot: 'Press Smith bar overhead in fixed vertical track',
    cues: [
      'Sit or stand close to the bar — you want a nearly vertical pressing path',
      'Grip just outside shoulder-width and unrack by rotating the bar out of the hooks',
      'Lower to upper chest or chin level and press back to full lockout',
      'The fixed path means you can safely go closer to failure than with a free bar'
    ],
    ytUrl: 'https://youtu.be/YfMpXa0RQKQ',
    goldStar: false,
    similarityGroup: 'overhead-press-machine',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'landmine-press',
    name: 'Landmine Press',
    muscleGroup: 'shoulders',
    equipment: 'Machine',
    snapshot: 'Press angled barbell overhead in arcing path',
    cues: [
      'Anchor the bar in a landmine attachment or a sturdy corner and load the free end',
      'Hold the sleeve with both hands or one hand at chest height',
      'Press along the natural arc of the bar — it goes up and slightly away from you',
      'This arc is much easier on the shoulder joint than a strict vertical press'
    ],
    ytUrl: 'https://youtu.be/gH7PDepHNck',
    goldStar: false,
    similarityGroup: 'landmine-press',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'machine-lateral-raise',
    name: 'Machine Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'Machine',
    snapshot: 'Raise padded arms laterally on dedicated machine',
    cues: [
      'Adjust the seat height so the machine axis lines up with your shoulder joint',
      'Rest your elbows against the pads — do not grip the handles tightly',
      'Raise to shoulder height and squeeze the side delt briefly at the top',
      'Lower slowly on a 3-count — the eccentric phase on a machine is highly effective'
    ],
    ytUrl: 'https://youtu.be/v_ZkxWzYnMc',
    goldStar: true,
    similarityGroup: 'lateral-raise-machine',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'pec-deck-rear-delt',
    name: 'Pec Deck Rear Delt (Reverse)',
    muscleGroup: 'shoulders',
    equipment: 'Machine',
    snapshot: 'Face machine and pull arms back for rear delts',
    cues: [
      'Face the machine and set the handles so your arms are parallel to the floor at the start',
      'Use a neutral or overhand grip and keep a soft, fixed elbow bend throughout',
      'Pull your arms back and apart, squeezing your rear delts hard at the end range',
      'Return slowly — do not let the weight plates slam together at the front'
    ],
    ytUrl: 'https://youtu.be/o-SxXUES-To',
    goldStar: true,
    similarityGroup: 'rear-delt-machine',
    alsoInProgram: true,   // id: 'rear-delt'
    tier: 'isolation'
  },

  // ─── BODYWEIGHT ───────────────────────────────────────────────────────────

  {
    id: 'pike-push-up',
    name: 'Pike Push-Up',
    muscleGroup: 'shoulders',
    equipment: 'Bodyweight',
    snapshot: 'Lower head toward floor in inverted V position',
    cues: [
      'Form an inverted V with your hips high so your torso is nearly vertical',
      'The more vertical your torso, the more deltoid involvement you get',
      'Lower the top of your head toward the floor between your hands',
      'Press back to the start by driving your hands into the floor — keep hips up throughout'
    ],
    ytUrl: 'https://youtu.be/x7_I5SUAd00',
    goldStar: true,
    similarityGroup: 'overhead-press-bodyweight',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'wall-handstand-push-up',
    name: 'Wall Handstand Push-Up',
    muscleGroup: 'shoulders',
    equipment: 'Bodyweight',
    snapshot: 'Press full bodyweight overhead inverted against wall',
    cues: [
      'Kick up to the wall with your chest or back facing it and get comfortable before starting',
      'Lower your head toward the floor in a controlled way — do not just drop',
      'Keep your core tight and your body in a straight line from hands to feet',
      'Press back to lockout explosively — range of motion beats momentum for shoulder development'
    ],
    ytUrl: 'https://youtu.be/TlCuKKcLDwo',
    goldStar: false,
    similarityGroup: 'overhead-press-bodyweight',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'prone-yt-raise',
    name: 'Prone Y/T Raise',
    muscleGroup: 'shoulders',
    equipment: 'Bodyweight',
    snapshot: 'Lie face down and lift arms in Y and T shapes',
    cues: [
      'Lie face down on the floor or an incline bench and squeeze your shoulder blades back and down',
      'For the Y, raise your arms above your head at a 45-degree angle from your body',
      'For the T, raise your arms straight out to the sides at shoulder height',
      'Use no weight or very light plates — these are small muscles and form breaks fast'
    ],
    ytUrl: 'https://youtu.be/oV_C5-KMRMU',
    goldStar: true,
    similarityGroup: 'rear-delt-bodyweight',
    alsoInProgram: false,
    tier: 'isolation'
  },

  // ─── RESISTANCE BAND ──────────────────────────────────────────────────────

  {
    id: 'band-overhead-press',
    name: 'Band Overhead Press',
    muscleGroup: 'shoulders',
    equipment: 'Resistance Band',
    snapshot: 'Press band overhead standing on looped band',
    cues: [
      'Stand on the middle of the band and hold both ends at shoulder height',
      'Keep your core braced — the band will try to pull you forward at the top',
      'Press to full lockout and hold briefly before lowering',
      'Control the descent slowly — band resistance increases overhead so the eccentric is loaded'
    ],
    ytUrl: 'https://youtu.be/WcHpAMbOGGk',
    goldStar: true,
    similarityGroup: 'overhead-press-band',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'band-lateral-raise',
    name: 'Band Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'Resistance Band',
    snapshot: 'Step on band and raise arm out to shoulder height',
    cues: [
      'Stand on the band with the same foot as the arm you are raising',
      'Keep a soft, fixed elbow bend and lead with your elbow on the way up',
      'Raise to shoulder height — band tension increases the higher you go',
      'Lower slowly to feel the constant tension throughout the range of motion'
    ],
    ytUrl: 'https://youtu.be/3N1uPbKMNSo',
    goldStar: true,
    similarityGroup: 'lateral-raise-band',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-rear-delt-flye',
    name: 'Band Rear Delt Flye',
    muscleGroup: 'shoulders',
    equipment: 'Resistance Band',
    snapshot: 'Pull band apart at chest height for rear delts',
    cues: [
      'Hold the band in front of you at chest height with both hands, palms facing down',
      'Hinge slightly forward at the hips to put the rear delt in a stronger pulling position',
      'Pull the band apart by driving your elbows back and out to the sides',
      'Squeeze your rear delts at the end range before returning slowly'
    ],
    ytUrl: 'https://youtu.be/vMBLDt0BOhA',
    goldStar: true,
    similarityGroup: 'rear-delt-band',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-face-pull',
    name: 'Band Face Pull',
    muscleGroup: 'shoulders',
    equipment: 'Resistance Band',
    snapshot: 'Pull band toward face with elbows high and wide',
    cues: [
      'Anchor the band at eye level on a door or sturdy post',
      'Pull toward your face and spread the band apart, like a double bicep pose',
      'Keep your elbows high — at or above shoulder height throughout the movement',
      'Pause at full external rotation for a moment before returning slowly'
    ],
    ytUrl: 'https://youtu.be/d6wR7TxSvT8',
    goldStar: false,
    similarityGroup: 'rear-delt-band',
    alsoInProgram: false,
    tier: 'isolation'
  },
  {
    id: 'band-upright-row',
    name: 'Band Upright Row',
    muscleGroup: 'shoulders',
    equipment: 'Resistance Band',
    snapshot: 'Pull band up from waist to chin, elbows lead',
    cues: [
      'Stand on the band with feet hip-width and hold both ends with an overhand grip',
      'Lead with your elbows and pull them up and out to the sides',
      'Stop when your elbows reach shoulder height — going higher stresses the shoulder joint',
      'Lower back down under control before your next rep'
    ],
    ytUrl: 'https://youtu.be/YGdFHMqVxFU',
    goldStar: false,
    similarityGroup: 'upright-row',
    alsoInProgram: false,
    tier: 'compound'
  },
  {
    id: 'band-front-raise',
    name: 'Band Front Raise',
    muscleGroup: 'shoulders',
    equipment: 'Resistance Band',
    snapshot: 'Stand on band and raise both arms in front',
    cues: [
      'Stand on the middle of the band with feet together and hold both ends with palms facing down',
      'Keep a slight, fixed elbow bend — do not swing your torso for momentum',
      'Raise to shoulder height only — constant band tension makes this very effective at low loads',
      'Lower slowly on a 3-count and repeat without bouncing at the bottom'
    ],
    ytUrl: 'https://youtu.be/p_tJJ1CJmZE',
    goldStar: false,
    similarityGroup: 'front-raise',
    alsoInProgram: false,
    tier: 'isolation'
  }

];

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SHOULDER_EXERCISE_LIBRARY };
}
