---
name: qa-methodology
description: >-
  Design and apply QA methodology, test strategy, risk-based prioritization (P x I), regression testing, and quality gates. Use when establishing test strategies, deciding what and how to test, triaging flaky tests, or setting blocking quality gates.
license: MIT
compatibility: Platform-agnostic methodology.
metadata:
  version: "1.0.0"
  author: "magnus919 / adapted project-locally"
---

# QA Methodology Skill

This skill owns the **test strategy, quality gates, and risk prioritization** across software projects.

## Ownership & Boundaries
- **IS**: Test strategy (what to test, at what level), risk-based test allocation ($P \times I$), regression suite design, flaky test quarantine, and blocking vs advisory quality gates.
- **IS NOT**: Operating browser automation tools (delegate to `playwright`), Kura scraper domain review (delegate to `kura-scraper-review`), or UI design audits (delegate to `kura-ui-ux-review`).

## Core Principles
1. **If it isn't tested, it's broken**: Untested code is code whose failure mode hasn't been discovered yet.
2. **Test behavior, not implementation**: Tests coupled to behavior survive refactoring.
3. **Risk drives priority**: Score Probability × Impact ($P \times I$) and allocate test investment accordingly.
4. **Flaky tests are worse than no tests**: Quarantine immediately upon detection; rerun once, never twice.
