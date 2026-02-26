---
name: polar
description: Use for Polar payment integration, subscriptions, license keys, and customer portal implementation.
---

# Polar Skill

You are running the **polar** skill. Polar payment platform integration.

## Capabilities

| Action | Description |
|--------|-------------|
| Create products | Define products, pricing, billing cycles |
| Implement checkout | Embedded checkout, custom flows |
| Manage subscriptions | Create, update, cancel, webhook handling |
| License keys | Generate, validate, manage keys |
| Customer portal | Self-service billing management |

## Usage

1. Configure Polar credentials in environment
2. Create or reference products in Polar dashboard
3. Implement checkout flow with webhooks
4. Handle subscription state in your app

## Key Integration Points

- Checkout: `POST /checkout/`
- Webhooks: subscription events, payment status
- License validation: server-side key verification
- Customer portal: embeddable billing UI

## Best Practices

- Always verify webhooks using signature validation
- Store Polar IDs, not email addresses, for user linking
- Handle all subscription states (active, past_due, canceled)
- Test with Polar sandbox before production
