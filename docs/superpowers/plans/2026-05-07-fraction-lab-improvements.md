# Fraction Lab Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the five prioritized improvements from the project analysis: accessible answer selection, repository operations hygiene, concept-first feedback, mobile learning flow, and broader regression tests.

**Architecture:** Keep the app as a dependency-free static HTML/CSS/JS site. Make targeted changes inside the existing files, adding lightweight helper functions where they make behavior testable without converting the app to a build system. Add repo-level scripts and CI so the same checks run locally and on GitHub.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner, GitHub Actions, GitHub Pages static hosting.

---

### Task 1: Make Quiz Choices Semantically Accessible

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `style.css`
- Test: `tests/accessibility-feedback.test.js`

- [x] Replace the current `button + aria-pressed` pattern inside `role="radiogroup"` with radio semantics: `role="radio"`, `aria-checked`, and roving `tabindex`.
- [x] Add keyboard behavior for `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Space`, and `Enter`.
- [x] Update tests so they fail on the current `aria-pressed` implementation and pass only when radio state and keyboard navigation work.

### Task 2: Add Repository Operations Basics

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.github/workflows/ci.yml`
- Create: `README.md`

- [x] Add `npm test`, `npm run check`, and `npm run verify` scripts without adding runtime dependencies.
- [x] Add CI that runs syntax checks and Node tests on pushes and pull requests.
- [x] Document the app purpose, local run command, verification commands, deployment URL, and GitHub Pages deployment model.
- [x] Ignore common local artifacts such as `node_modules`, logs, coverage, Playwright reports, and screenshots.

### Task 3: Improve Elementary Concept Feedback

**Files:**
- Modify: `script.js`
- Modify: `tests/accessibility-feedback.test.js`

- [x] Change answer explanations so visual and grade-level reasoning comes first.
- [x] Use same-denominator comparison when denominators match.
- [x] Use unit-fraction wording when both numerators are 1.
- [x] Explain unlike denominators by converting both fractions into the same-size pieces.
- [x] Add tests for same-denominator, unit-fraction, and unlike-denominator feedback.

### Task 4: Improve Mobile Learning Flow and Touch Targets

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `style.css`
- Test: `tests/accessibility-feedback.test.js`

- [x] Add a compact summary/status bar near the top of the main content showing current A/B values and comparison status.
- [x] Keep the summary updated as sliders, shape, unit mode, quiz questions, and answers change.
- [x] On small screens, show the visualization section before the controls so students see the models earlier.
- [x] Increase touch target sizes for buttons, sliders, radio labels, and checkbox labels.
- [x] Add visible text under each model describing how many pieces are filled.

### Task 5: Broaden Regression Tests

**Files:**
- Modify: `tests/accessibility-feedback.test.js`

- [x] Add tests for manual slider changes clearing old answer selection.
- [x] Add tests for quiz flow: start quiz, answer current question, enable next, finish safely.
- [x] Add tests for dynamic model descriptions and summary text.
- [x] Ensure `npm run verify` passes with all tests.

### Verification

- [x] Run `npm run verify`.
- [x] Run `git diff --check`.
- [x] Review changed files for accidental scope drift.
