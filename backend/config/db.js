import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const {Pool} = pg;
const pool = new Pool({
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
})

export default pool;
