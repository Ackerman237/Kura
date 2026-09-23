---
name: kura-documentation
description: >-
  Audits, verifies, and authors accurate technical documentation for Kura (README, architecture, provider guides, API references, configuration, troubleshooting, and changelogs) using Diataxis and verified codebase evidence. Use when asked to "write docs", "update README", "audit documentation", "document provider", "check environment variables in docs", or "verify docs against code".
license: MIT
compatibility: Node.js >= 18.17, Markdown, Diataxis framework.
metadata:
  version: "1.0.0"
  author: "Kura Engineering"
---

# Kura Technical Documentation Orchestrator

A specialized project-local skill for authoring, auditing, and maintaining truthful, high-quality technical documentation for **Kura**.

This skill operates strictly on **verified codebase evidence** (inspecting `package.json`, `.env.example`, `server.js`, `src/sources/`, and `test/`) and adheres to the **Diataxis Documentation Framework** (`JayRHa/AgentSkills`) and strict anti-hallucination standards (`mblode/agent-skills`). It **never** invents commands, features, or configurations.

---

## 1. Scope & Boundaries

- **IS**: Authoring and auditing Kura `README.md`, architecture docs, API references, provider manuals, environment variable tables, setup guides, and changelogs based on actual code.
- **IS NOT**: Code implementation/refactoring (use appropriate coding workflows), scraper technical audits (route to `kura-scraper-review`), UI review (route to `kura-ui-ux-review`), or general code review (route to `open-code-review-delegate`).

---

## 2. Mandatory Verification & Discrepancy Tagging

Before drafting or updating any documentation, the skill must inspect the actual codebase:
1. `package.json` - Check `"scripts"`, `"engines"`, `"dependencies"`, and `"exports"`.
2. `.env.example` - Check required and optional environment variables.
3. `server.js` & `src/server/routes/` - Check active Express endpoints.
4. `src/sources/` - Check verified scraper providers.
5. `test/` - Check verified test suites.

### Strict Tagging Policy:
- If a claim cannot be verified in code: tag as `UNVERIFIED`.
- If code exists without clear usage: tag as `IMPLEMENTED / USAGE UNVERIFIED`.
- If documentation contradicts code: tag as `DOCUMENTATION DISCREPANCY` with exact line citations.

---

## 3. Diataxis Documentation Framework

All Kura documentation must be categorized into one of four Diataxis quadrants ([`references/diataxis-framework.md`](./references/diataxis-framework.md)):

```
+---------------------------------------------------------------------------------------+
|                                DIATAXIS 4-QUADRANT MODEL                              |
+---------------------------------------------------------------------------------------+
| 1. Tutorials (Learning)          | Step-by-step first-success path (e.g. Getting       |
|                                  | Started with Kura local dev server).                |
+----------------------------------+----------------------------------------------------+
| 2. How-To Guides (Tasks)         | Practical problem-solving recipes (e.g. How to add  |
|                                  | a new manga scraper provider).                      |
+----------------------------------+----------------------------------------------------+
| 3. Reference (Information)       | Structured, complete lookup tables (e.g. API route  |
|                                  | parameters, environment variable definitions).      |
+----------------------------------+----------------------------------------------------+
| 4. Explanation (Concepts)        | High-level rationale & architecture discussions     |
|                                  | (e.g. Media proxy architecture, cache design).     |
+---------------------------------------------------------------------------------------+
```

---

## 4. Documentation Audit Workflow

When reviewing or auditing existing Kura documentation:

```
+---------------------------------------------------------------------------------------+
| 1. Codebase Grounding Pass                                                            |
|    Read package.json, .env.example, server.js, and src/ to establish factual baseline.|
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| 2. Document Extraction & Comparison                                                   |
|    Extract documented commands, endpoints, and variables from target markdown file.   |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| 3. Discrepancy Detection & Tagging                                                    |
|    Identify mismatches, missing items, or outdated instructions. Apply exact tags.    |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| 4. Plain Language & Style Audit                                                       |
|    Verify active voice, short sentences, runnable examples, and no machine filler.   |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| 5. Output Audit Report or Corrected Documentation                                     |
|    Deliver evidence-backed report or updated document with exact citations.          |
+---------------------------------------------------------------------------------------+
```

---

## 5. Reference Links
- [`references/sources.md`](./references/sources.md) - Exact verified sources, URLs, and authority mapping
- [`references/diataxis-framework.md`](./references/diataxis-framework.md) - Diataxis structure and document types
- [`references/discrepancy-detection.md`](./references/discrepancy-detection.md) - Anti-hallucination rules and tagging protocol
- [`references/kura-doc-standards.md`](./references/kura-doc-standards.md) - README, API, and changelog templates
- [`tests/test-scenarios.md`](./tests/test-scenarios.md) - 7 validation test scenarios
