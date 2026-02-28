const nodemailer = require("nodemailer");

/**
 * Utility function to send emails using nodemailer.
 * Requires SMTP credentials in environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 */
const sendEmail = async (options) => {
  try {
    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });

    // Define the email options
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Admin'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, 
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);
    // Don't throw the error, just return failure so it doesn't break the main flow
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
