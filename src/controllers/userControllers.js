const db = require("../config/db");
const bcrypt = require("bcrypt");

// ✅ USER BARU (REGISTER)
exports.createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body;

        if (!email || !password || !firstName || !lastName || !phoneNumber) {
            return res.status(400).json({ message: "Semua field harus diisi!" });
        }

        // Cek apakah email sudah digunakan
        const [existingUser] = await db.execute(
            "SELECT userID FROM USERS WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah digunakan!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Insert user baru
            const [result] = await connection.execute(
                "INSERT INTO USERS (email, password, firstName, lastName, phoneNumber) VALUES (?, ?, ?, ?, ?)",
                [email, hashedPassword, firstName, lastName, phoneNumber]
            );

            const userID = result.insertId;

            // Buat wallet default untuk user baru
            await connection.execute(
                "INSERT INTO WALLETS (userID, balance, currency, status, createdAt, updatedAt) VALUES (?, 0, 'IDR', 'Active', NOW(), NOW())",
                [userID]
            );

            await connection.commit();
            res.status(201).json({ message: "User created successfully", userID });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// ✅ LIST SEMUA USER
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT userID, email, firstName, lastName, phoneNumber FROM USERS"
        );

        res.json({ users });

    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user", error: error.message });
    }
};

// ✅ GET USER BERDASARKAN ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            "SELECT userID, email, firstName, lastName, phoneNumber FROM USERS WHERE userID = ?",
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error("Error fetching user by ID:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user", error: error.message });
    }
};

// ✅ UPDATE USER
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, phoneNumber } = req.body;

        if (!firstName || !lastName || !phoneNumber || !email) {
            return res.status(400).json({ message: "Semua field harus diisi!" });
        }

        // Cek apakah email yang diupdate sudah digunakan oleh user lain
        const [existingUser] = await db.execute(
            "SELECT userID FROM USERS WHERE email = ? AND userID != ?",
            [email, id]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah digunakan oleh user lain!" });
        }

        const [result] = await db.execute(
            "UPDATE USERS SET email = ?, firstName = ?, lastName = ?, phoneNumber = ? WHERE userID = ?",
            [email, firstName, lastName, phoneNumber, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.json({ message: "User berhasil diperbarui" });

    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat memperbarui user", error: error.message });
    }
};

// ✅ DELETE USER
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Cek apakah user ada sebelum menghapus
        const [user] = await connection.execute(
            "SELECT * FROM USERS WHERE userID = ?",
            [id]
        );

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Hapus wallet terkait (jika ada)
        await connection.execute("DELETE FROM WALLETS WHERE userID = ?", [id]);

        // Hapus user
        await connection.execute("DELETE FROM USERS WHERE userID = ?", [id]);

        await connection.commit();
        res.json({ message: "User berhasil dihapus" });

    } catch (error) {
        await connection.rollback();
        console.error("Error deleting user:", error.message);
        res.status(500).json({ message: "Terjadi kesalahan saat menghapus user", error: error.message });
    } finally {
        connection.release();
    }
};
