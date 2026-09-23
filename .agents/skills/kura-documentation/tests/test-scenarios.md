# Test Scenarios: Kura Documentation Skill

This document defines the 7 mandatory evaluation test scenarios used to validate that `kura-documentation` correctly identifies documentation discrepancies, missing variables, and unsupported claims without hallucinating.

---

## Scenario Matrix & Expected Detections

| # | Test Scenario | Simulated Discrepancy Condition | Expected Skill Audit Detection & Tag |
|---|---|---|---|
| **1** | **README Command Differs from `package.json`** | README claims to run `npm run serve:all`, but `package.json` only defines `"start": "node server.js"`. | **Detection**: Identifies non-existent script.<br>**Tag**: `DOCUMENTATION DISCREPANCY`.<br>**Evidence**: Compares `README.md` text against `package.json:scripts`. |
| **2** | **Environment Variable Missing** | Source code uses `process.env.PROXY_SECRET_KEY`, but variable is omitted from `.env.example` and docs. | **Detection**: Identifies undocumented secret.<br>**Tag**: `DOCUMENTATION DISCREPANCY` (Missing configuration).<br>**Evidence**: Scans `src/` for `process.env.*` and compares with `.env.example`. |
| **3** | **Undocumented Provider** | `src/eporner.js` and `src/sources/eporner/` exist in source code, but are not listed in README or provider list. | **Detection**: Identifies missing provider documentation.<br>**Tag**: `IMPLEMENTED / USAGE UNVERIFIED` or `DOCUMENTATION DISCREPANCY`.<br>**Evidence**: Discovers provider export in `package.json:exports` absent from docs. |
| **4** | **Undocumented API Endpoint** | `server.js` mounts route `app.use('/api/hentaitv', ...)`, but endpoint is missing from API reference. | **Detection**: Identifies unindexed API route.<br>**Tag**: `DOCUMENTATION DISCREPANCY`.<br>**Evidence**: Scans Express router declarations and flags missing route. |
| **5** | **Feature Claimed in README but Absent from Source** | README claims "Supports automatic PDF export of downloaded chapters", but no PDF library or logic exists. | **Detection**: Rejects unsupported documentation claim.<br>**Tag**: `UNVERIFIED`.<br>**Evidence**: Greps codebase for PDF dependencies; recommends removing or labeling as planned. |
| **6** | **Feature Exists in Source but Absent from README** | Privacy Mode with live cover blurring and peek functionality (`usePrivacyMode.js`) is implemented but unmentioned in README. | **Detection**: Highlights undocumented major capability.<br>**Tag**: `DOCUMENTATION DISCREPANCY` (Undocumented feature).<br>**Evidence**: Identifies implemented feature in `src/web/composables/usePrivacyMode.js`. |
| **7** | **Installation Instructions Outdated** | README mentions `node >= 14`, but `package.json:engines` mandates `node: ">=18.17"`. | **Detection**: Flags runtime version incompatibility.<br>**Tag**: `DOCUMENTATION DISCREPANCY`.<br>**Evidence**: Cites `package.json:engines.node` vs `README.md` prerequisite section. |
