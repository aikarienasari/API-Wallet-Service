const pool = require("../config/db");

// ✅ GET all wallets atau filter berdasarkan userID
exports.getWallets = async (req, res) => {
    console.log("✅ Handler getWallets dipanggil");

    try {
        const { userID } = req.query;
        let query = "SELECT * FROM WALLETS";
        let params = [];

        if (userID) {
            query += " WHERE userID = ?";
            params.push(userID);
        }

        console.log("🔍 Menjalankan query:", query, "dengan params:", params);

        const [results] = await pool.query(query, params);

        console.log("✅ Query berhasil, hasil:", results);
        res.json({ wallets: results });
    } catch (err) {
        console.error("❌ Error dalam query database:", err);
        res.status(500).json({ message: "Error fetching wallets", error: err });
    }
};

// ✅ GET wallet by ID
exports.getWalletById = async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await pool.query("SELECT * FROM WALLETS WHERE walletID = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        res.json({ wallet: results[0] });
    } catch (err) {
        console.error("❌ Error fetching wallet:", err);
        res.status(500).json({ message: "Error fetching wallet", error: err });
    }
};

// ✅ CREATE wallet (Tambahkan validasi userID)
exports.createWallet = async (req, res) => {
    try {
        const { userID, balance } = req.body;
        if (!userID || balance === undefined) {
            return res.status(400).json({ message: "userID and balance are required" });
        }

        // Cek apakah userID valid
        const [user] = await pool.query("SELECT userID FROM USERS WHERE userID = ?", [userID]);
        if (user.length === 0) {
            return res.status(400).json({ message: "User tidak ditemukan, harap daftarkan user terlebih dahulu." });
        }

        const [result] = await pool.query(
            "INSERT INTO WALLETS (userID, balance, currency, status, createdAt, updatedAt) VALUES (?, ?, 'IDR', 'Active', NOW(), NOW())",
            [userID, balance]
        );

        res.status(201).json({ message: "Wallet created successfully", walletID: result.insertId });
    } catch (err) {
        console.error("❌ Error creating wallet:", err);
        res.status(500).json({ message: "Error creating wallet", error: err });
    }
};

// ✅ UPDATE wallet (Perbaiki query dan validasi balance)
exports.updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { balance } = req.body;

        if (balance === undefined || balance < 0) {
            return res.status(400).json({ message: "Balance harus diisi dan tidak boleh negatif" });
        }

        const [result] = await pool.query("UPDATE WALLETS SET balance = ?, updatedAt = NOW() WHERE walletID = ?", [balance, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        res.json({ message: "Wallet updated successfully" });
    } catch (err) {
        console.error("❌ Error updating wallet:", err);
        res.status(500).json({ message: "Error updating wallet", error: err });
    }
};

// ✅ DELETE wallet (Perbaiki query dan cek transaksi sebelum delete)
exports.deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek apakah wallet memiliki transaksi
        const [transactions] = await pool.query("SELECT * FROM TRANSACTIONS WHERE walletID = ?", [id]);
        if (transactions.length > 0) {
            return res.status(400).json({ message: "Wallet memiliki transaksi dan tidak bisa dihapus" });
        }

        const [result] = await pool.query("DELETE FROM WALLETS WHERE walletID = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        res.json({ message: "Wallet deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting wallet:", err);
        res.status(500).json({ message: "Error deleting wallet", error: err });
    }
};
