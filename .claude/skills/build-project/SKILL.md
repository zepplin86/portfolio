---
name: build-project
description: >
  Reads a project spec file from .claude/local/project/<filename> and executes it
  in three ordered phases: Plan → Implement → Review. Use when the user invokes
  /build-project <filename> or says "build-project <filename>".
---

# Build Project Skill

When this skill is invoked, the argument is a filename (e.g. `project.md`).

## Execution Order

You MUST execute the three phases in strict order. Do NOT skip or merge phases.

---

## Phase 1 — PLAN

1. Read the file at `.claude/local/project/<args>` (use the Read tool).
2. Analyze the content: understand the feature, requirements, and constraints.
3. Enter plan mode with `EnterPlanMode`.
4. Inside plan mode, produce a structured plan:
   - **Goal**: one-sentence summary of what will be built
   - **New files**: list each file to be created with its purpose
   - **Modified files**: list each existing file to be changed and why
   - **Implementation steps**: numbered, ordered list of what you will do
   - **Decisions**: any architectural or tech choices that need to be made
5. Exit plan mode with `ExitPlanMode` and present the plan to the user.
6. Wait for explicit user approval ("yes", "go ahead", "proceed", etc.) before moving to Phase 2.
   - If the user requests changes to the plan, revise and re-present. Do not implement until approved.

---

## Phase 2 — IMPLEMENT

Only start after the user has approved the plan.

1. Announce: "**Phase 2 — Implementing**"
2. Execute each step from the approved plan in order.
3. Every project page MUST follow this layout:
   - **Left (flex-1)**: An interactive demo or working code example that lets the visitor experience the feature hands-on. If the spec describes a UI feature, build it as a live component. If the spec describes an algorithm or logic, build a step-by-step visualizer or input/output playground. Never leave this side as plain text.
   - **Right (lg:w-96 sticky)**: Project description panel (see writing rules below).

4. When writing any user-facing description, explanation, or narrative text (e.g. the right-side description panel of a project page):
   - **두괄식**: Lead with the conclusion or key result first, then explain the background and process.
   - **해결 방법 강조**: Make the solution and how the problem was resolved the most prominent part — not the problem itself.
   - **자연스러운 문체**: Write in natural, flowing prose — avoid bullet-point-style raw spec dumps. Transform the raw spec into readable narrative.
   - Example structure: "~를 해결했습니다. [핵심 해결책 1~2문장] → 배경 설명 → 구체적인 구현 과정 → 결과"
4. After all steps are done, announce: "**Implementation complete.**"

---

## Phase 3 — REVIEW

Start immediately after implementation completes — do not wait for user input.

1. Announce: "**Phase 3 — Reviewing**"
2. Re-read every file you created or modified.
3. Check for:
   - Correctness: does it actually satisfy the requirements from the spec file?
   - Completeness: are there missing cases, missing translations (if i18n project), or unfinished TODOs?
   - TypeScript errors: run `npx tsc --noEmit` if this is a TypeScript project and fix any errors found.
   - Consistency: does it match the conventions and patterns of surrounding code?
4. Fix any issues found directly (do not just report them).
5. Summarize what was built and what (if anything) was fixed during review.
