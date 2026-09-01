---
name: Inventory app validation
description: Environment-specific validation notes for the inventory web application.
---

The OpenAPI client generator must target the Zod major version already installed in the workspace; generated schemas can otherwise use APIs unavailable to the project.

**Why:** A generated schema API mismatch caused the first client generation to fail, while the application itself remained on the workspace's existing Zod version.

**How to apply:** Before regenerating API clients, inspect the installed Zod major version and configure the generator explicitly. For standalone Vite production builds in this workspace, provide the required `PORT` environment variable even though the managed preview workflow supplies it automatically.