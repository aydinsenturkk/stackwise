# Frontend Error Handling

See error-handling in Layer 1 for universal error handling principles (logging, severity levels, privacy).

## Error Types

| Type       | Source                 | Handling Strategy    |
| ---------- | ---------------------- | -------------------- |
| Network    | API failures, timeouts | Retry, fallback UI   |
| Validation | User input             | Inline feedback      |
| Runtime    | Code bugs              | Error boundary       |
| Auth       | Session expired        | Redirect to login    |

---

## Error Boundaries

Error boundaries catch runtime errors in a component tree and display a fallback UI instead of crashing the entire application.

### Placement Strategy

| Location      | Purpose                  |
| ------------- | ------------------------ |
| App root      | Catch-all fallback       |
| Route level   | Page-specific recovery   |
| Feature level | Isolate feature failures |
| Widget level  | Non-critical components  |

### Rules

- Wrap independent features in separate error boundaries
- Provide meaningful fallback UI (not a blank screen)
- Log errors for debugging and monitoring
- Do not catch errors that can be handled locally by the component

---

## User Feedback

### Error Messages

| Do                         | Don't             |
| -------------------------- | ----------------- |
| Clear, actionable language | Technical jargon  |
| Explain what went wrong    | "Error 500"       |
| Suggest next steps         | Leave user stuck  |
| Translate error messages   | Hardcoded strings |

### Examples

| Bad                 | Good                                                  |
| ------------------- | ----------------------------------------------------- |
| "Error: 404"        | "Page not found. Check the URL or go home."           |
| "Network error"     | "Connection lost. Check your internet and try again." |
| "Validation failed" | "Email format is invalid."                            |

---

## API Error Handling

### Response Handling by Status Code

| Status Code | Action                        |
| ----------- | ----------------------------- |
| 400         | Show validation errors inline |
| 401         | Redirect to login             |
| 403         | Show permission denied        |
| 404         | Show not found page           |
| 429         | Show rate limit message       |
| 500+        | Show generic error + retry    |

---

## Retry Strategies

| Strategy            | Use Case              |
| ------------------- | --------------------- |
| Immediate retry     | Transient failures    |
| Exponential backoff | Rate limiting         |
| User-triggered      | After error displayed |
| No retry            | Client errors (4xx)   |

---

## Form Errors

| Requirement         | Implementation              |
| ------------------- | --------------------------- |
| Show inline         | Next to the field           |
| Show on blur/submit | Not while user is typing    |
| Clear on fix        | When field becomes valid    |
| Announce to SR      | Use `aria-describedby`      |
| Focus first error   | On submit failure           |

---

## Recovery Patterns

| Pattern      | When                  |
| ------------ | --------------------- |
| Retry button | Network failures      |
| Refresh page | State corruption      |
| Fallback UI  | Non-critical features |
| Cached data  | Offline mode          |
| Redirect     | Auth failures         |

---

## Principles

- **Fail gracefully**: Never show a blank screen
- **Be helpful**: Tell the user what to do next
- **Isolate failures**: One feature crash does not crash the whole app
- **Log everything**: Enable debugging of production issues
- **Respect privacy**: Never log sensitive data (see error-handling in Layer 1)
