import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const dataDir = resolve(process.cwd(), ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
});

const isInitialised = existsSync(resolve(dataDir, "PG_VERSION"));

if (!isInitialised) {
  console.log("Ініціалізація PostgreSQL у .pgdata ...");
  await pg.initialise();
}

await pg.start();

const client = pg.getPgClient();
await client.connect();
const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = 'lumi'");
if (rows.length === 0) {
  await client.query("CREATE DATABASE lumi");
  console.log("Базу даних 'lumi' створено.");
}
await client.end();

console.log("PostgreSQL запущено на порту 5433 (postgres/postgres, БД: lumi).");
console.log("Натисніть Ctrl+C, щоб зупинити.");

const stop = async () => {
  console.log("\nЗупинка PostgreSQL ...");
  await pg.stop();
  process.exit(0);
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
