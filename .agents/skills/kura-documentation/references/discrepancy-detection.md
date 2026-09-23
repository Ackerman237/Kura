# Discrepancy Detection & Truthful Documentation Protocol

This document establishes the mandatory verification protocol to prevent hallucinations and detect discrepancies between documentation and code.

*Primary sources: mblode `skills/ghostwriter/SKILL.md`, JayRHa `technical-writer/SKILL.md`.*

---

## 1. Absolute Prohibition on Invention

When creating, editing, or auditing Kura documentation:

> [!CAUTION]
> **NEVER invent**:
> - CLI commands or script flags
> - Environment variables
> - API endpoints or HTTP routes
> - Scraper providers or data sources
> - Features or UI screens
> - NPM dependencies
> - Architecture diagrams or unverified test claims

---

## 2. Mandatory Discrepancy Classifications

If documentation does not perfectly align with source code evidence, use these exact classification tags:

### 1. `UNVERIFIED`
- **When to use**: Information, claim, or external requirement cannot be found or verified in source code, configuration files, or tests.
- **Format**:
  ```markdown
  > [!WARNING]
  > **UNVERIFIED**: [State the unverified claim]. No evidence found in codebase.
  ```

### 2. `IMPLEMENTED / USAGE UNVERIFIED`
- **When to use**: A function, module, route, or configuration exists in the codebase, but there is no documentation, test case, or active caller demonstrating how it is intended to be used.
- **Format**:
  ```markdown
  > [!NOTE]
  > **IMPLEMENTED / USAGE UNVERIFIED**: Found export `functionName` in `src/file.js:42`, but no active caller or tests demonstrate intended usage.
  ```

### 3. `DOCUMENTATION DISCREPANCY`
- **When to use**: Existing documentation (e.g. `README.md`, `docs/`) contradicts actual source code (e.g. `package.json`, `server.js`).
- **Format**:
  ```markdown
  > [!IMPORTANT]
  > **DOCUMENTATION DISCREPANCY**:
  > - **Documented**: `npm run start:scraper` in `README.md:34`
  > - **Actual Code**: `package.json:30` defines `"start": "node server.js"`
  > - **Evidence**: `package.json` contains scripts `dev:web`, `build:web`, `start`, `test`, `smoke`.
  ```

---

## 3. Pre-Documentation Code Inspection Checklist

Before writing or editing any documentation, verify:

1. **Scripts**: Check `package.json` `"scripts"` section directly.
2. **Environment Variables**: Check `.env.example`, `src/env.js`, and `process.env` references.
3. **Endpoints**: Check `server.js` and `src/server/routes/*.js`.
4. **Providers**: Check `src/sources/` and root provider files (`src/doujindesu.js`, `src/nekopoi.js`, `src/hentaitv.js`, `src/eporner.js`).
5. **Tests**: Check `test/` directory to verify actual tested capabilities.
