# Specification: GSD Implementation & Project Baseline

## Goal
Implement the "Get Shit Done" (GSD) workflow for the `kbank` project and establish a high-reliability development environment.

## Context
- **Project Name**: kbank
- **Stack**: Next.js (Pages router), MySQL, React, JWT Auth
- **Current State**: Initialized, running `npm run dev`.

## Scope
1. **Workflow Setup**: Formalize `.agent/workflows/gsd.md`.
2. **Project Documentation**: Create `spec.md`, `implementation_plan.md`, and `task.md`.
3. **Verification**: Ensure the project is running and accessible.
4. **UI Redesign**: Overhaul the visual design to a "Premium Banking" aesthetic without changing logic.

## Non-Negotiables
- Atomic commits for all changes.
- Verification (manual or automated) for every unit of work.
- Zero context rot by maintaining the artifacts.
- **Functionality**: No changes to auth logic, database interaction, or routing.

## Technical Boundaries
- Follow the existing project structure (`pages/`, `lib/`, `styles/`).
- Use the provided GSD workflow strictly.
- **Design System**: Use `globals.css` for core tokens. Avoid inline styles where possible.
