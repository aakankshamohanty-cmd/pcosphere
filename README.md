# PCOSphere

**A warm, low-pressure companion for everyday life with PCOS, with support for the people closest to you.**

🔗 **Live app:** https://pcosphere.vercel.app
👀 **Try both sides, no sign-up:** https://pcosphere.vercel.app/demo (Riya & her partner) · https://pcosphere.vercel.app/demo?family (Riya & her mum, supporting each other)

---

## Why I built it

Every woman knows the days when her hormones are acting up. **With PCOS, those days are a regular part of life.** Cravings, tiredness that makes it hard to move, and mood swings can all be part of it, and low mood and anxiety are more common with PCOS. None of that is a lack of willpower. But it can turn into a vicious cycle, and needing a little support to get out of it is nothing to be ashamed of.

PCOS affects about **1 in 10 women**, and **up to 70% don't know they have it** ([WHO](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome)). We've come a long way from the old days of staying silent about this. And still, so many of us can't openly say what we're going through, or ask for help, even from the people closest to us.

**PCOSphere is meant to be a supportive hand for life with PCOS.** It doesn't judge you for a craving, a lazy day or a mood swing. It suggests one small, realistic next step. And sometimes it helps say what we can't quite say out loud, by gently nudging the people who love us to ask.

## Who it's for

Women with PCOS of any age or life goal. Each person chooses what she wants support with: cycle & symptoms, food & cravings, mood & mind, movement & strength, and her person.

## What it does

It starts with a simple question: *how's today going?*

- **Quick check-in:** tap how you feel, how much time you have and where you are. AI tailors **one** small next step: a satisfying snack, a 3-minute stretch, a calming reset, or permission to rest. Then a kind follow-up ("How do you feel now?"), and it remembers what helped.
- **Talk to PCOSphere:** a chat to vent, ask PCOS questions in plain language, or think something through. It can drop an idea card straight into the conversation.
- **A different tool for each area:**
  - 🍲 **Craving kitchen:** sweet / savoury / tangy / crunchy / warm → 3 quick recipes, using what's at home
  - 🧠 **Calm corner:** breathing, grounding, brain dump, a listening chat, guided videos, and real help (Tele-MANAS 14416, 112)
  - 💪 **Move menu:** energy + time + place → a short routine with how-to videos
  - 🌸 **Symptom helper:** plain-language info, "see a doctor if", and questions to ask your doctor
- **Support for two:** she can link up to 2 trusted people (partner, friend, family). After a check-in she can send them a gentle, practical idea, **now**, **20–60 minutes later** so it feels natural, or **keep it private**. The hint never says she asked: *"Today could be a nice day to ask Riya how she's really doing, and just listen."* Their lock screen only says *"A little idea for today 🌸"*. **Support goes both ways:** a mum and daughter, or two sisters, can each use PCOSphere for themselves *and* be each other's person on the same account.
- **Make it yours:** 4 themes (Fairy cottage, Midnight gothic, Blush, Color pop), and it installs to the Home Screen like an app.

## What makes it different

1. **One step, not a dashboard.** Low effort in, warmth out.
2. **Designed for "I want them to ask me".** Subtle, not secret: both people agree up front that hints are inspired by what she shares, but individual hints never say she asked.
3. **Careful by design.** No calorie counting, no "cheat" foods, no "burning it off", no guessing feelings from cycle phase, no diagnosis. Worrying messages surface real helplines first.

## Privacy

- Check-ins and chats stay **on her phone**. Her person never sees them.
- The server stores only what linking needs, plus the hints she chooses to send.
- To write replies, messages are sent to Google Gemini (or Groq as a backup); this is stated clearly in the app.
- Either person can unlink anytime, and pending hints are cancelled.

## How it's built (all free tiers)

| Part | Tool |
|---|---|
| App | Plain HTML, CSS and JavaScript, installable as a PWA |
| Hosting + server functions | Vercel |
| AI | Google Gemini 3.1 Flash-Lite, with Groq (gpt-oss-120b) as automatic backup, and a built-in idea library if both are down |
| Sign-in, database, push notifications | Firebase (Google sign-in, Firestore, Cloud Messaging) |
| Delayed nudges | cron-job.org pings `/api/deliver` every minute |

**Safety in the code:** every AI answer is validated before it's shown; health information in the Symptom helper is hand-written (not generated); the database is locked to the server; secrets live only in Vercel environment variables.

## How AI helped

I built PCOSphere with **Claude (Claude Code)** as my coding partner. The idea comes from lived experience, and I made the product decisions: the problem, the audience, the "subtle not secret" partner feature, the support areas, the themes, and what the app should never say. Claude helped me turn them into a plan, wrote and tested the code, explained each technical choice in plain language, and helped me debug real-world issues (like keeping iPhone Home Screen sign-ins working).

## Known limitations & what's next

- On iPhone, notifications need the app added to the Home Screen (an Apple rule for web apps). The first Google sign-in there can occasionally need a second tap.
- AI runs on free tiers with daily limits (about 50 chat messages per person per day). If AI is unavailable, the app falls back to its own idea library.
- **Next:** more than 2 support people, a premium tier with higher chat limits, native iOS/Android apps, more languages (Hindi first), and optional doctor-visit summaries.

---

*PCOSphere shares general wellness ideas, not medical advice.*

**© 2026 Aakanksha Mohanty. All rights reserved.** This code is shared for viewing and evaluation only; see [LICENSE](LICENSE). No reuse without written permission.
