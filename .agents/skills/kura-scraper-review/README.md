# Kura Scraper Review Skill

Project-local review skill for auditing Kura scraper architecture, extraction resilience, reliability, security, and runtime correctness.

## Overview
- **Location**: `.agents/skills/kura-scraper-review/`
- **Specification**: Aligns with Agent Skills format (`ravidsrk/agent-skills` & `mblode/agent-skills`).
- **Foundations**: Apify, Scrapfly, Playwright, QA Methodology, Secure Software Engineering.

## Usage
Invoke within Antigravity CLI:
```text
Review the doujindesu scraper module using kura-scraper-review
```
or
```text
Audit src/proxy.js for SSRF security with kura-scraper-review
```

## Structure
- `SKILL.md` - Core skill manifest and review orchestrator
- `README.md` - Human documentation and usage instructions
- `references/` - Deep dive documentation loaded on demand
  - `sources.md` - Verified sources, exact URLs, and authority mapping
  - `architecture-rules.md` - Fetcher/Parser/Normalizer layer separation
  - `security-threat-model.md` - SSRF prevention and untrusted input sanitization
  - `extraction-reliability.md` - Fallback selectors, timeouts, and backoff
  - `runtime-verification.md` - Live HTTP and schema verification protocol
- `tests/` - 10 validation test scenarios (`test-scenarios.md`)
