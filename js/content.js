// PCOSphere · © 2026 Aakanksha Mohanty. All rights reserved. See LICENSE.
// PCOSphere content: support areas, themes, check-in options, the idea library and approved facts.
// Wording rules: no food guilt, no "burning off", no diagnosis, no cycle-phase predictions.

export const AREAS = [
  { id: "cycle", label: "Cycle & symptoms", sub: "Cramps, bloating, period days, friendly explainers", color: "var(--rest-ink)" },
  { id: "food", label: "Food & cravings", sub: "Satisfying, insulin-resistance-friendly ideas", color: "var(--nourish-ink)" },
  { id: "mood", label: "Mood & mind", sub: "Calm resets for wired, low or lonely moments", color: "var(--calm-ink)" },
  { id: "movement", label: "Movement & strength", sub: "Short, doable movement. Two minutes counts", color: "var(--move-ink)" },
  { id: "person", label: "My person", sub: "Let someone close know how to show up for you", color: "var(--accent)" },
];

export const THEMES = [
  { id: "cottage", label: "Fairy cottage", sub: "Calm and neutral", colors: ["#F6F1E7", "#5F7F63", "#E9C9B0", "#D6CDE6"], meta: "#F6F1E7" },
  { id: "gothic", label: "Midnight gothic", sub: "Dark, plum, moonlit", colors: ["#14101B", "#C9A0DC", "#E8DFC7", "#3A2948"], meta: "#14101B" },
  { id: "blush", label: "Blush", sub: "Soft pink and white", colors: ["#FFF5F6", "#C2577A", "#FADCE4", "#EFA9BC"], meta: "#FFF5F6" },
  { id: "pop", label: "Color pop", sub: "Bright and playful", colors: ["#FFF9EC", "#FF5A36", "#FFD23F", "#57C4FF"], meta: "#FFF9EC" },
];

export const FEELINGS = [
  { id: "low-energy", label: "Running low" },
  { id: "craving-sweet", label: "Craving sweet" },
  { id: "craving-salty", label: "Craving salty" },
  { id: "skipped-meal", label: "Haven't eaten properly" },
  { id: "crampy", label: "Crampy or achy" },
  { id: "bloated", label: "Bloated" },
  { id: "on-period", label: "On my period" },
  { id: "anxious", label: "Wired or anxious" },
  { id: "low-mood", label: "Low or flat" },
  { id: "lonely", label: "A bit lonely" },
  { id: "restless", label: "Restless" },
  { id: "okay", label: "Actually, pretty okay" },
];

export const TIMES = [
  { id: 2, label: "2 min" },
  { id: 10, label: "10 min" },
  { id: 20, label: "20+ min" },
];

export const PLACES = [
  { id: "home", label: "At home" },
  { id: "desk", label: "At a desk" },
  { id: "out", label: "Out and about" },
];

export const CATEGORIES = {
  nourish: { label: "Nourish", area: "food" },
  move: { label: "Move", area: "movement" },
  calm: { label: "Calm", area: "mood" },
  rest: { label: "Rest", area: "mood" },
};

