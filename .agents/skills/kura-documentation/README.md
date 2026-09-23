# Kura Documentation Skill

Project-local skill for authoring, auditing, and maintaining accurate, evidence-backed technical documentation for Kura without hallucinations.

## Overview
- **Location**: `.agents/skills/kura-documentation/`
- **Specification**: Aligns with Agent Skills format (`ravidsrk/agent-skills` & `mblode/agent-skills`).
- **Foundations**: Diataxis Framework (`JayRHa/AgentSkills`), mblode anti-hallucination guidelines.

## Usage
Invoke within Antigravity CLI:
```text
Audit README.md against the codebase using kura-documentation
```
or
```text
Generate API reference documentation for the video scraper routes with kura-documentation
```

## Structure
- `SKILL.md` - Core skill manifest and documentation audit orchestrator
- `README.md` - Human documentation and usage instructions
- `references/` - Deep dive documentation loaded on demand
  - `sources.md` - Verified sources, exact URLs, and authority mapping
  - `diataxis-framework.md` - Tutorial / How-To / Reference / Explanation model
  - `discrepancy-detection.md` - Mandatory discrepancy tags (`UNVERIFIED`, `DOCUMENTATION DISCREPANCY`)
  - `kura-doc-standards.md` - Standards and templates for README, API, and changelogs
- `tests/` - 7 validation test scenarios (`test-scenarios.md`)
