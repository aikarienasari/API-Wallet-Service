const express = require("express");
require("dotenv").config();
const cors = require("cors");

// Inisialisasi Express
const app = express();

// Middleware
app.use(express.json()); // Agar bisa membaca JSON dari request body
app.use(cors()); // Mengizinkan akses dari frontend

// Debugging Middleware (Melihat request masuk)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
    next();
});

// Cek apakah .env terbaca dengan benar
console.log("Server sedang berjalan dengan konfigurasi:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("PORT:", process.env.PORT || 5000);

// Routes
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/transfers", require("./routes/transferRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/wallets", require("./routes/walletRoutes"));

// Middleware Global untuk Menangani Error
app.use((err, req, res, next) => {
    console.error("ERROR:", err.stack);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: err.message });
});

// Export app agar bisa dipakai di `index.js`
module.exports = app;
