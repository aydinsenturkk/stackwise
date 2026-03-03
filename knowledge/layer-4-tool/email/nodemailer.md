# Nodemailer

## Transporter Creation

### SMTP

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
await transporter.verify();
console.log("SMTP connection verified");
```

### Common Providers

```typescript
// Gmail (requires App Password)
const gmail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// AWS SES
const ses = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS,
  },
});
```

### Sendmail Transport

```typescript
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: "unix",
  path: "/usr/sbin/sendmail",
});
```

---

## Sending Mail

```typescript
const info = await transporter.sendMail({
  from: '"App Name" <noreply@example.com>',
  to: "user@example.com",
  cc: "cc@example.com",
  bcc: "bcc@example.com",
  replyTo: "support@example.com",
  subject: "Welcome to Our App",
  text: "Hello, welcome to our platform!",
  html: "<h1>Hello</h1><p>Welcome to our platform!</p>",
});

console.log("Message sent:", info.messageId);
```

### Multiple Recipients

```typescript
await transporter.sendMail({
  from: "noreply@example.com",
  to: "user1@example.com, user2@example.com",
  // or as array
  to: ["user1@example.com", "user2@example.com"],
  subject: "Team update",
  text: "Important announcement",
});
```

---

## HTML Emails

```typescript
await transporter.sendMail({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Order Confirmation",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h1 style="color: #333;">Order Confirmed</h1>
      <p>Hi ${name},</p>
      <p>Your order <strong>#${orderId}</strong> has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">Item</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item}</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Total</td>
          <td style="padding: 8px;"><strong>$${total}</strong></td>
        </tr>
      </table>
    </div>
  `,
  // Fallback for clients that don't render HTML
  text: `Order #${orderId} confirmed. Total: $${total}`,
});
```

---

## Attachments

```typescript
await transporter.sendMail({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Your Invoice",
  text: "Please find your invoice attached.",
  attachments: [
    // File from disk
    {
      filename: "invoice.pdf",
      path: "/path/to/invoice.pdf",
    },
    // Buffer
    {
      filename: "data.csv",
      content: Buffer.from("Name,Email\nJohn,john@example.com"),
    },
    // String content
    {
      filename: "readme.txt",
      content: "This is a text file.",
    },
    // URL (fetched on send)
    {
      filename: "logo.png",
      path: "https://example.com/logo.png",
    },
    // Inline image (referenced in HTML via cid)
    {
      filename: "logo.png",
      path: "/path/to/logo.png",
      cid: "logo@company",
    },
  ],
  html: '<p>See our logo: <img src="cid:logo@company" /></p>',
});
```

---

## Template Pattern

```typescript
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function welcomeEmail(name: string, verifyUrl: string): EmailTemplate {
  return {
    subject: `Welcome, ${name}!`,
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Please verify your email:</p>
      <a href="${verifyUrl}">Verify Email</a>
    `,
    text: `Welcome, ${name}! Verify your email: ${verifyUrl}`,
  };
}

// Usage
const template = welcomeEmail("John", "https://app.com/verify?token=abc");
await transporter.sendMail({
  from: "noreply@example.com",
  to: "john@example.com",
  ...template,
});
```

---

## OAuth2

```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_USER,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    accessToken: process.env.OAUTH_ACCESS_TOKEN,
  },
});
```

---

## Connection Pooling

```typescript
const transporter = nodemailer.createTransport({
  pool: true,
  host: "smtp.example.com",
  port: 465,
  secure: true,
  maxConnections: 5,
  maxMessages: 100, // Messages per connection before reconnecting
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Pull-based sending with idle event
transporter.on("idle", async () => {
  while (transporter.isIdle()) {
    const message = await getNextFromQueue();
    if (!message) break;
    await transporter.sendMail(message);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  transporter.close();
});
```

---

## Error Handling

```typescript
try {
  const info = await transporter.sendMail(message);
  console.log("Sent:", info.messageId);
} catch (error) {
  if (error.responseCode === 550) {
    console.error("Recipient rejected:", error.message);
  } else if (error.code === "ECONNREFUSED") {
    console.error("SMTP connection refused");
  } else if (error.code === "EAUTH") {
    console.error("Authentication failed:", error.message);
  } else {
    console.error("Send failed:", error);
  }
}

// Retry pattern for transient errors
async function sendWithRetry(
  transporter: nodemailer.Transporter,
  message: nodemailer.SendMailOptions,
  maxRetries = 3,
): Promise<nodemailer.SentMessageInfo> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await transporter.sendMail(message);
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      if (error.responseCode >= 400 && error.responseCode < 500) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Unreachable");
}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Creating transporter per email | Wasted TCP/TLS handshakes | Create one transporter, reuse it (use `pool: true`) |
| Hardcoding SMTP credentials | Security risk in version control | Use environment variables |
| No `text` fallback for HTML emails | Some clients cannot render HTML | Always provide both `html` and `text` |
| Not calling `verify()` on startup | Silent SMTP misconfiguration | Verify connection on app start |
| Sending bulk email without pooling | Connection limits and timeouts | Enable `pool: true` for bulk sending |
| No error handling on `sendMail` | Crashes on transient failures | Wrap in try/catch with retry logic |
| Inline CSS in shared templates | Inconsistent rendering across clients | Use inline styles directly on elements |
| Not setting `replyTo` | Replies go to `from` address (often noreply) | Set `replyTo` to a monitored address |
