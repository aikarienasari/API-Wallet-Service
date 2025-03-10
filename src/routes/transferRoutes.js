const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferControllers");

// Rute untuk transfer antar akun
router.post("/", transferController.transfer);

module.exports = router;
