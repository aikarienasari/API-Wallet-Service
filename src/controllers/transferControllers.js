const db = require("../config/db");

// GET Semua Transfer
exports.getTransfers = async (req, res) => {
    try {
        const [transfers] = await db.execute(`
            SELECT t.*, 
                w1.userID AS sourceUserID, 
                w2.userID AS destinationUserID
            FROM transfers t
            JOIN wallets w1 ON t.sourceWalletID = w1.walletID
            JOIN wallets w2 ON t.destinationWalletID = w2.walletID
        `);

        res.json({ transfers });
    } catch (error) {
        console.error("Error fetching transfers:", error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data transfer" });
    }
};

// GET Transfer Berdasarkan ID
exports.getTransferById = async (req, res) => {
    try {
        const { id } = req.params;

        const [transfer] = await db.execute(`
            SELECT t.*, 
                w1.userID AS sourceUserID, 
                w2.userID AS destinationUserID
            FROM transfers t
            JOIN wallets w1 ON t.sourceWalletID = w1.walletID
            JOIN wallets w2 ON t.destinationWalletID = w2.walletID
            WHERE t.transferID = ?
        `, [id]);

        if (transfer.length === 0) {
            return res.status(404).json({ message: "Transfer tidak ditemukan" });
        }

        res.json({ transfer: transfer[0] });
    } catch (error) {
        console.error("Error fetching transfer:", error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data transfer" });
    }
};

// GET Semua Transfer Berdasarkan userID
exports.getTransfersByUser = async (req, res) => {
    try {
        const { userID } = req.params;

        const [transfers] = await db.execute(`
            SELECT t.*, 
                w1.userID AS sourceUserID, 
                w2.userID AS destinationUserID
            FROM transfers t
            JOIN wallets w1 ON t.sourceWalletID = w1.walletID
            JOIN wallets w2 ON t.destinationWalletID = w2.walletID
            WHERE w1.userID = ? OR w2.userID = ?
        `, [userID, userID]);

        res.json({ transfers });
    } catch (error) {
        console.error("Error fetching transfers by userID:", error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data transfer berdasarkan userID" });
    }
};

// POST Transfer (Fix: Validasi dan Error Handling Lebih Baik)
exports.transfer = async (req, res) => {
    const { sourceWalletID, destinationWalletID, amount, currency } = req.body;

    if (!sourceWalletID || !destinationWalletID || !amount || !currency) {
        return res.status(400).json({ message: "Semua data harus diisi" });
    }

    if (amount <= 0) {
        return res.status(400).json({ message: "Jumlah transfer harus lebih dari 0" });
    }

    if (sourceWalletID === destinationWalletID) {
        return res.status(400).json({ message: "Tidak bisa transfer ke wallet yang sama" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Cek saldo pengirim
        const [sourceWallet] = await connection.execute(
            "SELECT balance FROM wallets WHERE walletID = ?", [sourceWalletID]
        );

        if (sourceWallet.length === 0) {
            throw new Error("Wallet pengirim tidak ditemukan");
        }

        if (sourceWallet[0].balance < amount) {
            throw new Error("Saldo tidak mencukupi");
        }

        // Cek apakah wallet tujuan ada
        const [destinationWallet] = await connection.execute(
            "SELECT walletID FROM wallets WHERE walletID = ?", [destinationWalletID]
        );

        if (destinationWallet.length === 0) {
            throw new Error("Wallet tujuan tidak ditemukan");
        }

        // Kurangi saldo pengirim
        await connection.execute(
            "UPDATE wallets SET balance = balance - ? WHERE walletID = ?", [amount, sourceWalletID]
        );

        // Tambah saldo penerima
        await connection.execute(
            "UPDATE wallets SET balance = balance + ? WHERE walletID = ?", [amount, destinationWalletID]
        );

        // Catat transaksi di tabel `transactions`
        const [transaction] = await connection.execute(
            "INSERT INTO transactions (walletID, transactionType, amount, currency, status, createdAt) VALUES (?, 'transfer', ?, ?, 'success', NOW())",
            [sourceWalletID, amount, currency]
        );

        const transactionID = transaction.insertId;

        // Catat transfer di tabel `transfers`
        await connection.execute(
            "INSERT INTO transfers (transactionID, sourceWalletID, destinationWalletID, amount, currency, status, createdAt) VALUES (?, ?, ?, ?, ?, 'success', NOW())",
            [transactionID, sourceWalletID, destinationWalletID, amount, currency]
        );

        // Commit transaksi
        await connection.commit();
        connection.release();

        res.status(200).json({ message: "Transfer berhasil!", transactionID });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error("Transfer error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

// DELETE TRANSFER
exports.deleteTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        // Cek apakah transfer ada
        const [transfer] = await connection.execute(
            "SELECT * FROM transfers WHERE transferID = ?",
            [id]
        );

        if (transfer.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Transfer tidak ditemukan" });
        }

        // Hapus transfer dari tabel `transfers`
        await connection.execute(
            "DELETE FROM transfers WHERE transferID = ?",
            [id]
        );

        // Hapus transaksi terkait dari tabel `transactions`
        await connection.execute(
            "DELETE FROM transactions WHERE transactionID = ?",
            [transfer[0].transactionID]
        );

        await connection.commit();
        connection.release();

        res.json({ message: "Transfer berhasil dihapus!" });

    } catch (error) {
        console.error("Error deleting transfer:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat menghapus transfer", error: error.message });
    }
};
