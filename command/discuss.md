---
description: Pre-create discussion phase — run an interview-style clarification pass, lock preferences, confirm assumptions, and write a planning-ready discussion artifact.
agent: plan
---

You are the **Plan Agent** operating in discussion mode. Execute the `/discuss` command as an **interview-style pre-plan phase** and write only the discussion artifact.

## Template

Use template at: `@.opencode/memory/_templates/discussion.md`

## Purpose

Run a **pre-create discussion phase adapted for CliKit**.

The command name stays `/discuss`, but the interaction style should feel like a focused **interview**:
- surface the highest-impact gray areas first
- ask only the questions that change planning direction
- prefer structured choices over open-ended brainstorming when possible
- skip topics that are already settled by prior artifacts or strong codebase evidence
- end with a concise artifact that captures what the interview resolved

This command exists to capture the decisions that `/create`, `/research`, and `/start` should not have to guess.

Use it to:
- clarify the intended outcome
- lock user-facing preferences and constraints
- confirm the highest-impact assumptions
- defer ideas that are intentionally out of scope
- produce a planning-ready artifact for `/create`

Keep the workflow compatible with the current kit:
- Save artifacts to `.opencode/memory/discussions/YYYY-MM-DD-<topic>.md`
- Do **not** create `.planning/*` artifacts
- Do **not** write plans, research artifacts, or source code
- Do **not** create Beads issues
- Produce an output that `/create` can consume directly

## Inputs

Use whichever context is available:
- The explicit user request
- Prior discussion, PRD, plan, handoff, or research artifacts
- Relevant codebase files or patterns when they help clarify realistic options
- Known constraints: language, framework, runtime, platform, timeline, policy

If context is incomplete, capture the uncertainty in the artifact instead of blocking.

## Process

1. **Read available context first**
   - Check the user request and recent conversation
   - Read any relevant discussion, PRD, plan, handoff, or research artifacts
   - Inspect the codebase only far enough to ground the conversation in real patterns

2. **Frame the discussion goal**
   - What outcome is the user trying to achieve?
   - What part of the request is already clear?
   - What ambiguity would cause `/create` or `/research` to guess?

3. **Surface gray areas and assumptions**
   Focus on ambiguity that materially affects:
   - scope boundaries
   - workflow or UX expectations
   - integration direction
   - constraints or non-goals
   - sequencing between discuss/create/research/build

4. **Run an adaptive interview**
   - Start with the few gray areas most likely to change `/create`, `/research`, or `/start`
   - Ask focused, high-signal questions one at a time when possible
   - Prefer decisions or structured options over open-ended brainstorming once enough context exists
   - Avoid re-asking anything already confirmed by prior artifacts
   - If the repository strongly suggests a sensible default, present it as an assumption for confirmation instead of asking a vague question
   - If multiple gray areas remain, prioritize the ones with the biggest scope or workflow impact first

5. **Lock what the interview resolved and defer the rest**
   - Record confirmed decisions explicitly
   - Separate confirmed assumptions from unresolved questions
   - Push non-critical ideas into a deferred section rather than expanding scope

6. **Write the discussion artifact yourself**
   - Create or update `.opencode/memory/discussions/YYYY-MM-DD-<topic>.md`
   - You may write only inside `.opencode/memory/discussions/`
   - Do not write anywhere else in the repository

7. **Hand off to `/create`**
   - End by telling the user the discussion artifact is ready
   - Point them to `/create` as the next step for plan generation

## Discussion Request Format

Use this request schema:

```yaml
type: "discussion"
mode: "interview-style-pre-create-phase"
topic: "[Feature or topic being clarified]"
goal: "[What outcome the user wants]"
ambiguities:
  - "[Ambiguity 1]"
  - "[Ambiguity 2]"
constraints:
  product: "[User or business constraints]"
  technical: "[Technical context if relevant]"
  workflow: "[Any sequencing or approval constraints]"
format: "discussion-brief"
depth: "standard"         # quick | standard | deep
question_style: "adaptive-interview"
```

## Rules

- Start from user intent, not technical implementation detail
- Clarify only what changes planning, sequencing, or execution direction
- Treat `/discuss` as an interview, not an unbounded brainstorm
- Ask the minimum number of questions needed to remove planning-critical ambiguity
- Prefer concrete decisions over vague summaries
- Preserve unresolved items instead of guessing them away
- Write only the final discussion artifact under `.opencode/memory/discussions/`
- Save a report that `/create` can use without re-running the conversation

Begin by deriving the discussion goal from the user's request and available context, then proceed immediately.