// kind: "enjoy" (take your time), "timer" (guided countdown), "breath" (breathing circle)
export const IDEAS = [
  // ---------- Nourish ----------
  { id: "chana-dates", category: "nourish", title: "Roasted chana with a couple of dates", minutes: 2, places: ["home", "desk", "out"], tags: ["craving-sweet", "low-energy"],
    why: "You get the sweetness you're after, plus protein and fibre that many people find makes it more satisfying.",
    steps: ["Grab a small handful of roasted chana", "Add two dates for natural sweetness", "Eat it sitting down, not mid-scroll, if you can"], kind: "enjoy" },
  { id: "dahi-fruit", category: "nourish", title: "A bowl of dahi with fruit", minutes: 2, places: ["home"], tags: ["craving-sweet", "bloated", "low-energy"],
    why: "Cool, a little sweet, and filling. Good when you want something but not something heavy.",
    steps: ["Scoop some dahi into a bowl", "Chop in whatever fruit is around", "Optional: a sprinkle of seeds or nuts on top"], kind: "enjoy" },
  { id: "masala-makhana", category: "nourish", title: "Masala makhana", minutes: 5, places: ["home", "desk", "out"], tags: ["craving-salty", "anxious"],
    why: "Crunchy and salty scratches the itch, and it's easy to enjoy a proper bowlful.",
    steps: ["Dry-roast a bowlful of plain makhana in a pan for 3–4 minutes", "Toss with chaat masala or a pinch of salt and pepper", "Pair it with water or unsweetened chaas"], kind: "enjoy" },
  { id: "banana-pb", category: "nourish", title: "Banana with peanut butter", minutes: 2, places: ["home", "desk"], tags: ["low-energy", "craving-sweet", "skipped-meal"],
    why: "Quick, sweet, and the peanut butter adds staying power.",
    steps: ["Slice a banana", "Add a spoon of peanut butter (one with no added sugar)", "Take five minutes away from the screen to eat it"], kind: "enjoy" },
  { id: "sprout-chaat", category: "nourish", title: "Quick sprouts or chana chaat", minutes: 10, places: ["home"], tags: ["craving-salty", "skipped-meal", "low-energy"],
    why: "Tangy, salty and filling: a snack that eats like a small meal.",
    steps: ["Take a cup of sprouts or boiled chana", "Add onion, tomato, lemon and chaat masala", "Top with a few roasted peanuts for crunch"], kind: "enjoy" },
  { id: "easy-meal", category: "nourish", title: "A real meal, made easy", minutes: 20, places: ["home", "out"], tags: ["skipped-meal", "low-energy", "low-mood"],
    why: "Sometimes a craving is just hunger asking nicely. A proper plate can change the whole afternoon.",
    steps: ["Pick the easiest option nearby: thali, egg bhurji, besan chilla, dal-chawal", "Try to have some protein on the plate", "No other rules. Eat and enjoy it"], kind: "enjoy" },
  { id: "protein-add", category: "nourish", title: "Add one protein to your next meal", minutes: 2, places: ["home", "desk", "out"], tags: ["skipped-meal", "okay", "craving-sweet"],
    why: "A tiny plan, not a diet. Protein on the plate helps many people feel full for longer.",
    steps: ["Think of your next meal", "Pick one: paneer, eggs, dal, curd, tofu, chicken, chana", "That's it. Decision made"], kind: "enjoy" },
  { id: "warm-drink", category: "nourish", title: "Something warm to sip", minutes: 10, places: ["home", "desk", "out"], tags: ["crampy", "bloated", "on-period", "anxious"],
    why: "Lots of people find a warm drink comforting when their belly feels off. It's also a nice excuse to pause.",
    steps: ["Make ginger or jeera water, or a cup of unsweetened chai", "Hold the cup and let your shoulders drop", "Sip slowly. A small snack alongside is welcome"], kind: "enjoy" },
  { id: "choc-almonds", category: "nourish", title: "Dark chocolate (70%+) and a few almonds", minutes: 2, places: ["desk", "home", "out"], tags: ["craving-sweet", "low-mood", "on-period"],
    why: "Chocolate is allowed here. A few almonds alongside just make the moment last a bit longer.",
    steps: ["Break off a square or two of 70%+ dark chocolate", "Grab five or six almonds", "Let the chocolate melt instead of rushing it"], kind: "enjoy" },
  { id: "prep-snack", category: "nourish", title: "Set up an easy snack for later", minutes: 10, places: ["home"], tags: ["okay"],
    why: "Good days are a great time to make future-you's tired evening a bit easier.",
    steps: ["Portion unsalted nuts, roasted chana or makhana into a box", "Or wash some fruit and leave it where you'll see it", "Put it somewhere obvious"], kind: "enjoy" },

  // ---------- Move ----------
  { id: "cat-cow", category: "move", title: "Cat-cow and child's pose", minutes: 3, places: ["home"], tags: ["crampy", "on-period", "bloated", "low-energy"],
    why: "Slow, gentle movement through your back and belly can feel soothing when you're achy.",
    steps: ["On hands and knees, round your back up like a cat", "Then let your belly drop and look up softly", "Repeat slowly 8 times, then rest in child's pose"], kind: "timer" },
  { id: "stroll", category: "move", title: "A ten-minute stroll, no goal", minutes: 10, places: ["out", "home", "desk"], tags: ["restless", "low-mood", "bloated", "anxious", "okay", "lonely"],
    why: "Not a workout. Just a change of scene, some daylight, and your legs doing their thing.",
    steps: ["Head outside, or loop a corridor if that's easier", "Walk at whatever pace feels nice", "Notice three things you'd usually walk past"], kind: "timer" },
  { id: "desk-unwind", category: "move", title: "Desk unwind", minutes: 2, places: ["desk", "home"], tags: ["restless", "anxious", "low-energy"],
    why: "Two minutes to un-hunch. Your neck and shoulders will thank you.",
    steps: ["Roll your shoulders back five times", "Gently drop each ear toward its shoulder", "Twist to each side in your chair, holding for three breaths"], kind: "timer" },
  { id: "strength-snack", category: "move", title: "A five-minute strength snack", minutes: 5, places: ["home"], tags: ["restless", "okay", "low-mood", "low-energy"],
    why: "A small dose of strength work. Muscles love being used, a little at a time.",
    steps: ["10 slow squats (a chair behind you is fine)", "8 wall push-ups", "10 glute bridges, then repeat once if you feel like it"], kind: "timer" },
  { id: "dance-break", category: "move", title: "One-song dance break", minutes: 4, places: ["home"], tags: ["low-mood", "restless", "okay", "lonely"],
    why: "One song, no choreography, nobody watching. It's hard to stay flat while dancing badly.",
    steps: ["Pick a song you can't sit still to", "Volume up, or earphones in", "Move however you like until it ends"], kind: "timer" },
  { id: "legs-wall", category: "move", title: "Legs up the wall", minutes: 5, places: ["home"], tags: ["crampy", "on-period", "low-energy", "anxious"],
    why: "A restful pose that asks almost nothing of you. Good for heavy, tired days.",
    steps: ["Sit sideways next to a wall, then swing your legs up it", "Let your arms rest wherever is comfy", "Breathe, and come down slowly when the timer ends"], kind: "timer" },
  { id: "slow-walk", category: "move", title: "A slow 20-minute walk", minutes: 20, places: ["out", "home"], tags: ["bloated", "restless", "low-mood", "okay"],
    why: "Longer, but still easy. Many people find a gentle walk, especially after eating, settles both body and mind.",
    steps: ["Pick a route, a podcast or someone to call", "Keep it comfortable: you should be able to chat", "Turn back whenever you want. 20 minutes is a ceiling, not a target"], kind: "timer" },

  // ---------- Calm ----------
  { id: "breathing", category: "calm", title: "One minute of slow breathing", minutes: 2, places: ["home", "desk", "out"], tags: ["anxious", "restless", "crampy", "low-mood"],
    why: "Breathing out a little longer than you breathe in is a simple way to help your body downshift.",
    steps: ["Breathe in as the circle grows", "Breathe out slowly as it shrinks", "Just follow along. There's nothing to get right"], kind: "breath" },
  { id: "grounding", category: "calm", title: "5-4-3-2-1 grounding", minutes: 2, places: ["home", "desk", "out"], tags: ["anxious", "low-mood"],
    why: "When your head is racing, naming what's around you pulls your attention back to right now.",
    steps: ["Name 5 things you can see", "4 you can feel, 3 you can hear", "2 you can smell, 1 you can taste"], kind: "timer" },
  { id: "heat-rest", category: "calm", title: "Hot water bottle and a lie down", minutes: 10, places: ["home"], tags: ["crampy", "on-period", "bloated"],
    why: "Warmth on your belly or lower back is a time-tested comfort for cramps.",
    steps: ["Fill a hot water bottle (warm, not scalding) or use a heat pad", "Lie down with it where it aches", "Put on something easy to listen to and let yourself be still"], kind: "timer" },
  { id: "text-someone", category: "calm", title: "Text someone you like", minutes: 2, places: ["home", "desk", "out"], tags: ["lonely", "low-mood", "anxious"],
    why: "A tiny bit of connection goes a long way on a flat day. No deep chat needed.",
    steps: ["Think of someone who makes you smile", "Send a meme, a voice note, or just 'thinking of you'", "That's it. You don't have to wait for a reply"], kind: "enjoy" },
  { id: "brain-dump", category: "calm", title: "Two-minute brain dump", minutes: 3, places: ["desk", "home"], tags: ["anxious", "restless"],
    why: "Getting the swirl out of your head and onto paper makes it smaller.",
    steps: ["Open a notes app or grab paper", "Write everything on your mind, unfiltered, for 2 minutes", "Circle one thing to do next. Ignore the rest for now"], kind: "timer" },
  { id: "kind-voice", category: "calm", title: "Say it like a friend would", minutes: 2, places: ["home", "desk", "out"], tags: ["low-mood", "lonely", "anxious"],
    why: "We're often kinder to friends than to ourselves. Borrow that voice for a minute.",
    steps: ["Imagine a close friend feeling exactly how you feel", "Write down one thing you'd say to her", "Read it back, as if it's for you. Because it is"], kind: "enjoy" },

  // ---------- Rest ----------
  { id: "power-rest", category: "rest", title: "A 20-minute eyes-closed rest", minutes: 20, places: ["home"], tags: ["low-energy", "on-period", "low-mood"],
    why: "Running low is information, not a failing. A short rest is a legit option.",
    steps: ["Set an alarm for 20 minutes", "Lie down or recline, phone face-down", "Sleep or don't. Resting your eyes counts too"], kind: "timer" },
  { id: "water-daylight", category: "rest", title: "A glass of water and a minute of daylight", minutes: 2, places: ["home", "desk", "out"], tags: ["low-energy", "low-mood", "okay"],
    why: "A tiny reset: something to drink and a bit of light and fresh air.",
    steps: ["Fill a glass and drink some of it", "Step to a window, balcony or doorway", "Look at something far away for a minute"], kind: "timer" },
];

