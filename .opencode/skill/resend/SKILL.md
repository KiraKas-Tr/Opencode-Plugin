---
name: resend
description: Use when sending transactional emails, receiving inbound emails, creating email templates with React Email, or handling email webhooks.
---

# Resend Skill

Comprehensive Resend email platform integration for transactional emails, inbound email handling, template management with React Email, and webhook processing.

## Capabilities

- **Send Emails**: Transactional and bulk email sending
- **Inbound Email**: Receive and process incoming emails
- **React Email Templates**: Create emails with React components
- **Webhook Handling**: Process email events (delivered, opened, bounced)
- **Domain Management**: Configure sending domains and DNS
- **Analytics**: Track email delivery and engagement metrics

## When to Use

- Sending transactional emails (password resets, notifications)
- Building email templates with React
- Receiving and processing inbound emails
- Setting up email webhooks
- Managing sending domains
- Implementing email workflows

## Key Tools

- `send_email`: Send single or batch emails
- `create_template`: Create React Email templates
- `get_inbound`: Retrieve inbound emails
- `list_domains`: Manage sending domains
- `get_events`: Query email events
- `create_webhook`: Set up event webhooks

## Example Usage

```
// Send email
send_email({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome aboard!</h1>",
  from: "noreply@myapp.com"
})

// React Email template
create_template({
  name: "password-reset",
  component: "./emails/PasswordReset.tsx"
})

// Handle inbound
get_inbound({
  limit: 10,
  status: "unread"
})
```

## React Email Integration

```tsx
// emails/Welcome.tsx
import { Html, Body, Container, Text } from '@react-email/components';

export default function Welcome({ name }) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>Welcome, {name}!</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

## Notes

- Requires Resend API key
- Domain verification needed for sending
- Supports attachments up to 40MB
- Rate limits apply based on plan
