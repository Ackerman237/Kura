# Verified Sources & Authority Mapping: Kura Documentation

This document records the exact, verified human-authored references used as the foundation for `kura-documentation`. No documentation methodologies, rules, or standards were invented.

---

## 1. Verified Sources Table

| Topic | Source | Exact URL | File/Path | What was verified | Used for |
|---|---|---|---|---|---|
| **Technical Writing & Diataxis Framework** | AgentSkills (JayRHa) | `https://github.com/JayRHa/AgentSkills` | `technical-writer/SKILL.md` | Diataxis 4-quadrant model (Tutorial, How-To, Reference, Explanation), plain language quick rules (active voice, short sentences, concrete runnable examples), information architecture, and pre-writing reader analysis. | Document type classification, structure, and information architecture for Kura technical docs. |
| **README Generation & Verification** | AgentSkills (JayRHa) | `https://github.com/JayRHa/AgentSkills` | `readme-generator/SKILL.md` | Project-manifest analysis (`package.json`), prerequisite verification, runnable quickstart commands, environment variable listing, and badge formatting. | Reviewing, updating, and verifying Kura `README.md` accuracy against code. |
| **Truthful Writing & Anti-Hallucination** | mblode Agent Skills | `https://github.com/mblode/agent-skills` | `skills/ghostwriter/SKILL.md`, `README.md` | "Write the shortest true version", eliminating machine filler, keeping every supplied fact/link in place without adding unverified claims, and using verified evidence. | Enforcing strict factual fidelity and eliminating invented parameters or commands. |
| **Skill Structure & Anatomy Specification** | Skill Anatomy (ravidsrk) | `https://github.com/ravidsrk/agent-skills/blob/main/docs/skill-anatomy.md` | `docs/skill-anatomy.md` | Structural specification for Agent Skills open format (`SKILL.md`, `README.md`, `references/`, `tests/`), required frontmatter fields (`name`, `description`, `license`, `compatibility`), and capability patterns. | Directory structure and manifest compliance for `kura-documentation`. |
| **Skill Lifecycle & Validation Workflow** | Agent Skills Creator (mblode) | `https://github.com/mblode/agent-skills/blob/main/skills/agent-skills-creator/SKILL.md` | `skills/agent-skills-creator/SKILL.md` | 8-step skill creation and audit workflow, validation gates, IS/IS-NOT boundary definitions, and trigger optimization. | Organizing the documentation workflow and review checkpoints. |

---

## 2. Source Authority Levels

1. **Industry Documentation Frameworks**:
   - Diataxis Framework (Daniele Procida / Divio standard for technical documentation) via `JayRHa/AgentSkills`.
2. **Community Best Practices**:
   - Technical writer plain-language standards and README generators (`JayRHa/AgentSkills`, `mblode/agent-skills`).
3. **Kura-Specific Project Documentation Decisions**:
   - Documentation must always reflect actual Node.js scripts in `package.json` and environment variables in `.env.example`.
   - Any gap between code and documentation must be explicitly flagged with discrepancy tags rather than smoothed over.

---

## 3. Discrepancy & Verification Notes

- **mblode `docs-writing`**: In the latest `mblode/agent-skills` repository state, `skills/docs-writing/SKILL.md` was reorganized into `skills/ghostwriter/SKILL.md` (which handles technical docs, READMEs, PRDs, and text fidelity). Verified live via raw fetch.
- **JayRHa `AgentSkills`**: Skills live as top-level directories in the repository (`technical-writer/SKILL.md`, `readme-generator/SKILL.md`). Verified live via raw fetch.
