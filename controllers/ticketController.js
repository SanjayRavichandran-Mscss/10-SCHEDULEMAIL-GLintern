const db = require('../config/db');
const nodemailer = require('nodemailer');

// Function to create email transporter dynamically
const createTransporter = (email, password) => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: password,
        },
    });
};

// Function to send email
const sendEmail = async (fromEmail, fromPassword, to, subject, htmlContent) => {
    const transporter = createTransporter(fromEmail, fromPassword);

    try {
        await transporter.sendMail({
            from: fromEmail, // Sender's email
            to,             // Receiver's email
            subject,        // Subject of the email
            html: htmlContent, // Email body
        });
        console.log(`Email sent successfully to student mentore mail: ${to}`);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
};

// HTML Templates for Emails
const newTicketHTML = (mentor_name, issue, description) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
        .container { padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h2 { color: #007bff; }
        p { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>New Ticket Raised</h2>
        <p><strong>Mentor Name:</strong> ${mentor_name}</p>
        <p><strong>Issue:</strong> ${issue}</p>
        <p><strong>Description:</strong> ${description}</p>
    </div>
</body>
</html>
`;

const acknowledgementHTML = (mentor_name, ticket_id) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
        .container { padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h2 { color: #28a745; }
        p { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Ticket Acknowledged</h2>
        <p>Dear ${mentor_name},</p>
        <p>Your ticket with ID <strong>${ticket_id}</strong> has been acknowledged by the system administrator.</p>
        <p>We will resolve your issue shortly.</p>
    </div>
</body>
</html>
`;

// Raise Ticket
exports.raiseTicket = (req, res) => {
    const { mentor_name, issue, description } = req.body;

    const query = `INSERT INTO ticket_raise (mentor_name, issue, description, acknowledgement) VALUES (?, ?, ?, 0)`;
    db.query(query, [mentor_name, issue, description], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Send immediate email to system admin
        const htmlContent = newTicketHTML(mentor_name, issue, description);
        await sendEmail(
            process.env.MENTOR_EMAIL, // Sender email: Mentor
            process.env.MENTOR_PASSWORD, // Sender password
            process.env.SYSTEM_ADMIN_EMAIL, // Receiver: System Admin
            'New Ticket Raised',
            htmlContent
        );

        res.status(200).json({ message: 'Ticket raised successfully!', ticket_id: result.insertId });
    });
};

// Update Acknowledgement
exports.updateAcknowledgement = (req, res) => {
    const { ticket_id } = req.body;

    const query = `UPDATE ticket_raise SET acknowledgement = 1 WHERE ticket_id = ?`;
    db.query(query, [ticket_id], async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fetch mentor details for sending acknowledgment
        const fetchQuery = `SELECT mentor_name FROM ticket_raise WHERE ticket_id = ?`;
        db.query(fetchQuery, [ticket_id], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: 'Ticket not found' });

            const { mentor_name } = results[0];

            // Send acknowledgment email from system admin to mentor
            const htmlContent = acknowledgementHTML(mentor_name, ticket_id);
            await sendEmail(
                process.env.SYSTEM_ADMIN_EMAIL, // Sender email: System Admin
                process.env.SYSTEM_ADMIN_PASSWORD, // Sender password
                process.env.MENTOR_EMAIL, // Receiver: Mentor
                'Ticket Acknowledged',
                htmlContent
            );

            res.status(200).json({ message: 'Acknowledgement updated and email sent successfully! to student mentor' });
        });
    });
};
