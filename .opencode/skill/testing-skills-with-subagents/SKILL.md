---
name: testing-skills-with-subagents
description: TDD applied to process documentation. RED (baseline without skill) → GREEN (write skill) → REFACTOR (close loopholes).
---

# Testing Skills with Subagents Skill

You are running the **testing-skills-with-subagents** skill. Skills are code. Test them like code.

## The Problem

Skills are process documentation that guide agent behavior. Untested skills:
- Have loopholes agents can exploit
- Miss edge cases
- Drift from original intent over edits

## The Solution: TDD for Skills

Apply RED-GREEN-REFACTOR to skill creation and validation.

### Phase 1: RED — Establish Baseline

Before writing the skill:

1. **Define the desired behavior** — What should the agent do differently?
2. **Run a subagent WITHOUT the skill** — Document what it does wrong
3. **Capture the failure mode** — This is your "failing test"

```
Example for TDD skill:
- Desired: Agent writes tests before code
- Baseline run: Agent writes code first, then adds tests
- Failure: "I'll implement the function, then write tests"
```

### Phase 2: GREEN — Write the Skill

1. **Write the skill** — Target the specific failure mode
2. **Run a subagent WITH the skill** — It should now behave correctly
3. **Verify the fix** — Did it change behavior as intended?

```
Skill added: "No code without tests. Delete any code written before test."
- With skill: Agent refuses to write code, asks for test first
- Success: Behavior changed in expected direction
```

### Phase 3: REFACTOR — Close Loopholes

1. **Try to bypass the skill** — Look for edge cases and exploits
2. **Add constraints** — Tighten rules to prevent bypasses
3. **Re-run with edge cases** — Verify loopholes are closed

```
Loophole: "What if I keep the code as 'reference' while writing test?"
Fix: Add rule: "Write code before test? DELETE the code. Don't keep as reference."
```

## Workflow

```
1. Define → What behavior change do you want?
2. RED → Run subagent without skill, capture failure
3. GREEN → Write skill, run subagent with skill, verify fix
4. REFACTOR → Find loopholes, close them, verify
5. Document → Record test cases in skill or memory
```

## Test Cases for Skills

Store validated test cases in `.opencode/memory/skill-tests/`:

```markdown
# tdd-skill-tests.md

## Test 1: Code Before Test
- Input: "Implement a user service"
- Without skill: Writes UserService, then asks about tests
- With skill: Refuses, asks for test first
- Status: PASS

## Test 2: Reference Code Loophole
- Input: "Here's reference code for UserService, write tests"
- Without explicit rule: Keeps reference, writes tests to match
- With rule: Deletes reference, writes test from spec
- Status: PASS
```

## Rules

1. **Never trust a skill you haven't tested** — Run it against a subagent
2. **Baseline first** — You can't know the skill works without comparison
3. **Hunt for loopholes** — Actively try to break your own rules
4. **Document test cases** — Future editors need to know what was validated

## Red Flags

- Skill added without testing against baseline
- Rules with obvious exceptions
- Vague language that agents can interpret loosely
- No documented test cases
- Skill that "feels right" but has no evidence
