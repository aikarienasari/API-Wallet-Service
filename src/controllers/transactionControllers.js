//DEPOSIT
exports.deposit = async (req, res) => {
    const { walletID, amount, currency } = req.body;
    
    try {
        await db.execute(`UPDATE WALLETS SET balance = balance + ? WHERE walletID = ?`, [amount, walletID]);
        await db.execute(
            `INSERT INTO TRANSACTIONS (walletID, transaction_type, amount, currency, status) VALUES (?, 'deposit', ?, ?, 'completed')`,
            [walletID, amount, currency]
        );
        res.json({ message: "Deposit successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//WITHDRAWAL
exports.withdrawal = async (req, res) => {
    const { walletID, amount, currency } = req.body;

    try {
        const [wallet] = await db.execute(`SELECT balance FROM WALLETS WHERE walletID = ?`, [walletID]);
        if (wallet[0].balance < amount) return res.status(400).json({ error: "Insufficient balance" });

        await db.execute(`UPDATE WALLETS SET balance = balance - ? WHERE walletID = ?`, [amount, walletID]);
        await db.execute(
            `INSERT INTO TRANSACTIONS (walletID, transaction_type, amount, currency, status) VALUES (?, 'withdrawal', ?, ?, 'completed')`,
            [walletID, amount, currency]
        );
        res.json({ message: "Withdrawal successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