// "Did you know?" facts, approved by the owner. Areas decide who sees which fact first.
export const FACTS = [
  { id: "not-cysts", areas: ["cycle"], text: "It's not really about cysts. The \"cysts\" seen on scans are actually follicles, small sacs where eggs develop.",
    source: "NHS", url: "https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/" },
  { id: "pmos", areas: ["all"], text: "PCOS has a new name: PMOS, Polyendocrine Metabolic Ovarian Syndrome. It was chosen in 2026 because the condition affects hormones, metabolism, skin and mood, not just the ovaries. Both names are used during a 3-year changeover.",
    source: "The Lancet consensus, via ESHRE", url: "https://www.focusonreproduction.eu/news-and-activities/pcos-is-renamed-following-unprecedented-international-consensus/" },
  { id: "not-alone", areas: ["all"], text: "You're far from alone: PCOS affects an estimated 10–13% of women of reproductive age, and up to 70% of those with it don't know they have it.",
    source: "WHO", url: "https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome" },
  { id: "metabolic", areas: ["food"], text: "Insulin resistance is really common with PCOS. It's a big part of why PCOS is now understood as a metabolic condition, not just an ovarian one.",
    source: "The Lancet consensus, via ESHRE", url: "https://www.focusonreproduction.eu/news-and-activities/pcos-is-renamed-following-unprecedented-international-consensus/" },
  { id: "no-diet", areas: ["food"], text: "There's no single \"PCOS diet\". The international guideline found no one way of eating works better than others, and restrictive diets aren't recommended.",
    source: "2023 International PCOS Guideline, via HealthEd", url: "https://www.healthed.com.au/clinical_articles/managing-pcos/" },
  { id: "small-moves", areas: ["movement"], text: "Small bits of movement count. Moving as much as you can, as often as you can, even in ~10-minute bouts, is the spirit of the advice.",
    source: "2023 International PCOS Guideline, via HealthEd", url: "https://www.healthed.com.au/clinical_articles/managing-pcos/" },
  { id: "mood", areas: ["mood"], text: "If your mood feels heavy, it's not \"just you\". Anxiety and low mood are more common with PCOS, and the guideline recommends everyone with PCOS be checked for them.",
    source: "2023 International PCOS Guideline, MJA summary", url: "https://www.mja.com.au/journal/2024/221/7/summary-2023-international-evidence-based-guideline-assessment-and-management" },
  { id: "no-shame", areas: ["all"], text: "Health, not weight shame. The guideline calls for care that focuses on wellbeing and quality of life, and is aware of weight stigma.",
    source: "2023 International PCOS Guideline, MJA summary", url: "https://www.mja.com.au/journal/2024/221/7/summary-2023-international-evidence-based-guideline-assessment-and-management" },
  { id: "different", areas: ["cycle"], text: "PCOS looks different for everyone. Signs often appear in the late teens or early 20s (irregular periods, acne, hair changes), and many people have few or no obvious symptoms.",
    source: "NHS", url: "https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/" },
];

