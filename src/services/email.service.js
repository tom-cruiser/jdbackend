const nodemailer = require("nodemailer");
const config = require("../config");

class EmailService {
  constructor() {
    this.transporter = null;

    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
    }
  }

  async sendMail({ to, subject, html, text }) {
    if (!to || !subject) {
      throw new Error("Missing required email fields");
    }

    if (!this.transporter) {
      // Graceful fallback for environments without SMTP configured.
      console.info("Email disabled: would send email", { to, subject });
      if (html) {
        console.info("Email body preview:", html);
      }
      return { sent: false, reason: "SMTP not configured" };
    }

    await this.transporter.sendMail({
      from: config.FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });

    return { sent: true };
  }
}

module.exports = new EmailService();
