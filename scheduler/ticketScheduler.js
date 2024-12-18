const db = require('../config/db');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MENTOR_EMAIL,
        pass: process.env.MENTOR_PASSWORD,
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    await transporter.sendMail({
        from: process.env.MENTOR_EMAIL,
        to,
        subject,
        html: htmlContent,
    });
};

module.exports = () => {
    setInterval(() => {
        const query = `SELECT * FROM ticket_raise WHERE acknowledgement = 0 AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 1`;

        db.query(query, async (err, tickets) => {
            if (err) return console.error('Error fetching tickets:', err.message);

            for (const ticket of tickets) {
                // Inbuilt escalation email HTML content
                const htmlContent = `
                    <html>
                    <body>
                        <h1>Escalation Notice</h1>
                        <p>Dear Lab Admin,</p>
                        <p>The following ticket has not been acknowledged by the System Admin:</p>
                        <ul>
                            <li><strong>Mentor Name:</strong> ${ticket.mentor_name}</li>
                            <li><strong>Ticket ID:</strong> ${ticket.ticket_id}</li>
                        </ul>
                        <p>Please take immediate action to resolve this issue.</p>
                        <p>Thank you,</p>
                        <p>Your Support Team</p>
                    </body>
                    </html>
                `;

                // Send escalation mail to lab admin
                await sendEmail(
                    process.env.LAB_ADMIN_EMAIL,
                    'Escalation: System Admin Did Not Respond',
                    htmlContent
                );

                console.log(`Escalation mail sent to Lab admin for Ticket ID: ${ticket.ticket_id}`);
            }
        });
    }, 60000); // Run every 1 minute
};