const express = require('express');
const dotenv = require('dotenv');
const ticketRoutes = require('./routes/ticketRoutes');
const scheduler = require('./scheduler/ticketScheduler'); // Scheduler to monitor tickets

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.SERVER_PORT || 7000;

app.use(express.json()); // Middleware for JSON data
app.use('/api/tickets', ticketRoutes); // Ticket routes

// Start the scheduler to monitor tickets
scheduler();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
