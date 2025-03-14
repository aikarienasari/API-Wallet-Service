const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferControllers");

router.get("/", transferController.getTransfers); 
router.get("/:id", transferController.getTransferById); 
router.get("/user/:userID", transferController.getTransfersByUser); 
router.delete("/:id", transferController.deleteTransfer); 
router.post("/", transferController.transfer); 

module.exports = router;
