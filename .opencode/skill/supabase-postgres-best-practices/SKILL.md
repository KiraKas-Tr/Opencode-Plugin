---
name: supabase-postgres-best-practices
description: Use when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations from Supabase.
---

# Supabase Postgres Best Practices Skill

You are running the **supabase-postgres-best-practices** skill. Postgres optimization from Supabase.

## Core Principles

Production-hardened patterns from Supabase's managed Postgres experience.

## Query Optimization

### 1. Index Strategy
```sql
-- Index for common query patterns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);

-- Partial index for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- GIN for JSONB and arrays
CREATE INDEX idx_metadata ON items USING GIN(metadata);
```

### 2. Query Patterns
```sql
-- Good: Sargable query
SELECT * FROM users WHERE email = 'user@example.com';

-- Avoid: Function on column prevents index usage
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Fix: Use functional index or normalize data
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

### 3. EXPLAIN ANALYZE
```sql
-- Always analyze slow queries
EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 123;

-- Look for:
-- - Seq Scan (should be Index Scan)
-- - High cost values
-- - Large row estimates vs actual
```

## Schema Design

### 1. Appropriate Types
```sql
-- Use appropriate types
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(), -- Not TIMESTAMP
  status TEXT,                          -- Not VARCHAR(n)
  metadata JSONB DEFAULT '{}'           -- Not JSON
);
```

### 2. Foreign Keys
```sql
-- Always index foreign keys
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id)
);
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

### 3. Partitioning
```sql
-- Partition large tables by time
CREATE TABLE events (
  id UUID,
  created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Connection Management

### 1. Connection Pooling
```javascript
// Use Supavisor or PgBouncer
// Transaction mode for serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 2. Prepared Statements
```sql
-- Use prepared statements for repeated queries
PREPARE get_user(UUID) AS
  SELECT * FROM users WHERE id = $1;

EXECUTE get_user('uuid-here');
```

## Performance Checklist

| Check | Why |
|-------|-----|
| Index foreign keys | Join performance |
| Use TIMESTAMPTZ | Timezone handling |
| Use JSONB not JSON | Binary format, indexing |
| Analyze slow queries | EXPLAIN ANALYZE |
| Limit connections | Prevent exhaustion |

## Common Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| SELECT * | Select only needed columns |
| N+1 queries | Use JOINs or batch fetch |
| Missing indexes | Add appropriate indexes |
| VARCHAR(n) | Use TEXT with CHECK constraint |
| TIMESTAMP | Use TIMESTAMPTZ |
| Unindexed JSON queries | Use GIN index |

## RLS (Row Level Security)

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy for user's own posts
CREATE POLICY "Users can manage own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Monitoring Queries

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Quick Reference

| Scenario | Solution |
|----------|----------|
| Slow reads | Add index, check EXPLAIN |
| Slow writes | Reduce indexes, batch inserts |
| Connection limits | Use pooling |
| Large tables | Partition by time |
| JSON queries | GIN index on JSONB |
