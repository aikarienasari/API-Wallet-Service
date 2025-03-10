const db = require("../config/db");

// Fungsi untuk menangani transfer antar akun
exports.transfer = async (req, res) => {
    const { sourceWalletID, destinationWalletID, amount, currency } = req.body;

    // Validasi input
    if (!sourceWalletID || !destinationWalletID || !amount || !currency) {
        return res.status(400).json({ message: "Semua data harus diisi" });
    }

    try {
        // Mulai transaksi
        await db.execute("START TRANSACTION");

        // Cek saldo pengirim
        const [sourceWallet] = await db.execute(
            "SELECT balance FROM wallets WHERE walletID = ?",
            [sourceWalletID]
        );

        if (sourceWallet.length === 0 || sourceWallet[0].balance < amount) {
            await db.execute("ROLLBACK");
            return res.status(400).json({ message: "Saldo tidak mencukupi" });
        }

        // Kurangi saldo pengirim
        await db.execute(
            "UPDATE wallets SET balance = balance - ? WHERE walletID = ?",
            [amount, sourceWalletID]
        );

        // Tambah saldo penerima
        await db.execute(
            "UPDATE wallets SET balance = balance + ? WHERE walletID = ?",
            [amount, destinationWalletID]
        );

        // Catat transaksi di tabel `transactions`
        const [transaction] = await db.execute(
            "INSERT INTO transactions (walletID, amount, type, status, createdAt) VALUES (?, ?, ?, ?, NOW())",
            [sourceWalletID, amount, "transfer", "success"]
        );

        // Catat transfer di tabel `transfers`
        await db.execute(
            "INSERT INTO transfers (transactionID, sourceWalletID, destinationWalletID, amount, currency, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [transaction.insertId, sourceWalletID, destinationWalletID, amount, currency, "success"]
        );

        // Commit transaksi jika semua berhasil
        await db.execute("COMMIT");

        res.status(200).json({ message: "Transfer berhasil!" });
    } catch (error) {
        await db.execute("ROLLBACK");
        res.status(500).json({ error: error.message });
    }
};
