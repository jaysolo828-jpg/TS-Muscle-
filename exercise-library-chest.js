/**
 * T&S Muscle — Chest Exercise Library
 * Generated for the Exercise Library feature.
 *
 * Each entry includes:
 *   id              – unique kebab-case identifier
 *   name            – display name
 *   muscleGroup     – primary muscle group (always 'CHEST' here)
 *   equipment       – Barbell | Dumbbell | Cable | Machine | Bodyweight | Resistance Band
 *   movementSnapshot– 6–8 plain-language words describing the motion
 *   formCues        – array of 4 evidence-based cues in plain language
 *   ytLink          – YouTube tutorial URL (best match from known sources)
 *   ytFlagged       – true if URL is a best guess and should be verified
 *   goldStar        – true for the scientifically strongest option per movement pattern
 *                     (only one goldStar per similarityGroup)
 *   similarityGroup – movement-pattern bucket used to cluster swaps
 *   alsoInProgram   – true if this exercise is a primary lift in any built-in program
 *                     (cross-referenced: bench, incline, flye)
 */

const CHEST_EXERCISE_LIBRARY = [

  // ─── BARBELL ────────────────────────────────────────────────────────────────

  {
    id: 'bb-bench-flat',
    name: 'Barbell Bench Press',
    muscleGroup: 'CHEST',
    equipment: 'Barbell',
    movementSnapshot: 'Lower bar to chest, press powerfully upward',
    formCues: [
      'Squeeze shoulder blades together and down before unracking the bar',
      'Keep wrists stacked directly over your elbows throughout the lift',
      'Touch bar lightly to your lower chest (nipple line), not your throat',
      'Press in a slight arc back toward the uprights at lockout'
    ],
    ytLink: 'https://youtu.be/ysUTNll8JQ8',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'flat-press',
    alsoInProgram: true   // program id: 'bench'
  },

  {
    id: 'bb-bench-incline',
    name: 'Barbell Incline Bench Press',
    muscleGroup: 'CHEST',
    equipment: 'Barbell',
    movementSnapshot: 'Press bar up from upper chest on incline',
    formCues: [
      'Set bench to 30–45 degrees — steeper angles shift load to shoulders',
      'Use a grip slightly narrower than flat bench to stop elbows flaring wide',
      'Lower bar to just below your collarbones, not to mid-chest',
      'Keep your back pinned to the pad and avoid shrugging at the top'
    ],
    ytLink: 'https://youtu.be/DbFgADa2PL8',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'incline-press',
    alsoInProgram: false
  },

  {
    id: 'bb-bench-decline',
    name: 'Barbell Decline Bench Press',
    muscleGroup: 'CHEST',
    equipment: 'Barbell',
    movementSnapshot: 'Press bar from lower chest on declined bench',
    formCues: [
      'Anchor feet securely before unracking — you will slide forward without support',
      'Lower the bar to the lower portion of your sternum with a controlled descent',
      'Keep elbows at 45–60 degrees from your torso to protect your shoulders',
      'Control the descent for 2 seconds to keep tension on the lower chest'
    ],
    ytLink: 'https://youtu.be/6fotcWsMb0c',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'decline-press',
    alsoInProgram: false
  },

  {
    id: 'bb-floor-press',
    name: 'Barbell Floor Press',
    muscleGroup: 'CHEST',
    equipment: 'Barbell',
    movementSnapshot: 'Press bar up lying flat on the floor',
    formCues: [
      'Set up with upper arms resting flat on the floor at the bottom of each rep',
      'Pause briefly when your triceps touch the floor — do not bounce off it',
      'Keep your core tight and drive through your upper back as you press',
      'The limited range of motion removes leg drive and trains pure upper-body strength'
    ],
    ytLink: 'https://youtu.be/T2gXB8DvTvY',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'floor-press',
    alsoInProgram: false
  },

  // ─── DUMBBELL ───────────────────────────────────────────────────────────────

  {
    id: 'db-bench-flat',
    name: 'Dumbbell Bench Press',
    muscleGroup: 'CHEST',
    equipment: 'Dumbbell',
    movementSnapshot: 'Press dumbbells up from chest level lying flat',
    formCues: [
      'Allow a slight stretch at the bottom — dumbbells can travel wider than a barbell',
      'Lower elbows to just below shoulder height, not perpendicular to your torso',
      'Press explosively upward, stopping just short of touching the dumbbells at the top',
      'Keep wrists neutral and stacked over elbows throughout — avoid letting them roll back'
    ],
    ytLink: 'https://youtu.be/Y_7aHqXeCfQ',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flat-press',
    alsoInProgram: false
  },

  {
    id: 'db-bench-incline',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'CHEST',
    equipment: 'Dumbbell',
    movementSnapshot: 'Press dumbbells up from upper chest on incline',
    formCues: [
      'Set bench to 30–45 degrees — higher angles recruit more front deltoid than chest',
      'Lower dumbbells to upper chest with elbows at roughly 60 degrees from your torso',
      'Keep a slight arch in your lower back with your chest tall throughout the set',
      'Squeeze at the top without fully locking out to maintain constant chest tension'
    ],
    ytLink: 'https://youtu.be/hChjZQhX1Ls',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'incline-press',
    alsoInProgram: true   // program id: 'incline'
  },

  {
    id: 'db-bench-decline',
    name: 'Decline Dumbbell Press',
    muscleGroup: 'CHEST',
    equipment: 'Dumbbell',
    movementSnapshot: 'Press dumbbells up from lower chest on decline',
    formCues: [
      'Secure your legs over the pad before getting into position with the dumbbells',
      'Lower dumbbells to the lower chest with a controlled tempo — no bouncing',
      'Elbows should track at roughly 45 degrees from your torso, not flared straight out',
      'Squeeze the lower chest at the top of each rep before slowly returning'
    ],
    ytLink: 'https://youtu.be/6fotcWsMb0c',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'decline-press',
    alsoInProgram: false
  },

  {
    id: 'db-flye-flat',
    name: 'Dumbbell Flye',
    muscleGroup: 'CHEST',
    equipment: 'Dumbbell',
    movementSnapshot: 'Arc dumbbells wide apart and together over chest',
    formCues: [
      'Maintain a fixed, slight bend in your elbows throughout — do not press or curl',
      'Lower dumbbells in a wide arc until you feel a deep stretch across your chest',
      'Think of hugging a large barrel — arc the weight up, do not press it',
      'Stop just short of touching dumbbells at the top to keep tension on the chest'
    ],
    ytLink: 'https://youtu.be/eozdVDA78K0',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flye',
    alsoInProgram: false
  },

  {
    id: 'db-flye-incline',
    name: 'Incline Dumbbell Flye',
    muscleGroup: 'CHEST',
    equipment: 'Dumbbell',
    movementSnapshot: 'Arc dumbbells wide apart and together on incline',
    formCues: [
      'Set bench to 30–45 degrees to emphasize the upper chest during the flye',
      'Lead with your elbows on the way down — your hands follow, not the other way around',
      'The stretch at the bottom should feel controlled, not painfully deep',
      'Focus on bringing your upper arms together — squeeze the upper chest at the top'
    ],
    ytLink: 'https://youtu.be/eozdVDA78K0',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'flye',
    alsoInProgram: false
  },

  {
    id: 'db-pullover',
    name: 'Dumbbell Pullover',
    muscleGroup: 'CHEST',
    equipment: 'Dumbbell',
    movementSnapshot: 'Arc dumbbell from chest over and behind your head',
    formCues: [
      'Lie perpendicular on a bench with only your upper back supported, hips dropped low',
      'Lower the dumbbell in a slow arc behind your head until you feel a rib cage stretch',
      'Keep a very slight, fixed bend in your elbows throughout the entire movement',
      'Pull back by squeezing through your chest and rib cage, not just your arms'
    ],
    ytLink: 'https://youtu.be/eozdVDA78K0',
    ytFlagged: true,
    goldStar: true,
    similarityGroup: 'pullover',
    alsoInProgram: false
  },

  // ─── CABLE ──────────────────────────────────────────────────────────────────

  {
    id: 'cable-chest-press',
    name: 'Cable Chest Press',
    muscleGroup: 'CHEST',
    equipment: 'Cable',
    movementSnapshot: 'Press cable handles forward from chest height',
    formCues: [
      'Set pulleys to chest height and stand in a staggered stance for a stable base',
      'Keep a slight forward lean from your hips — do not over-arch your lower back',
      'Press handles out and slightly together in a controlled forward arc',
      'Squeeze at full extension where cables cross, then return slowly to feel the stretch'
    ],
    ytLink: 'https://youtu.be/LNH_lPYJnpw',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flat-press',
    alsoInProgram: false
  },

  {
    id: 'cable-crossover-mid',
    name: 'Cable Crossover (Mid)',
    muscleGroup: 'CHEST',
    equipment: 'Cable',
    movementSnapshot: 'Pull cable handles together in front of chest',
    formCues: [
      'Set both pulleys to roughly shoulder height for even stimulation across the chest',
      'Step forward so the cables pull back slightly — do not stand too close to the stack',
      'Pull handles together in a wide arc with elbows soft and slightly bent throughout',
      'Squeeze the chest at center, hold briefly, then slowly release back to the stretch'
    ],
    ytLink: 'https://youtu.be/fwN2ECQsvGg',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flye',
    alsoInProgram: true   // program id: 'flye'
  },

  {
    id: 'cable-crossover-high-low',
    name: 'High-to-Low Cable Crossover',
    muscleGroup: 'CHEST',
    equipment: 'Cable',
    movementSnapshot: 'Pull high cables down and across your body',
    formCues: [
      'Set both pulleys above head height to target the lower chest',
      'Pull handles down and across in a swooping arc — elbows stay soft throughout',
      'Keep shoulders down and back — avoid letting them shrug up toward your ears',
      'Cross hands slightly past center at the bottom to maximize the chest contraction'
    ],
    ytLink: 'https://youtu.be/fwN2ECQsvGg',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flye',
    alsoInProgram: false
  },

  {
    id: 'cable-crossover-low-high',
    name: 'Low-to-High Cable Crossover',
    muscleGroup: 'CHEST',
    equipment: 'Cable',
    movementSnapshot: 'Pull low cables up and across your upper chest',
    formCues: [
      'Set both pulleys at ankle height to shift emphasis to the upper chest',
      'Lean forward slightly from the hips and pull handles upward and across your body',
      'The motion resembles an uppercut — keep elbows soft, not locked straight',
      'Drive with the upper chest, not with momentum — go slow and feel each rep'
    ],
    ytLink: 'https://youtu.be/taI4XduLpTk',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flye',
    alsoInProgram: false
  },

  {
    id: 'cable-press-incline',
    name: 'Incline Cable Press',
    muscleGroup: 'CHEST',
    equipment: 'Cable',
    movementSnapshot: 'Press low cables upward toward upper chest',
    formCues: [
      'Set pulleys low and lean back against an incline bench to mimic the angle',
      'Press handles upward and slightly together in line with your upper chest',
      'Avoid letting the cables drift too far to the sides at the bottom of each rep',
      'Stop just short of full lockout at the top to keep constant tension on the chest'
    ],
    ytLink: 'https://youtu.be/LNH_lPYJnpw',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'incline-press',
    alsoInProgram: false
  },

  // ─── MACHINE ─────────────────────────────────────────────────────────────────

  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    muscleGroup: 'CHEST',
    equipment: 'Machine',
    movementSnapshot: 'Push machine handles forward from seated chest position',
    formCues: [
      'Adjust seat height so handles align with mid-chest, not your shoulders or neck',
      'Keep your back flat against the pad — do not let it arch away from the seat',
      'Push handles forward and hold the squeeze briefly at full extension',
      'Control the return slowly — do not let the weight stack drop back freely'
    ],
    ytLink: 'https://youtu.be/NsEbXsTwas8',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flat-press',
    alsoInProgram: false
  },

  {
    id: 'machine-press-incline',
    name: 'Incline Machine Press',
    muscleGroup: 'CHEST',
    equipment: 'Machine',
    movementSnapshot: 'Push angled machine handles up from upper chest',
    formCues: [
      'Adjust the seat so handles align with your upper chest, not your throat',
      'Press forward along the angle of the machine without locking elbows at the top',
      'Keep shoulder blades pinched back against the pad throughout the set',
      'Lower slowly to feel the upper chest stretch on every single rep'
    ],
    ytLink: 'https://youtu.be/VesHgJR14E8',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'incline-press',
    alsoInProgram: false
  },

  {
    id: 'pec-deck',
    name: 'Pec Deck / Machine Flye',
    muscleGroup: 'CHEST',
    equipment: 'Machine',
    movementSnapshot: 'Bring padded arms together in front of chest',
    formCues: [
      'Set pad height so your elbows are level with your shoulders, not above them',
      'Keep elbows bent at roughly 90 degrees — do not let your arms straighten out',
      'Squeeze the pads together at the front and hold for a full second each rep',
      'Control the return all the way back — the deep stretch phase builds the most muscle'
    ],
    ytLink: 'https://youtu.be/Z57CtFmRMxA',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'flye',
    alsoInProgram: false
  },

  {
    id: 'smith-bench-flat',
    name: 'Smith Machine Bench Press',
    muscleGroup: 'CHEST',
    equipment: 'Machine',
    movementSnapshot: 'Press fixed bar up from chest on flat bench',
    formCues: [
      'Position the bench so the bar travels directly over your mid-chest at the bottom',
      'The fixed bar path makes setup position critical — check before adding any weight',
      'Keep shoulder blades retracted and depressed throughout — do not let them round forward',
      'Use all the same cues as a barbell bench press, adjusted for a fixed vertical track'
    ],
    ytLink: 'https://youtu.be/E4G-M8Vvzps',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flat-press',
    alsoInProgram: false
  },

  {
    id: 'smith-bench-incline',
    name: 'Smith Machine Incline Press',
    muscleGroup: 'CHEST',
    equipment: 'Machine',
    movementSnapshot: 'Press fixed bar up from upper chest on incline',
    formCues: [
      'Position bench slightly forward of center so the bar lands on your upper chest',
      'The fixed track locks you in — do a dry run without weight to check alignment',
      'Lower to the upper chest and press back along the fixed track to the top',
      'Use a slightly narrower grip than flat bench to prevent excessive elbow flare'
    ],
    ytLink: 'https://youtu.be/DbFgADa2PL8',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'incline-press',
    alsoInProgram: false
  },

  // ─── BODYWEIGHT ──────────────────────────────────────────────────────────────

  {
    id: 'push-up',
    name: 'Push-Up',
    muscleGroup: 'CHEST',
    equipment: 'Bodyweight',
    movementSnapshot: 'Lower and press your body from the floor',
    formCues: [
      'Place hands just wider than shoulder-width with fingers pointing forward or slightly out',
      'Keep your body in a straight line from head to heels — no sagging hips or raised butt',
      'Lower until your chest is close to the floor, not just until your elbows bend',
      'Grip the ground and push it away from you to fully engage your chest and shoulders'
    ],
    ytLink: 'https://youtu.be/IODxDxX7oi4',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'bodyweight-push',
    alsoInProgram: false
  },

  {
    id: 'push-up-incline',
    name: 'Incline Push-Up',
    muscleGroup: 'CHEST',
    equipment: 'Bodyweight',
    movementSnapshot: 'Push-up with hands elevated on a surface',
    formCues: [
      'Elevate hands on a bench or step — higher surface means easier, lower means harder',
      'Maintain the same straight-body alignment as a standard push-up throughout',
      'The inclined angle shifts emphasis toward the lower chest compared to flat push-ups',
      'Great starting point for building strength before progressing to flat push-ups'
    ],
    ytLink: 'https://youtu.be/IODxDxX7oi4',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'bodyweight-push',
    alsoInProgram: false
  },

  {
    id: 'push-up-decline',
    name: 'Decline Push-Up',
    muscleGroup: 'CHEST',
    equipment: 'Bodyweight',
    movementSnapshot: 'Push-up with feet elevated to hit upper chest',
    formCues: [
      'Elevate your feet on a bench or step to shift more load to the upper chest',
      'The higher your feet, the more upper chest and front shoulder get recruited',
      'Brace your core hard — elevated feet increase the demand on your abs to stay rigid',
      'Lower chest toward the floor between your hands, then press back up with control'
    ],
    ytLink: 'https://youtu.be/IODxDxX7oi4',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'bodyweight-push',
    alsoInProgram: false
  },

  {
    id: 'push-up-wide',
    name: 'Wide-Grip Push-Up',
    muscleGroup: 'CHEST',
    equipment: 'Bodyweight',
    movementSnapshot: 'Push-up with hands placed wider than shoulders',
    formCues: [
      'Place hands wider than standard — roughly 1.5 times shoulder width apart',
      'The wider stance increases chest stretch at the bottom and reduces tricep involvement',
      'Lower slowly to get the full pec stretch before pressing back up',
      'Keep shoulder blades slightly pulled back to avoid collapsing at the shoulders'
    ],
    ytLink: 'https://youtu.be/IODxDxX7oi4',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'bodyweight-push',
    alsoInProgram: false
  },

  {
    id: 'chest-dip',
    name: 'Chest Dip',
    muscleGroup: 'CHEST',
    equipment: 'Bodyweight',
    movementSnapshot: 'Lower and press your body between parallel bars',
    formCues: [
      'Lean forward 30–45 degrees at the top — staying upright shifts the work to triceps',
      'Lower until elbows reach roughly 90 degrees or you feel a stretch across your chest',
      'Cross your feet and bend your knees slightly to tilt your hips back into the lean',
      'Press back up by squeezing your chest together, not just by straightening your arms'
    ],
    ytLink: 'https://youtu.be/2z8JmcrW-As',
    ytFlagged: false,
    goldStar: true,
    similarityGroup: 'dip',
    alsoInProgram: false
  },

  // ─── RESISTANCE BAND ─────────────────────────────────────────────────────────

  {
    id: 'band-chest-press',
    name: 'Resistance Band Chest Press',
    muscleGroup: 'CHEST',
    equipment: 'Resistance Band',
    movementSnapshot: 'Press band handles forward from chest height standing',
    formCues: [
      'Anchor the band behind you at chest height and hold one end in each hand',
      'Stand in a split stance and lean slightly forward for a stable pressing base',
      'Press outward and forward — band gets harder as you extend, so squeeze at lockout',
      'Control the return slowly as the band pulls your hands back to the start position'
    ],
    ytLink: 'https://youtu.be/8lDC4Ri9zAQ',
    ytFlagged: true,
    goldStar: true,
    similarityGroup: 'band-press',
    alsoInProgram: false
  },

  {
    id: 'band-flye',
    name: 'Resistance Band Flye',
    muscleGroup: 'CHEST',
    equipment: 'Resistance Band',
    movementSnapshot: 'Arc band handles together in front of your chest',
    formCues: [
      'Anchor band behind you and hold one end in each hand with arms spread wide',
      'Bring hands together in front of your chest in a slow, controlled hugging arc',
      'Keep elbows softly bent throughout — this is a flye, not a press',
      'The peak resistance at the squeeze point makes full contraction especially important'
    ],
    ytLink: 'https://youtu.be/8lDC4Ri9zAQ',
    ytFlagged: false,
    goldStar: false,
    similarityGroup: 'flye',
    alsoInProgram: false
  },

  {
    id: 'band-push-up',
    name: 'Band Push-Up',
    muscleGroup: 'CHEST',
    equipment: 'Resistance Band',
    movementSnapshot: 'Push-up with band adding resistance at the top',
    formCues: [
      'Drape the band across your upper back and pin each end under your palms on the floor',
      'The band adds the most resistance at the top of the rep, making lockout hardest',
      'Maintain the same straight-body alignment as a standard push-up throughout',
      'Great for progressive overload when you can do 20+ bodyweight push-ups easily'
    ],
    ytLink: 'https://youtu.be/IODxDxX7oi4',
    ytFlagged: true,
    goldStar: false,
    similarityGroup: 'bodyweight-push',
    alsoInProgram: false
  }

];

/**
 * Similarity groups reference — movement patterns and their gold star rationale:
 *
 *  flat-press      → Barbell Bench Press ⭐  (most research, best load potential, horizontal pressing)
 *  incline-press   → Incline DB Press ⭐     (better ROM and shoulder tracking vs barbell incline)
 *  decline-press   → BB Decline Press ⭐     (most stable, highest load for lower chest emphasis)
 *  flye            → Pec Deck ⭐             (constant tension at stretch + contracted position,
 *                                             supported by hypertrophy research for isolation)
 *  bodyweight-push → Push-Up ⭐              (most complete bodyweight chest stimulus, scalable)
 *  dip             → Chest Dip ⭐            (unique compound movement, high pec minor + lower chest)
 *  pullover        → DB Pullover ⭐           (unique rib-cage stretch pattern, no other equivalent)
 *  floor-press     → BB Floor Press ⭐        (unique ROM-limited press, no direct equivalent)
 *  band-press      → Band Chest Press ⭐      (only resistance-band press variation)
 */

// Export for use in the main app bundle
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHEST_EXERCISE_LIBRARY };
}
