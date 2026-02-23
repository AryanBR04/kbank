---
description: Get Shit Done (GSD) for Antigravity Workflow
---

// turbo-all
# GSD for Antigravity Workflow

Use this workflow to ensure high reliability, zero context rot, and perfect verification for any task.

## 1. SPECIFICATION (Planning Mode)
- [/] [SPEC] Define the exact scope and goal.
- [ ] Create or update `spec.md` with goals, non-negotiables, and technical boundaries.
- [ ] [PLAN] Create `implementation_plan.md` using the specification.
- [ ] [TASK] Update `task.md` with the checklist from the plan.
- [ ] Use `notify_user` to get approval before proceeding.

## 2. EXECUTION (Execution Mode)
- [/] [EXEC] Execute the implementation plan step-by-step.
- [ ] Use atomic commits: `git add .; git commit -m "[Component] Action taken"` for each unit of work.
- [ ] Update `task.md` as each sub-task is completed.

## 3. VERIFICATION (Verification Mode)
- [/] [VERIFY] Rigorously test the changes.
- [ ] Run the server and use `browser_subagent` to verify UI/UX.
- [ ] Run automated tests or manual curl verification for APIs.
- [ ] [WALKTHROUGH] Generate the final `walkthrough.md` with proof of work (screenshots/videos).

## 4. REVIEW
- [ ] Final `notify_user` with links to the walkthrough and live status.
- [ ] Wait for user feedback.
