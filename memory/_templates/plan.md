# Plan Template

Use this template when creating implementation plans.

**Output path:** `.opencode/memory/plans/YYYY-MM-DD-<feature>.md`

---

```markdown
---
phase: XX-name
plan: NN
type: execute
wave: N
depends_on: []
files_modified: []
autonomous: true
requirements: []
must_haves:
  truths: []
  artifacts: []
  key_links: []
---

<objective>
[What this plan accomplishes]
</objective>

<context>
[Relevant context files and source references]
</context>

<tasks>
<task type="auto">
  <packet_id>P-T001</packet_id>
  <task_id>T-001</task_id>
  <name>Task 1: [Action-oriented name]</name>
  <goal>[One executable concern]</goal>
  <files_in_scope>
    <create>[]</create>
    <modify>["path/to/file.ext"]</modify>
    <delete>[]</delete>
  </files_in_scope>
  <dependencies>[]</dependencies>
  <action>[Specific implementation]</action>
  <acceptance_criteria>
    <criterion cmd="bun test path/to/test.ts">exits 0</criterion>
    <criterion cmd="lsp_diagnostics path/to/file.ext">zero errors</criterion>
  </acceptance_criteria>
  <verification_commands>
    <command>bun run typecheck</command>
    <command>bun test path/to/test.ts</command>
  </verification_commands>
  <risks>
    <risk>[Top risk for this packet]</risk>
  </risks>
  <escalate_if>
    <condition>Verification fails after 2 attempts</condition>
    <condition>Implementation requires file outside files_in_scope</condition>
  </escalate_if>
  <context_refs>
    <discussion_paths>[]</discussion_paths>
    <plan_path>.opencode/memory/plans/YYYY-MM-DD-<feature>.md</plan_path>
    <research_paths>[]</research_paths>
  </context_refs>
</task>
</tasks>

<file_impact>
  <create>[]</create>
  <modify>["path/to/file.ext"]</modify>
  <delete>[]</delete>
</file_impact>

<dag>
  <wave number="1">P-T001</wave>
</dag>

<boundaries>
  <always>[Required invariants and constraints]</always>
  <ask_first>[Changes that require explicit approval]</ask_first>
  <never>[Out-of-scope or forbidden changes]</never>
</boundaries>

<out_of_scope>
[Explicitly excluded work]
</out_of_scope>

<verification>
[Overall phase checks]
</verification>

<success_criteria>
[Measurable completion]
</success_criteria>
```