// Red-flag phrases. If we see these, we show real help before anything else.
const SAFETY_PATTERNS = [
  /suicid/i, /kill (myself|me)/i, /end (it all|my life)/i, /want to die/i, /self[- ]?harm/i, /hurt(ing)? myself/i,
  /(don'?t|do not) want to (be here|live|exist)/i, /no (reason|point) (to|in) (live|living)/i, /better off without me/i,
  /faint(ed|ing)?/i, /passed out/i, /chest pain/i, /can'?t breathe/i,
  /soak(ing|ed)? (through|a pad)/i, /(very |really )?heavy bleeding/i, /bleeding (a lot|heavily|so much)/i,
];
export function needsCare(text) {
  return !!text && SAFETY_PATTERNS.some((re) => re.test(text));
}

// Score ideas against a check-in. Simple and explainable on purpose.
export function rankIdeas(checkin, profile, history) {
  const helped = new Set(history.filter((h) => h.outcome === "better").map((h) => h.ideaId));
  const recent = new Set(history.slice(-3).map((h) => h.ideaId));
  const areas = new Set(profile.areas);
  return IDEAS.map((idea) => {
    let score = 0;
    for (const f of checkin.feelings) if (idea.tags.includes(f)) score += 3;
    score += idea.minutes <= checkin.time ? 2 : -4;
    score += idea.places.includes(checkin.place) ? 2 : -5;
    if (areas.has(CATEGORIES[idea.category].area)) score += 2;
    else if (areas.size) score -= 2;
    if (helped.has(idea.id)) score += 2;
    if (recent.has(idea.id)) score -= 2;
    if (checkin.time >= 10 && idea.minutes >= 5) score += 1;
    return { idea, score };
  })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.idea);
}

