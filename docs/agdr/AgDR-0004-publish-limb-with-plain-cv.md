---
id: AgDR-0004
timestamp: 2026-11-16T12:00:00Z
agent: codex
model: openai-codex/gpt-6.1-sol
trigger: user-prompt
status: executed
---
# Publish the selected Limb design without changing the PDF contract

> In the context of preparing the selected object-based Limb design for review, facing a plain-CV publishing pipeline, I decided to generate the interactive homepage alongside a plain CV using the existing build to preserve hosting and PDF checks, accepting an additional presentation template.

## Context
- The user selected object-based Limb and requested removal of illustration notes and PR preparation.
- GitHub Pages publishes only `dist/`.
- `cv.md` must remain the canonical content for both modes and the PDF.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| Publish only prototype files | Small isolated patch | Selected design is not the deployed homepage |
| Extend existing static build | Same hosting and PDF contract; no new dependencies | Additional template and content mapping |

## Decision
Extend the existing build because it makes the selected design deployable without replacing the PDF generation path. Keep all experimental prototypes local and outside the PR. Render interactive detail sections from canonical Markdown rather than the prototype's copied professional facts.

## Consequences
- `/` becomes Limb; `/plain.html` contains the complete CV; PDF URL remains unchanged.
- CI checks browser behavior and CV/PDF integrity before deployment.
- The selected version is scroll-driven and contains no personal avatar. All nine role/skills/education sections remain in document flow; anchor links are optional shortcuts.
- Pull requests build without deploying; merging to `master` uses the existing publication workflow.
- `portfolio/` contains only selected presentation/art; no experimental source is required.
- Browser tests cover 320, 390, 768, 820, 1024 and 1440px, canonical CV bullets, plain-mode round trips, keyboard behavior and no-JavaScript access.
- The existing two-page tagged PDF and reading-order checks remain in CI.
