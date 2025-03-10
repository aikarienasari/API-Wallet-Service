const express = require("express");
require("dotenv").config();
const cors = require("cors");

// Inisialisasi Express
const app = express();

// Middleware
app.use(express.json()); // Agar bisa membaca JSON dari request body
app.use(cors()); // Mengizinkan akses dari frontend

// Routes
app.use("/api/transfers", require("./routes/transferRoutes"));
app.use("/api/users", require("./routes/userRoutes")); // Tambahkan jika ada rute lain

// Middleware Global untuk Menangani Error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
});

// Export app agar bisa dipakai di `index.js`
module.exports = app;
