# Code Review Standards

## Review Methodology

### Step 1: Understand the Context

- Read the PR description and linked issue
- Understand what problem is being solved
- Check the scope: is it focused on one concern?

### Step 2: Check Against Standards

For each changed file, evaluate against applicable rules:

| Area           | What to Look For                                           |
| -------------- | ---------------------------------------------------------- |
| Architecture   | Wrong layer dependencies, misplaced logic                  |
| Security       | Injection, XSS, missing auth, exposed secrets              |
| Naming         | Convention violations, unclear names                        |
| Anti-Patterns  | God objects, feature coupling, magic values                 |
| Error Handling | Missing handling, inconsistent format, sensitive data logged|
| Validation     | Missing or inadequate input validation                      |
| Performance    | N+1 queries, unnecessary computation                       |
| Type Safety    | `any` usage, missing types, unsafe casts                   |
| Testing        | Untested business logic, missing edge cases                 |

### Step 3: Classify Findings

Every finding gets a severity level.

---

## Severity Definitions

| Severity       | Meaning                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **CRITICAL**   | Security vulnerabilities, data loss risks, breaking changes, architectural violations that cause runtime errors |
| **WARNING**    | Anti-patterns, performance issues, missing validation, code that works but violates standards     |
| **SUGGESTION** | Style improvements, naming tweaks, optional optimizations, better patterns that could be used     |

---

## Review Output Format

Findings are grouped by file, then by severity:

```
## Code Review Summary

**Files reviewed:** <count>
**Findings:** <count by severity>

---

### <file-path>

#### CRITICAL
- **[Rule: <rule-name>]** <description of the issue>
  - Line(s): <line numbers>
  - Fix: <suggested fix>

#### WARNING
- **[Rule: <rule-name>]** <description of the issue>
  - Line(s): <line numbers>
  - Fix: <suggested fix>

#### SUGGESTION
- **[Rule: <rule-name>]** <description of the issue>
  - Line(s): <line numbers>
  - Fix: <suggested fix>
```

---

## Review Checklist

### Always Check

| Category        | Question                                       |
| --------------- | ---------------------------------------------- |
| **Correctness** | Does the code do what it claims to do?         |
| **Security**    | Are there injection, XSS, or auth issues?      |
| **Architecture**| Does it follow layer boundaries?               |
| **Types**       | Is type safety maintained (no `any`)?          |
| **Errors**      | Are errors handled and logged properly?        |
| **Naming**      | Are names clear and consistent?                |
| **Tests**       | Is new business logic tested?                  |

### Context-Dependent

| Category         | Question                                      |
| ---------------- | --------------------------------------------- |
| **Performance**  | Are there obvious bottlenecks?                |
| **Validation**   | Are inputs validated at system boundaries?    |
| **Dependencies** | Are imports following module boundaries?      |
| **Documentation**| Is complex logic explained with comments?     |

---

## Merge Readiness

A change is ready to merge when:

- Zero CRITICAL findings
- All WARNING findings are either resolved or acknowledged with justification
- Tests pass
- No regression in existing functionality

---

## Review Etiquette

| Do                                | Don't                             |
| --------------------------------- | --------------------------------- |
| Be specific with feedback         | Leave vague comments              |
| Suggest a fix, not just a problem | Only point out what's wrong       |
| Praise good code                  | Only focus on negatives           |
| Ask questions when unsure         | Assume intent                     |
| Focus on the code, not the person | Make personal criticisms          |
| Reference project rules           | Rely on personal preference only  |

---

## Principles

- **Rules as Checklist**: Use project rules to review systematically
- **Severity Matters**: Classify findings to prioritize fixes
- **Suggest, Don't Demand**: Provide alternatives alongside criticism
- **Focus on Risk**: Prioritize security and correctness over style
- **Be Constructive**: Every critique should include a path forward
