import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = require("pg");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Configure DATABASE_URL com o PostgreSQL exclusivo do TCC.");

const db = new Pool({ connectionString: url, connectionTimeoutMillis: 10000 });
try {
  const { rows } = await db.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  const expected = ["users", "auth_sessions", "products", "stock_movements"];
  if (rows.length === 0) {
    const result = spawnSync(
      "pnpm",
      ["--filter", "@workspace/db", "run", "push"],
      { stdio: "inherit" },
    );
    if (result.error || result.status !== 0) {
      throw new Error("Não foi possível criar as tabelas do TCC.");
    }
  } else if (!expected.every((table) => rows.some((row) => row.tablename === table))) {
    throw new Error("O banco contém tabelas, mas o esquema do TCC está incompleto.");
  }
} finally {
  await db.end();
}
