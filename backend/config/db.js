import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const {Pool} = pg;
const useConnectionString = Boolean(process.env.DATABASE_URL);
const pool = new Pool({
    ...(useConnectionString ? {
        connectionString: process.env.DATABASE_URL,
    } : {
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
    }),
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});

pool.on("error", (error) => {
    console.error(JSON.stringify({ level: "error", type: "database_pool", message: error.message }));
});

export default pool;
