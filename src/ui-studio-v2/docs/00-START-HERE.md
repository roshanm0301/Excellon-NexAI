# UI Studio V2 — Design Docs (START HERE)

This folder holds the **authoritative design specification** for UI Studio V2.

## Rules (for any AI agent or developer working in this repo)
- These documents are **authoritative and read-only**. Do **not** modify them.
- Read the **relevant** document for the task at hand (see the map below) — do not read everything at once.
- Work **only** inside the `ui-studio-v2/` folder. Never read, import, copy, or depend on any code or document **outside** this folder (the existing V1 Entity Designer, UI Studio, Overlay, backend, and dockers are out of scope).
- The backend is **mocked** (MSW). There are no real backend calls in this build.
- If a document and an instruction ever conflict, **stop and ask** — do not guess.

## Document map — what to read, and when

| Document | What it is | Read it when |
|---|---|---|
| `UI-Studio-Phase-6-Execution-Prompts.md` | **The driver.** Global Prompt Contract + numbered build prompts 00–12. | Always in effect. Start here for any prompt. |
| `UI-Studio-Product-Decision-Record.md` | The 15 locked product/architecture decisions + why. | To understand *what* was decided and *why*. |
| `UI-Studio-Phase-4-Frontend-Architecture.md` | Folder structure, state model, routing, services, mocks, the Canvas overlay system. | The main technical reference for every prompt. |
| `UI-Studio-Phase-5-Implementation-Blueprint.md` | Epics → Features → Stories → Tasks with files & acceptance criteria. | For the task detail behind each prompt. |
| `UI-Studio-Phase-2-UX-Specification.md` | Navigation, screens, journeys, interaction models. | When building any UI surface (Explorer, Canvas, Inspector, etc.). |
| `UI-Studio-Phase-3-UI-Design-Specification.md` | Wireframes, component hierarchy, and empty/loading/error states. | When building the visual/structural detail of a surface. |
| `Architecture-Spec-01-Meta-Model.md` | The Meta Model object definitions (the domain types contract). | For the domain layer (Prompt 02) and any binding work. |
| `Architecture-Spec-06-Design-System-Engine.md` | The closed set of semantic component types (the palette catalogue). | For the Asset Library, Inspector, and Canvas component mapping. |
| `Platform-Constitution.md` | The architectural laws ([L#]) that acceptance criteria reference. | To check a "must / must not" rule (e.g. L4, L6, L16, L19, L32, L34). |

## Reading order for a person new to this
1. `UI-Studio-Product-Decision-Record.md` (what we're building and why)
2. `UI-Studio-Phase-4-Frontend-Architecture.md` (how it's built)
3. `UI-Studio-Phase-6-Execution-Prompts.md` (how to build it, step by step)

Everything else is reference, pulled in per task.
