# @nestjs-modules/mailer

## Module Setup

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get("SMTP_HOST"),
          port: config.get("SMTP_PORT"),
          secure: config.get("SMTP_SECURE") === "true",
          auth: {
            user: config.get("SMTP_USER"),
            pass: config.get("SMTP_PASS"),
          },
        },
        defaults: {
          from: '"App Name" <noreply@example.com>',
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
})
export class AppModule {}
```

---

## Template Structure

```
src/
  templates/
    welcome.hbs
    reset-password.hbs
    order-confirmation.hbs
    layouts/
      main.hbs
    partials/
      header.hbs
      footer.hbs
```

### Handlebars Template Example

```handlebars
<!-- templates/welcome.hbs -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Welcome, {{name}}!</h1>
  <p>Thank you for joining our platform.</p>
  <p>Please verify your email by clicking the button below:</p>
  <a href="{{verifyUrl}}" style="
    display: inline-block;
    padding: 12px 24px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  ">
    Verify Email
  </a>
  {{#if expiresIn}}
    <p style="color: #666; font-size: 12px;">
      This link expires in {{expiresIn}} hours.
    </p>
  {{/if}}
</div>
```

---

## Mail Service

```typescript
// mail/mail.service.ts
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcome(email: string, name: string, verifyUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Welcome, ${name}!`,
      template: "welcome",
      context: {
        name,
        verifyUrl,
        expiresIn: 24,
      },
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Password Reset Request",
      template: "reset-password",
      context: {
        resetUrl,
        expiresIn: 1,
      },
    });
  }

  async sendOrderConfirmation(
    email: string,
    order: { id: string; items: Array<{ name: string; price: number }> },
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order #${order.id} Confirmed`,
      template: "order-confirmation",
      context: {
        orderId: order.id,
        items: order.items,
        total: order.items.reduce((sum, item) => sum + item.price, 0),
      },
    });
  }
}
```

---

## Mail Module

```typescript
// mail/mail.module.ts
import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

---

## Attachments

```typescript
await this.mailerService.sendMail({
  to: email,
  subject: "Your Invoice",
  template: "invoice",
  context: { invoiceId, total },
  attachments: [
    {
      filename: `invoice-${invoiceId}.pdf`,
      path: `/tmp/invoices/${invoiceId}.pdf`,
    },
    {
      filename: "logo.png",
      path: join(__dirname, "assets/logo.png"),
      cid: "logo",
    },
  ],
});
```

---

## Queue Integration (BullMQ)

```typescript
// mail/mail.processor.ts
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { MailService } from "./mail.service";

@Processor("mail")
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case "welcome":
        await this.mailService.sendWelcome(
          job.data.email,
          job.data.name,
          job.data.verifyUrl,
        );
        break;
      case "password-reset":
        await this.mailService.sendPasswordReset(
          job.data.email,
          job.data.resetUrl,
        );
        break;
    }
  }
}

// Usage in another service
@Injectable()
export class AuthService {
  constructor(@InjectQueue("mail") private mailQueue: Queue) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.create(dto);
    await this.mailQueue.add("welcome", {
      email: user.email,
      name: user.name,
      verifyUrl: `https://app.com/verify?token=${user.verifyToken}`,
    });
    return user;
  }
}
```

---

## Testing

```typescript
// mail/mail.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { MailerService } from "@nestjs-modules/mailer";
import { MailService } from "./mail.service";

describe("MailService", () => {
  let mailService: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
          },
        },
      ],
    }).compile();

    mailService = module.get(MailService);
    mailerService = module.get(MailerService);
  });

  it("should send welcome email with correct template and context", async () => {
    await mailService.sendWelcome(
      "john@example.com",
      "John",
      "https://app.com/verify?token=abc",
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: "john@example.com",
      subject: "Welcome, John!",
      template: "welcome",
      context: {
        name: "John",
        verifyUrl: "https://app.com/verify?token=abc",
        expiresIn: 24,
      },
    });
  });
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Sending emails synchronously in request handlers | Slow response times, risk of timeout | Use a queue (BullMQ) for async email delivery |
| Hardcoding SMTP config in module | Breaks across environments | Use `forRootAsync` with `ConfigService` |
| No template directory structure | Templates scattered, hard to maintain | Organize templates in a dedicated `templates/` dir |
| Not mocking `MailerService` in tests | Tests send real emails | Mock `MailerService` with `vi.fn()` |
| Injecting `MailerService` directly in controllers | Tight coupling, no abstraction | Wrap in a dedicated `MailService` |
| No error handling on `sendMail` | Silent failures, lost emails | Catch errors, log failures, implement retry |
| Templates with complex logic | Unmaintainable Handlebars templates | Prepare data in the service, keep templates simple |
| Not setting `defaults.from` | Must specify sender on every call | Set `defaults.from` in module config |
