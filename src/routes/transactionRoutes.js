const express = require('express');
const router = express.Router();
const transactionController = require("../controllers/transactionControllers");

router.post("/deposit", transactionController.deposit);
router.post("/withdrawal", transactionController.withdrawal);
router.get("/", transactionController.getTransactions);
router.get("/:id", transactionController.getTransactionById);
router.put("/:id", transactionController.updateTransaction); 
router.delete("/:id", transactionController.deleteTransaction); 

module.exports = router;


