// Email service disabled
// Replaced with a no-op implementation so other modules that require
// the email service won't break. All methods return resolved promises.

const logger = require("../utils/logger");

class NoopEmailService {
  async verifyConnection() {
    try {
      logger.info("ℹ️ Email service is disabled (noop)");
    } catch (e) {}
    return true;
  }

  async sendEmail(to, subject, html, text = "") {
    try {
      logger.info({ to, subject }, "Email disabled - would have sent");
    } catch (e) {}
    return { success: true, messageId: "disabled" };
  }

  async sendBookingConfirmation(booking, user) {
    return this.sendEmail(user && user.email, `Booking Confirmation - ${booking && booking.court_name}`, "");
  }

  async sendBookingNotificationToAdmin(booking, user) {
    return this.sendEmail(null, `New Booking - ${booking && booking.court_name}`, "");
  }

  async sendContactNotification(contact) {
    return this.sendEmail(null, `New Contact Message from ${contact && contact.name}`, "");
  }

  async sendContactConfirmation(contact) {
    return this.sendEmail(contact && contact.email, "Message Received - Court Booking System", "");
  }
}

module.exports = new NoopEmailService();
