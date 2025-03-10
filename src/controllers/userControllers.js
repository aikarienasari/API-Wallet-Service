const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await db.execute(
            'INSERT INTO USERS (email, password, firstName, lastName, phoneNumber) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, firstName, lastName, phoneNumber]
        );

        // Tambahkan debugging
        console.log("Raw User ID from database:", result.insertId);

        // Format agar 8 digit
        const formattedUserId = result.insertId.toString().padStart(8, '0');

        console.log("Formatted User ID:", formattedUserId); // Cek apakah benar jadi 8 digit

        res.json({ message: "User created successfully", userID: formattedUserId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
