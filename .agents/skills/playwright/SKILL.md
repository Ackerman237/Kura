---
name: playwright
description: >-
  Operate Playwright for browser automation, E2E testing, network interception/mocking, accessibility snapshots, and headless web scraping. Use when driving headless browsers, authoring/fixing Playwright specs, or capturing live DOM/network evidence.
license: MIT
compatibility: Playwright, Node.js >= 18.
metadata:
  version: "1.0.0"
  author: "magnus919 / adapted project-locally"
---

# Playwright Browser Automation Skill

This skill owns the **operation of the Playwright tool** itself for browser automation, testing, and scraping.

## Ownership & Boundaries
- **IS**: Driving browsers, managing browser contexts, authoring robust user-facing locators (`getByRole`, `getByLabel`), intercepting/mocking network traffic (`page.route()`), and running headless extraction loops (`extract -> validate -> save`).
- **IS NOT**: Test strategy and quality gates (delegate to `qa-methodology`), Kura scraper domain review (delegate to `kura-scraper-review`), or UI design critique (delegate to `kura-ui-ux-review`).

## Operating Principles
1. **Locate by Behavior**: Prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`) over brittle CSS/XPath.
2. **Mock at the Boundary**: Stub external HTTP at `page.route()`, never by patching application code.
3. **Isolate Contexts**: Keep each test or scraping task in an isolated browser context without shared globals.
