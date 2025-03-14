const pool = require("../config/db");

// GET Semua Transaksi
exports.getTransactions = async (req, res) => {
    try {
        const [transactions] = await pool.query("SELECT * FROM TRANSACTIONS");
        res.json({ transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data transaksi", error: error.message });
    }
};

// GET Transaksi Berdasarkan ID
exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const [transaction] = await pool.query("SELECT * FROM TRANSACTIONS WHERE transactionID = ?", [id]);

        if (transaction.length === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        res.json({ transaction: transaction[0] });
    } catch (error) {
        console.error("Error fetching transaction:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data transaksi", error: error.message });
    }
};

// UPDATE Transaksi
exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, currency, status, description } = req.body;

        if (!amount || !currency || !status) {
            return res.status(400).json({ message: "amount, currency, dan status harus diisi!" });
        }

        const [result] = await pool.query(
            `UPDATE TRANSACTIONS 
             SET amount = ?, currency = ?, status = ?, description = ?, updatedAt = NOW()
             WHERE transactionID = ?`,
            [amount, currency, status, description || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        res.json({ message: "Transaksi berhasil diperbarui!" });

    } catch (error) {
        console.error("Error updating transaction:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat memperbarui transaksi", error: error.message });
    }
};

// DELETE Transaksi
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query("DELETE FROM TRANSACTIONS WHERE transactionID = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        res.json({ message: "Transaksi berhasil dihapus!" });

    } catch (error) {
        console.error("Error deleting transaction:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat menghapus transaksi", error: error.message });
    }
};

// DEPOSIT
exports.deposit = async (req, res) => {
    const { walletID, amount, currency, description, referenceID } = req.body;

    if (!walletID || !amount || !currency) {
        return res.status(400).json({ error: "walletID, amount, dan currency harus diisi" });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // Cek walletID di database
        const [wallet] = await connection.query(
            `SELECT walletID FROM WALLETS WHERE walletID = ?`,
            [walletID]
        );

        if (wallet.length === 0) {
            connection.release();
            return res.status(404).json({ error: "Wallet tidak ditemukan, harap buat wallet terlebih dahulu" });
        }

        // Update saldo wallet
        await connection.query(
            `UPDATE WALLETS SET balance = balance + ? WHERE walletID = ?`,
            [amount, walletID]
        );

        // Catat transaksi deposit
        await connection.query(
            `INSERT INTO TRANSACTIONS (walletID, transactionType, amount, currency, status, description, referenceID, createdAt, updatedAt) 
             VALUES (?, 'deposit', ?, ?, 'completed', ?, ?, NOW(), NOW())`,
            [walletID, amount, currency, description || null, referenceID || null]
        );

        await connection.commit();
        connection.release();

        res.json({ message: "Deposit successful" });

    } catch (error) {
        console.error("Deposit error:", error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat deposit" });
    }
};

// WITHDRAWAL
exports.withdrawal = async (req, res) => {
    const { walletID, amount, currency, description, referenceID } = req.body;

    if (!walletID || !amount || !currency) {
        return res.status(400).json({ error: "walletID, amount, dan currency harus diisi" });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // Cek saldo wallet
        const [wallet] = await connection.query(
            `SELECT balance FROM WALLETS WHERE walletID = ?`,
            [walletID]
        );

        if (wallet.length === 0) {
            connection.release();
            return res.status(404).json({ error: "Wallet tidak ditemukan" });
        }

        if (wallet[0].balance < amount) {
            connection.release();
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Update saldo wallet
        await connection.query(
            `UPDATE WALLETS SET balance = balance - ? WHERE walletID = ?`,
            [amount, walletID]
        );

        // Catat transaksi withdrawal
        await connection.query(
            `INSERT INTO TRANSACTIONS (walletID, transactionType, amount, currency, status, description, referenceID, createdAt, updatedAt) 
             VALUES (?, 'withdrawal', ?, ?, 'completed', ?, ?, NOW(), NOW())`,
            [walletID, amount, currency, description || null, referenceID || null]
        );

        await connection.commit();
        connection.release();

        res.json({ message: "Withdrawal successful" });

    } catch (error) {
        console.error("Withdrawal error:", error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat withdrawal" });
    }
};
