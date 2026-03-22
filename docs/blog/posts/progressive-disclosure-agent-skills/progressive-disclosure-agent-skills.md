---
authors:
  - rv
categories:
  - Context Engineering
  - AI Tooling
comments: true
date: 2026-02-23
description: A phased pattern for skill instructions that avoids context bloat. Keep SKILL.md small, load presets and templates only when needed.
draft: false
slug: progressive-disclosure-agent-skills
tags:
  - progressive disclosure
  - agent skills
  - skill design
  - prompt architecture
  - context windows
  - claude code
---

# Progressive Disclosure for Agent Skills: How to Stop Your SKILL.md Becoming Prompt Soup

**TL;DR:** If your `SKILL.md` keeps growing, your skill will get worse, not better. Progressive disclosure fixes this: keep one small orchestrator file, then load phase-specific instructions only when the workflow reaches that phase. You get less context bloat, fewer instruction collisions, and a skill that stays maintainable as it grows.

<!-- more -->

I have watched the same failure mode repeat. A skill starts clean, it works, and then someone adds “just one more rule”. Six weeks later the file is 1,000 lines, and the model starts missing the instruction you care about most.

It is not because the model got worse. It is because you turned your skill into prompt soup.

This post is about skill design, not autonomy theatre. You can apply the pattern to any multi-step skill: writing, design, extraction, analysis, whatever.

---

## What is progressive disclosure for skills?

**Answer:** Progressive disclosure is a way to structure a skill as phases. Your main `SKILL.md` becomes a lightweight orchestrator that routes the workflow, and it loads specialised modules only when the workflow reaches the phase that needs them. That keeps the model focussed on the right rules at the right time.

This is not about being clever with prompts. It is about being disciplined with where instructions live.

When everything is always in context, the model has too many competing instructions. When only the relevant instructions are loaded, behaviour gets more consistent because there are fewer collisions.

**A simple way to recognise you need this:**

- Your skill has 3+ phases (discovery, planning, generation, verification).
- The files you include are big (templates, CSS, JSON schemas, scripts).
- You keep adding exceptions and edge cases to one master file.

If that describes your skill, you do not need more rules. You need a better structure.

---

## The Frontend Slides skill shows the pattern clearly

**Answer:** A good skill separates routing from payload. The orchestrator routes the workflow and enforces invariants. The phase modules carry the heavy instructions, and you only load them when that phase begins.

Here is the orchestration diagram (from the `frontend-slides` skill) that makes the structure obvious:

```text
┌─────────────────────────────────────────────────────────┐
│                     SKILL.md                            │
│                  (The Orchestrator)                     │
└─────┬─────────────────────────────────────────────┬─────┘
      │                                             │
      ▼ [MODE A: NEW]                               ▼ [MODE B: PPT]
┌─────────────┐                              ┌─────────────┐
│   Phase 1   │                              │   Phase 4   │
│  Discovery  │                              │ PPT Extract │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       └─────────────────────┬──────────────────────┘
                             │
                             ▼
                      ┌─────────────┐   if needed    ┌──────────────────┐
                      │   Phase 2   │ ─────────────▶ │ STYLE_PRESETS.md │
                      │  Styling    │                └──────────────────┘
                      └──────┬──────┘
                             │
                             ▼
                      ┌─────────────┐   loads        ┌──────────────────┐
                      │   Phase 3   │ ─────────────▶ │ viewport-base.css│
                      │ Generation  │ ─────────────▶ │ html-template.md │
                      └─────────────┘ ─────────────▶ │ animation-rules  │
                                                     └──────────────────┘
```

Notice what it does not do. It does not dump every CSS rule, HTML template, and animation snippet into `SKILL.md`. It keeps the orchestrator as a map, then pulls in bulky modules right before the model has to generate.

That timing matters. The instructions that control generation should be in-context at the moment of writing.

If your templates are buried in the middle of a long file, they are easy to miss. If they are loaded right before generation, they are hard to ignore.

---

## Your skill does not fail because it lacks detail, it fails because it has too much

Most people respond to skill failures by adding more instructions. That makes the failure worse. You add a rule, it fixes one case, and then it collides with an older rule.

Now you need another exception. That is how a skill becomes prompt soup.

Here is what prompt soup looks like in practice:

- Your `SKILL.md` contains discovery questions, code templates, formatting rules, edge cases, and troubleshooting.
- The same instruction appears in 3 different places with slightly different wording.
- You have a section called "Important" and another section called "Important (read this)".
- You keep saying "ALWAYS" because you do not trust the structure.

The model is doing what you told it to do. You told it to optimise across a pile of mixed priorities, without clear phase boundaries. Progressive disclosure is how you restore phase boundaries.

---

## Use the M-G-L-E-V framework to design skill instructions

**Answer:** If you want a repeatable way to build skills with progressive disclosure, use this five-part framework:

- **Map:** Define the phases and modes.
- **Gate:** Define what must be true before moving on.
- **Load:** Pull in the phase module files just-in-time.
- **Execute:** Generate the output with only the relevant rules in context.
- **Verify:** Run a checklist before you ship the result.

