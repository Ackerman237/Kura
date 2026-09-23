---
name: open-code-review
description: >-
  Audits and reviews software architecture, code quality, maintainability, scope compliance, and security using systematic rule resolution. Use when performing PR code reviews, evaluating architectural changes, or checking adherence to codebase standards.
license: MIT
compatibility: Platform-agnostic.
metadata:
  version: "1.0.0"
  author: "Open Code Review / adapted project-locally"
---

# Open Code Review Skill

This skill owns **general code review, architectural adherence, and maintainability checks**.

## Ownership & Boundaries
- **IS**: Multi-file code reviews, checking dependency direction, verifying architectural boundaries, detecting dead code, and scoping PR changes.
- **IS NOT**: Scraper-specific domain review (delegate to `kura-scraper-review`), UI/UX design review (delegate to `kura-ui-ux-review`), browser automation (delegate to `playwright`), or test strategy (delegate to `qa-methodology`).
