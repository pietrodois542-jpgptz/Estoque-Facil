---
name: Drizzle PostgreSQL error causes
description: How to inspect PostgreSQL constraint errors wrapped by Drizzle.
---

When mapping PostgreSQL errors from Drizzle's Node driver, inspect the underlying `cause` chain for SQLSTATE codes instead of checking only the outer error.

**Why:** A duplicate-email insert was wrapped by Drizzle, so checking only the top-level error code turned a normal uniqueness conflict into a 500 response.

**How to apply:** For API endpoints that convert database constraint failures into client responses, traverse a short, bounded `cause` chain and map known SQLSTATEs explicitly.
