const express = require('express');
const { deposit } = require('../controllers/transactionControllers');
const router = express.Router();

router.post('/deposit', deposit);

module.exports = router;

router.post('/withdraw', withdrawal);
