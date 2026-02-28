---
name: supabase
description: Use when working with Supabase databases, edge functions, authentication, real-time subscriptions, or managing Supabase projects.
---

# Supabase Skill

Comprehensive Supabase platform MCP covering database operations, edge functions, authentication, real-time features, development tools, debugging, and project management.

## Capabilities

- **Database Operations**: Query, migrate, manage PostgreSQL
- **Edge Functions**: Deploy, manage, debug serverless functions
- **Authentication**: User management, auth providers, JWT handling
- **Real-time**: Subscribe to database changes
- **Storage**: File upload, management, signed URLs
- **Development Tools**: Local development, type generation
- **Debugging**: Logs, metrics, query analysis

## When to Use

- Querying or modifying Supabase databases
- Deploying and managing edge functions
- Setting up authentication flows
- Generating TypeScript types from schema
- Debugging database queries and functions
- Managing Supabase projects

## Key Tools

- `query`: Execute SQL queries
- `migrate`: Run database migrations
- `deploy_function`: Deploy edge function
- `generate_types`: Generate TypeScript types
- `list_logs`: View function/database logs
- `manage_auth`: User operations

## Example Usage

```
// Query database
query({
  sql: "SELECT * FROM users WHERE active = true LIMIT 10"
})

// Deploy edge function
deploy_function({
  name: "send-notification",
  entrypoint: "./functions/send-notification/index.ts"
})

// Generate types
generate_types({
  output: "./src/types/supabase.ts"
})

// Auth operations
manage_auth({
  action: "create_user",
  email: "user@example.com",
  password: "secure123"
})
```

## Development Workflow

```bash
# Local development
supabase start          # Start local stack
supabase db reset       # Reset with migrations
supabase functions serve # Local function dev
supabase types gen      # Generate types
```

## Notes

- Requires Supabase project credentials
- Supports both local and remote projects
- Row Level Security policies respected
- Connection pooling for serverless
