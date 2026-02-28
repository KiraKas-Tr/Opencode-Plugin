---
name: cloudflare
description: Use when deploying to Cloudflare Workers, managing Pages projects, using storage (KV, D1, R2), or configuring Cloudflare infrastructure.
---

# Cloudflare Skill

Comprehensive Cloudflare platform skill covering Workers, Pages, storage services (KV, D1, R2), AI services (Workers AI, Vectorize), and infrastructure-as-code management.

## Capabilities

- **Workers**: Deploy, manage, debug serverless functions
- **Pages**: Static site deployment with functions
- **KV Storage**: Key-value data operations
- **D1 Database**: SQLite at the edge
- **R2 Storage**: Object storage (S3-compatible)
- **Workers AI**: Run ML models at the edge
- **Vectorize**: Vector database for embeddings
- **Infrastructure-as-Code**: Wrangler configuration

## When to Use

- Deploying serverless functions to the edge
- Setting up static sites with edge functions
- Managing edge storage (KV, D1, R2)
- Running AI models at the edge
- Building real-time applications
- Configuring Cloudflare infrastructure

## Key Tools

- `worker_deploy`: Deploy Worker script
- `pages_deploy`: Deploy Pages project
- `kv_get/set/delete`: KV namespace operations
- `d1_query`: Execute D1 SQL queries
- `r2_upload/download`: R2 object operations
- `ai_run`: Execute Workers AI models
- `vectorize_query`: Vector similarity search

## Example Usage

```
// Deploy worker
worker_deploy({
  name: "api-proxy",
  script: "./workers/proxy.ts",
  compatibility_date: "2024-01-01"
})

// KV operations
kv_set({
  namespace: "cache",
  key: "user:123",
  value: { name: "Alice", role: "admin" }
})

// D1 query
d1_query({
  database: "app-db",
  sql: "SELECT * FROM products WHERE category = ?",
  params: ["electronics"]
})

// Workers AI
ai_run({
  model: "@cf/meta/llama-2-7b-chat-int8",
  prompt: "Explain edge computing"
})
```

## Wrangler Configuration

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "CACHE"
id = "abc123"

[[d1_databases]]
binding = "DB"
database_name = "app-db"

[ai]
binding = "AI"
```

## Notes

- Requires Cloudflare API token
- Supports wrangler CLI integration
- Free tier available for most services
- Global edge network deployment
