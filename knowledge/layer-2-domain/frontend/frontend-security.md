# Frontend Security

See security-fundamentals in Layer 1 for universal security principles.

## Trust Boundaries

| Layer              | Responsibility                          |
| ------------------ | --------------------------------------- |
| Backend/Middleware | **Enforce** security (required)         |
| Frontend           | **Trust** the platform (no enforcement) |

The frontend never enforces security. All security decisions are made server-side. The frontend displays the results of those decisions as a UX convenience.

---

## Frontend Rules

### What the Frontend Does

- Trust that middleware has already checked authentication and authorization
- Show/hide UI elements based on permissions (this is UX, not security)
- Provide client-side input validation (this is UX, not security)
- Display appropriate error states for unauthorized actions

### What the Frontend Never Does

- Enforce security rules in client code
- Perform redundant authentication checks
- Store secrets, API keys, or tokens in client-accessible code
- Rely on client-side validation as a security measure

---

## Input Validation

| Layer       | Purpose                    |
| ----------- | -------------------------- |
| Client-side | Fast feedback (UX only)    |
| Server-side | Security (always required) |

Client-side validation exists purely for user experience. It can always be bypassed. **All inputs must be validated server-side.**

---

## UI Permissions

Showing or hiding UI elements based on user roles is a **UX pattern**, not a security measure.

| Scenario                     | Frontend Action                 | Security Enforcement      |
| ---------------------------- | ------------------------------- | ------------------------- |
| User lacks edit permission   | Hide or disable edit button     | API rejects unauthorized  |
| User lacks admin access      | Don't render admin navigation   | Routes return 403         |
| Feature flag is off          | Don't render feature UI         | API rejects feature calls |

A determined user can always modify the client. The backend must reject unauthorized requests regardless of what the frontend shows.

---

## Anti-Patterns

| Anti-Pattern          | Problem                             | Solution                     |
| --------------------- | ----------------------------------- | ---------------------------- |
| Client-side security  | User can modify client state        | Enforce in backend only      |
| Trusting client input | Client validation can be bypassed   | Always validate server-side  |
| Secrets in client     | API keys exposed in browser console | Use server-side proxying     |
| Redundant auth checks | Dead code, middleware handles it     | Trust middleware, remove code |

---

## Principles

- **Backend enforces**: All security decisions live in backend/middleware
- **Frontend trusts**: Do not duplicate server-side checks in client code
- **Validate server-side**: Never rely on client input validation for security
- **No secrets in client**: Never expose keys, tokens, or credentials in client code
- **UI permissions are UX**: Hiding a button is not a security control
