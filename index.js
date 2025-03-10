const app = require("./src/app"); // Mengimpor app.js
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});

