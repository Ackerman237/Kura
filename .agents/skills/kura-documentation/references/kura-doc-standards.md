# Kura Documentation Standards & Templates

This reference establishes standards and templates for Kura README files, API references, provider docs, and release notes.

*Primary sources: JayRHa `readme-generator/SKILL.md`, `changelog-keeper/SKILL.md`, mblode `ghostwriter/SKILL.md`.*

---

## 1. Kura `README.md` Standard Structure

A compliant Kura README must contain:

1. **Title & Badge Header**: Repository name, one-line purpose, license, node version.
2. **Features**: Concrete capabilities backed by real modules (e.g. Manga Catalog, Video Streaming, Reader Engine, Multi-Provider Scraper).
3. **Prerequisites**: Node.js version (`>=18.17` from `package.json`), Docker (if `Dockerfile` present).
4. **Quickstart / Installation**:
   - `npm install`
   - `cp .env.example .env`
   - `npm run dev:web` (frontend) or `npm start` (full server)
5. **Environment Configuration**: Markdown table mapping every key from `.env.example` with description and default values.
6. **API Endpoints**: Summary table of routes verified in `server.js`.
7. **Supported Providers**: List of verified provider modules.
8. **Testing**: Concrete commands (`npm test`, `npm run smoke`).
9. **License**: GPL-3.0 (from `package.json` / `LICENSE`).

---

## 2. API Endpoint Documentation Template

```markdown
### `GET /api/doujindesu/search`

Searches manga and doujinshi on the Doujindesu provider.

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `q` | `string` | Yes | Search query term | `naruto` |
| `page` | `number` | No | Page number (default: `1`) | `2` |

**Example Response (`200 OK`)**:
```json
{
  "success": true,
  "provider": "doujindesu",
  "data": [
    {
      "id": "12345",
      "title": "Sample Manga Title",
      "cover": "https://...",
      "type": "manga"
    }
  ]
}
```
```

---

## 3. Changelog Format (`Keep a Changelog` standard)

```markdown
# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
### Added
- New provider module for Eporner video cataloging (`src/eporner.js`).

### Fixed
- Fixed SSRF vulnerability in media proxy redirect handler (`src/proxy.js`).

### Changed
- Refactored reader engine to decouple DOM state from image preloader (`useReaderEngine.js`).
```
