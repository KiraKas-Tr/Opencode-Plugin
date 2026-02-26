# PRD Template

Use this template when creating Product Requirements Documents.

**Output path:** `.opencode/memory/prds/YYYY-MM-DD-<feature>.md`

---

```markdown
# PRD: [Feature/Product Name]

**Version:** 1.0
**Date:** YYYY-MM-DD
**Author:** [Name]
**Status:** Draft | In Review | Approved
**Bead-ID:** [ID]

---

## 1. Overview

### 1.1 Problem Statement
[Clear description of the problem we're solving]

### 1.2 Vision
[What the world looks like when this is solved]

### 1.3 Goals
| Goal | Metric | Target |
|------|--------|--------|
| [Goal 1] | [Metric] | [Target] |

### 1.4 Non-Goals
- [What we're explicitly NOT doing]

---

## 2. Users & Personas

### 2.1 Target Users
| Persona | Description | Pain Points |
|---------|-------------|-------------|
| [Persona 1] | [Description] | [Pain points] |

### 2.2 User Stories
| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-01 | [user] | [action] | [benefit] | P0 |

---

## 3. Requirements

### 3.1 Functional Requirements

#### P0 — Must Have
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01 | [Requirement] | [Criteria] |

#### P1 — Should Have
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|

#### P2 — Nice to Have
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|

### 3.2 Non-Functional Requirements
| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | [Requirement] | [Target] |
| Security | [Requirement] | [Target] |
| Scalability | [Requirement] | [Target] |

---

## 4. Design

### 4.1 User Interface
[Wireframes, mockups, or descriptions]

### 4.2 Information Architecture
[Structure diagram]

### 4.3 API Design (if applicable)
| Endpoint | Method | Description |
|----------|--------|-------------|

---

## 5. Technical Considerations

### 5.1 Architecture
[High-level technical approach]

### 5.2 Dependencies
| Dependency | Type | Risk |
|------------|------|------|

### 5.3 Security Considerations
- [Security concern and mitigation]

---

## 6. Timeline & Milestones

| Phase | Scope | Duration | Date |
|-------|-------|----------|------|
| Phase 1 | [MVP] | [X weeks] | [Date] |

**Milestones:**
- [ ] PRD Approved
- [ ] Design Complete
- [ ] Development Complete
- [ ] Launch

---

## 7. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| [Metric 1] | [Baseline] | [Goal] | [How] |

---

## 8. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | L/M/H | L/M/H | [Mitigation] |

---

## 9. Open Questions

- [ ] [Question 1]

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | [Name] | Initial draft |
```