// One pick plus alternatives from different categories, so "something else" really is different.
export function pickIdeas(checkin, profile, history) {
  const ranked = rankIdeas(checkin, profile, history);
  const main = ranked[0];
  const alts = [];
  const seen = new Set([main.category]);
  for (const idea of ranked.slice(1)) {
    if (!seen.has(idea.category)) { alts.push(idea); seen.add(idea.category); }
    if (alts.length === 3) break;
  }
  for (const idea of ranked.slice(1)) {
    if (alts.length >= 3) break;
    if (!alts.includes(idea)) alts.push(idea);
  }
  return [main, ...alts];
}

export function reflectionFor(checkin, name) {
  const has = (x) => checkin.feelings.includes(x);
  const hi = name ? `${name}, ` : "";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let line;
  if (has("okay") && checkin.feelings.length === 1) line = "love that today feels okay. Let's use it for something nice.";
  else if (has("crampy") || has("on-period")) line = "period days can take a lot out of you. Let's go gentle.";
  else if (has("lonely")) line = "feeling a bit alone is hard. I'm glad you checked in.";
  else if (has("craving-sweet") && has("low-energy")) line = "tired and wanting something sweet is a really common combo. Let's make it satisfying.";
  else if (has("anxious")) line = "sounds like your mind is running fast. Let's give it something small and steady.";
  else if (has("low-mood")) line = "flat days happen. No fixing needed, just one kind thing.";
  else if (has("skipped-meal")) line = "sounds like your body might just be asking for fuel.";
  else if (has("craving-sweet") || has("craving-salty")) line = "cravings are information, not a failing. Let's find something that actually hits the spot.";
  else if (has("restless")) line = "that restless energy wants somewhere to go.";
  else if (has("low-energy")) line = "running low is okay. Let's work with the energy you have.";
  else if (has("bloated")) line = "bloating is uncomfortable. Let's try something easy on you.";
  else line = "thanks for checking in. Here's one small thing that might help.";
  return hi ? hi + line : cap(line);
}

export const FOLLOWUPS = {
  better: ["Lovely. I'll remember this one helped.", "That's a win, however small. Noted for next time.", "So glad. I'll keep this one handy for you."],
  same: ["That's okay. Not everything shifts things, and trying still counts.", "Thanks for telling me. It helps me suggest better next time."],
  skipped: ["Totally fine. Some moments aren't the moment.", "No problem at all. Life happens. I'm here whenever you want to try again."],
};