This is not academic. It is a design skill. It forces you to do the thing most skills avoid: declare what phase you are in, and act like phase boundaries matter.

### Map (2 modes, 5 phases)

Write down the workflow in plain English. If you cannot describe it in 5–7 bullet points, it is not ready to automate.

### Gate (3 checks per phase)

Each phase should have 2–3 gating checks.

Examples:

- Phase 1 (Discovery): "Do we know the audience, format, and goal?"
- Phase 2 (Styling): "Did the user pick a style, or do we need previews?"
- Phase 3 (Generation): "Do we have the templates loaded and constraints clear?"

### Load (only what this phase needs)

This is the core move. Do not load styling presets in discovery or HTML templates in mode detection. Load them right before generation.

### Execute (keep it boring)

When generation starts, keep the model focussed:

- One output format.
- One set of templates.
- One set of constraints.

If you have to support multiple outputs, that is a separate mode.

### Verify (a checklist, not a vibe)

You do not want “looks good”. You want a checklist. At minimum, verify:

- The output matches the requested format.
- The invariants were followed.
- The text is consistent (spelling, casing, headings).

Three checks beats none. Ten checks beats three.

---

## What belongs in SKILL.md vs what belongs in modules?

**Answer:** Put invariants and routing in `SKILL.md`. Put bulky, phase-only instructions in modules.

If you take one idea from this post, take this sorting rule:

- **Always true:** belongs in the orchestrator.
- **Only true in one phase:** belongs in that phase module.

### Orchestrator content (keep it under ~200 lines)

The orchestrator should contain:

- Mode detection (2–3 modes max)
- The phase list (usually 3–6 phases)
- Gating questions per phase
- Non-negotiable invariants (format rules, safety rules, naming rules)
- "Read these files now" directives at phase boundaries

When your orchestrator grows past ~200 lines, you should feel pressure. That pressure is a signal that you are hiding phase content in the wrong place.

### Module content (make it as big as it needs)

Modules should contain the heavy stuff:

- Templates (HTML, Markdown, prompts)
- Style presets
- Reference patterns
- Scripts
- Output schemas

The point is not to make modules small. The point is to make them phase-specific.

---

## How to refactor a bloated SKILL.md in 60 minutes

**Answer:** Refactor one phase at a time. Extract, replace with a loader directive, then add a gate.

If you try to do this in one pass, you will stall. Do it in four steps.

### Step 1: Mark the phase boundaries (10 minutes)
Open your current `SKILL.md` and label the phases. If your file does not have phases, create them. You only need 3 to start:

- Discovery
- Generation
- Verification

### Step 2: Extract one bulky section into a module (15 minutes)

Pick the biggest, most phase-specific block.

Common candidates:

- Style presets
- A huge template
- A long set of "if this then that" rules for a single mode

Move it into a new file. Do not rewrite it yet. Just move it.

### Step 3: Replace the removed content with a just-in-time loader (15 minutes)

At the start of the phase, add a directive like:

- "Before generation, read `html-template.md` and `viewport-base.css`."

The key is timing. Load it when it is needed, not earlier.

### Step 4: Add a verification checklist (20 minutes)

Most skills fail because they never verify their own output. Add a checklist that is short enough to actually run. Start with 5 checks, then expand.

### What to measure (3 numbers that tell you if it worked)

You do not need fancy evals to know if this refactor helped. Track three numbers over the next week:

- **Reruns per task:** How many times do you have to say "try again"?
- **Edits per output:** How many manual fixes do you make after generation?
- **First-turn time:** How long does the first useful answer take?

If reruns and edits drop, the refactor worked. If they do not, your phase boundaries are probably wrong.

---

## Progressive disclosure is also a human design skill

This pattern is not just about models. It is about humans.

A good skill does not ask the user to decide everything upfront. It guides them through decisions in the right order.

Frontend Slides does this with style discovery. It does not ask you to describe a vibe in abstract words, it shows you three options, then it asks you to pick. That is progressive disclosure applied to the user experience.

You can apply the same idea to any skill:

- Ask 3 discovery questions, not 30.
- Offer 2–3 options, not a blank canvas.
- Defer complexity until it becomes necessary.

The result is the same: less cognitive load, better decisions, better outputs.

---

## Your Turn

Here are four actions to take this week:

1. **Pick one brittle skill:** Choose the one that keeps producing near-misses.
2. **Split it into 3 phases:** Discovery, Generation, Verification.
3. **Extract one module:** Move the bulkiest phase content out of `SKILL.md`.
4. **Add 5 verification checks:** Make the skill prove it followed your rules.

Do that once and you will stop treating prompt failures like a mystery. They are usually a structure problem.

[Connect with me on LinkedIn](https://www.linkedin.com/in/ryan-vijay){ .md-button }

P.S. The fastest way to improve a skill is not adding rules. It is moving the right rules to the right phase.
