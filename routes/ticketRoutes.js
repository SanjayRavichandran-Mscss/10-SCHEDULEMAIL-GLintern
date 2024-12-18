const express = require('express');
const { raiseTicket, updateAcknowledgement } = require('../controllers/ticketController');

const router = express.Router();

router.post('/raise', raiseTicket); // Endpoint to raise a ticket
router.put('/acknowledge', updateAcknowledgement); // Endpoint to update acknowledgment

module.exports = router;
