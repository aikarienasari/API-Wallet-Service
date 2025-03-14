const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletControllers");

router.use((req, res, next) => {
    console.log(`Request masuk ke ${req.method} ${req.originalUrl}`);
    next();
});

router.get("/", walletController.getWallets);
router.get("/:id", walletController.getWalletById);
router.post("/", walletController.createWallet);
router.put("/:id", walletController.updateWallet);
router.delete("/:id", walletController.deleteWallet);

module.exports = router;
