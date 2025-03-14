const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferControllers");



// Endpoint untuk LIST & SHOW Transfer
router.get("/", transferController.getTransfers); // GET semua transfer
router.get("/:id", transferController.getTransferById); // GET transfer berdasarkan transferID
router.get("/user/:userID", transferController.getTransfersByUser); // GET semua transfer berdasarkan userID
router.delete("/:id", transferController.deleteTransfer); // ✅ Tambahkan delete transfer
// Endpoint untuk melakukan Transfer
router.post("/", transferController.transfer); // POST transfer antar wallet

module.exports = router;
