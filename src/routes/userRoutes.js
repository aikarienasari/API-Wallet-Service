const express = require("express");
const userController = require("../controllers/userControllers");
const router = express.Router();

router.post("/", userController.createUser); // Register User
router.get("/", userController.getUsers); // List Semua Users
router.get("/:id", userController.getUserById); // Show User by ID
router.put("/:id", userController.updateUser); // Update User
router.delete("/:id", userController.deleteUser); // Delete User

module.exports = router;
