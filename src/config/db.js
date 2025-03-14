require("dotenv").config();
const mysql = require("mysql2/promise");

// Cek apakah variabel environment terbaca dengan benar
console.log("🔍 Database Config:");
console.log("   🔹 DB_HOST:", process.env.DB_HOST || "localhost");
console.log("   🔹 DB_USER:", process.env.DB_USER || "root");
console.log("   🔹 DB_NAME:", process.env.DB_NAME || "wallet_services");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wallet_services",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Coba koneksi ke database
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database terkoneksi ke:", process.env.DB_NAME || "wallet_services");
        connection.release();
    } catch (err) {
        console.error("❌ Koneksi database gagal:", err.message);
    }
})();

module.exports = pool;
