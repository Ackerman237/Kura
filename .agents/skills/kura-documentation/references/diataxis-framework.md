# Diataxis Documentation Framework for Kura

This reference specifies the Diataxis documentation architecture adopted from `JayRHa/AgentSkills` (`technical-writer/SKILL.md`).

---

## 1. The Four Diataxis Document Quadrants

```
                 Practical (Learning)        Theoretical (Understanding)
               ┌───────────────────────────┬───────────────────────────┐
Task-Oriented  │   HOW-TO GUIDES           │   EXPLANATIONS            │
               │   "How do I add a new     │   "Why does Kura use a    │
               │    scraper provider?"     │    custom media proxy?"   │
               ├───────────────────────────┼───────────────────────────┤
Learning-      │   TUTORIALS               │   REFERENCES              │
Oriented       │   "Getting Started: Run   │   "Provider API Endpoints │
               │    Kura locally"          │    & Environment Config"  │
               └───────────────────────────┴───────────────────────────┘
```

| Document Type | Primary Reader Question | Goal & Content Focus | Kura Application |
|---|---|---|---|
| **Tutorial** | "I am new, guide me step-by-step" | Learning by doing; guaranteed first success path. | `docs/getting-started.md` (Clone, install, run `dev:web`, browse). |
| **How-To Guide** | "I have a specific goal, tell me the steps" | Direct steps to solve a real task; assumes basic proficiency. | `docs/guides/add-provider.md` (Steps to implement a new scraper). |
| **Reference** | "I need exact specifications and details" | Comprehensive, accurate, structured lookup tables. | `docs/api-reference.md`, `docs/environment-variables.md`. |
| **Explanation** | "I want to understand why/how this is designed" | Architecture context, trade-offs, rationale behind design decisions. | `docs/architecture/proxy-design.md`, `docs/adr/`. |

---

## 2. Separation of Concerns in Documentation

1. **Do Not Mix Types**:
   - Never bury theoretical architecture essays inside step-by-step How-To guides.
   - Never omit concrete runnable commands from Tutorials.
   - Never turn Reference documentation into narrative explanations.
2. **Bottom Line Up Front (BLUF)**:
   - Lead each document or section with the core conclusion or command, followed by supporting options and details.
