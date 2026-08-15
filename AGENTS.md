# Hackathon agent brief

Read this before writing code. This repo is the **only** project. Do not start a second idea, restyle an old repo, or add a platform around a missing demo.

Canonical event guide: [Hacker Resource Guide](https://huntertcarver.notion.site/Cursor-Austin-Grok-4-6-Hackathon-Hacker-Resource-Guide-3bc071360df881c98dc0c7f1b08c1506)

## Clock (CT, Saturday Aug 15, 2026)

| When | What |
| --- | --- |
| **Now** | ~12:15 PM. Lunch is 12:30. Keep building. |
| **2:40 PM** | Team submit target. Start the form then. Late = not judged. |
| **3:00 PM** | Form closes. No exceptions. |
| 3:00–4:00 | Judging (what we submitted, not later work) |
| 4:30 | Winners. Only top 3 present. |

Remaining build window is about **2 hours 25 minutes** to the 2:40 form start. Budget:

1. **Until ~1:45** — one vertical slice that runs and can be demoed.
2. **1:45–2:20** — freeze features, record the ≤3 min video, fix only demo-breakers.
3. **2:20–2:40** — fill the form and submit.

Do not start new features after 1:45 unless the demo does not run.

## Our project (source of truth)

Two-person team: **Brian + Bo**. Update this block when the idea is locked. Agents must follow it and must **not** invent a different product.

- **Path** (pick one): Cool factor / Business use case / Agentic orchestration
- **Project name:**
- **One-liner:**
- **What it does:**
- **Who it is for / Monday-morning use:**
- **How Grok 4.6 is load-bearing in what we ship:**
- **Demo script (30–60s happy path):**

If this block is still empty, ask Brian or Bo for the idea before generating a product. Scaffolding-only is fine; a surprise app is not.

## What judges score (100)

Working systems, not decks or a thin API wrapper.

| Score | Points | Bar |
| --- | ---: | --- |
| It works | 40 | It runs. Demo the happy path without excuses. |
| Taste | 30 | Something we’d show friends. Clear UI, not clutter. |
| Nails a business use case | 30 | An insightful real problem. Someone would use this Monday. |

Recommended paths are **not** separate prize lanes. One 1st / 2nd / 3rd for the room.

- **Cool factor** — people want to show it. Taste, a new interface, a braver bet. Still has to work.
- **Business use case** — fix a real workflow (inbox, CRM, calendar, research, ops, personal life).
- **Agentic orchestration** — reasons, plans, and takes action on Grok 4.6.

## Non-negotiables

- **Built today.** Ideas, designs, and accounts are fine. A finished repo we restyle is not. Open source is fine if it was public before today.
- **Cursor** is how we build.
- **Grok 4.6** has to be used in/for what we ship (in Cursor and/or the API) and must be **load-bearing**. Mentioning it is not enough. A wrapper that only forwards a prompt is not enough.
- One submission per team. We cannot be on two teams.
- Do not post the venue address.

## Agent rules (stay on the product)

- Implement the **Our project** block only. No extra personas, dashboards, auth walls, or “nice to have” surfaces unless they are required for the demo script.
- Prefer a **narrow working demo** over architecture, refactors, or a perfect stack.
- No required backend. Local, Supabase, or our own APIs are all fine. Pick the fastest path that still runs.
- Grok 4.6 should do real work in the demo (plan, extract, generate, act). Do not fake the model call in the recorded path.
- If a change does not appear in the demo video, skip it.
- Keep the UI tasteful and sparse. One obvious primary action.
- Do not spend time on slide decks. Only top 3 present.
- When blocked, cut scope. Ship the happy path.

## Submit checklist (one form per team)

Form is linked from the [resource guide](https://huntertcarver.notion.site/Cursor-Austin-Grok-4-6-Hackathon-Hacker-Resource-Guide-3bc071360df881c98dc0c7f1b08c1506). Need:

- [ ] Team name + every teammate’s name and Luma email
- [ ] Recommended path
- [ ] Project name + one-liner
- [ ] What it does (short paragraph)
- [ ] Demo video, **3 minutes max**, public host (YouTube unlisted, Drive, etc.). Clarity over volume. Review audio.
- [ ] How we used Cursor and Grok 4.6
- [ ] Optional: this GitHub repo and a live URL

Start the video before the form. Can keep building after submit; judging is on what we submitted.

## Links

- Event: [Luma](https://luma.com/cursor-austin-grok-hack-001)
- Guide (schedule, submit, scorecard, Discord): [Notion](https://huntertcarver.notion.site/Cursor-Austin-Grok-4-6-Hackathon-Hacker-Resource-Guide-3bc071360df881c98dc0c7f1b08c1506)
- Cursor docs: https://cursor.com/docs
- Cursor cookbook: https://cursor.com/docs
- Grok 4.6 in Cursor: https://cursor.com/blog/grok-4-6 · https://cursor.com/docs/models/grok-4-6
- xAI docs: https://docs.x.ai

Questions go to Discord first (invite is on the guide / slides), then a staff shirt / radio.
