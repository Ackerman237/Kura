# Verified Sources & Authority Mapping: Kura Scraper Review

This document records the exact, verified human-authored and open-source references used as the foundation for `kura-scraper-review`. No rules, checklists, or methodologies were invented.

---

## 1. Verified Sources Table

| Topic | Source | Exact URL | File/Path | What was verified | Used for |
|---|---|---|---|---|---|
| **Scraper Security & Input Sanitization** | Apify Agent Skills | `https://github.com/apify/agent-skills` | `skills/apify-actor-development/SKILL.md` | Treating crawled web content as untrusted input, input/output validation, preventing code execution (`eval`/shell) of scraped data, credential isolation (`APIFY_TOKEN` / API keys), dependency review, and version pinning/lockfiles. | Security threat modeling, untrusted remote input validation, and credential isolation in Kura scrapers. |
| **Scraping Architecture & Extraction** | Scrapfly Skills | `https://github.com/scrapfly/skills` | `skills/scrapfly-scraper/SKILL.md`, `skills/scrapfly-extraction/SKILL.md` | Scraper parameters (`timeout`, `retry`, `headers`, `cookies`, `proxy_pool`, `session`, `unblocker`, `render_js`, `wait_for_selector`, `screenshots`), structured extraction patterns, anti-bot bypass, and session-persistence. | Fetcher/client separation, selector waiting strategies, retry/backoff parameters, and extractor resilience. |
| **Browser Runtime & Headless Scraping** | Playwright Agent Skill (magnus919) | `https://github.com/magnus919/agent-skills/blob/main/playwright/SKILL.md` | `playwright/SKILL.md` | Playwright operating contract, user-facing locator hierarchy (`getByRole`, `getByLabel`), network interception (`page.route()`), test isolation, aria snapshot checks, and headless scraping loops (`extract -> validate -> save`). | Runtime browser verification, network mocking/interception for scrapers, and dynamic selector evaluation. |
| **QA Strategy & Quality Gates** | QA Methodology (magnus919) | `https://github.com/magnus919/agent-skills/blob/main/qa-methodology/SKILL.md` | `qa-methodology/SKILL.md` | Core QA axioms ("If it isn't tested, it's broken", "Test behavior, not implementation", "Risk drives priority", "Flaky tests are worse than no tests"), quality gates (blocking vs advisory), risk-based test allocation ($P \times I$). | Scraper review quality gates, regression test strategy, and risk-based validation of provider changes. |
| **Security Engineering & Threat Modeling** | Secure Software Engineering (magnus919) | `https://github.com/magnus919/agent-skills/blob/main/secure-software-engineering/SKILL.md` | `secure-software-engineering/SKILL.md` | Prevention-oriented security, threat modeling data flows and trust boundaries, safe defaults, handling untrusted remote inputs, and dependency risk management. | Reviewing SSRF, DNS rebinding, redirect validation, arbitrary URL injection, and unsafe file handling. |
| **Skill Structure & Authoring** | Agent Skills Creator (mblode) | `https://github.com/mblode/agent-skills/blob/main/skills/agent-skills-creator/SKILL.md` | `skills/agent-skills-creator/SKILL.md` | Skill lifecycle, workflow pattern, concise model triggers ("Use when..."), IS/IS-NOT boundary definitions, and validation checks. | Structuring the `kura-scraper-review` skill manifest and routing. |
| **Skill Anatomy Spec** | Skill Anatomy (ravidsrk) | `https://github.com/ravidsrk/agent-skills/blob/main/docs/skill-anatomy.md` | `docs/skill-anatomy.md` | Agent Skills open format specification: `SKILL.md`, `README.md`, `references/`, `tests/`, required frontmatter (`name`, `description`), and capability skill patterns. | Ensuring strict specification compliance of skill directory structure. |

---

## 2. Source Authority Levels

Every rule and principle applied by `kura-scraper-review` is classified under one of the following authority levels:

1. **Vendor Guidance / Official SDK Patterns**:
   - Apify SDK security & Actor input/output contract (`apify/agent-skills`).
   - Scrapfly Scraping & Extraction parameters (`scrapfly/skills`).
   - Playwright documentation & locator contract (`magnus919/agent-skills`).
2. **Engineering Practice / Industry Standards**:
   - QA Methodology risk-based testing ($P \times I$) and flakiness quarantine (`magnus919/agent-skills`).
   - Secure Software Engineering threat boundaries and input sanitization (`magnus919/agent-skills`).
3. **Kura-Specific Architectural Decisions**:
   - Zero-dependency runtime fetch architecture using `undici` / native `fetch` over heavy third-party scrapers.
   - Provider modularity in `src/sources/` or `src/<provider>.js`.
   - In-memory & disk caching in `src/cache.js`.
   - SSRF protection and IP sanitization in `src/security.js` and `src/proxy.js`.

---

## 3. Discrepancy & Verification Notes

- **Apify Agent Skills**: Path verified at `skills/apify-actor-development/SKILL.md`. Security guidelines in section `## Security` explicitly mandate treating crawled data as untrusted and isolating tokens.
- **Scrapfly Skills**: Skills in repository live under `skills/<skill-name>/SKILL.md` (e.g. `skills/scrapfly-scraper/SKILL.md`) rather than root. Verified live via raw fetch.
- **Magnus919 Skills**: `playwright/SKILL.md`, `qa-methodology/SKILL.md`, and `secure-software-engineering/SKILL.md` verified live via raw fetch.
