import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }, // Required for Render PostgreSQL
});

pool.connect()
    .then(() => console.log("✅ PostgreSQL Connected Successfully"))
    .catch(err => console.error("❌ PostgreSQL Connection Error:", err.message));

export default pool;
