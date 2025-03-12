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

        console.log("User ID from db:", result.insertId); 

        res.json({ message: "User created successfully", userID: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
