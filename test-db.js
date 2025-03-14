const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root", 
    password: "",   
    database: "wallet_services" 
});

db.connect((err) => {
    if (err) {
        console.error("Gagal konek ke database:", err);
    } else {
        console.log("Koneksi ke database berhasil!");
    }
    db.end();
});
