const emailService = require('../services/email.service');
const config = require('../config');

const debugController = {
  async sendTestEmail(req, res) {
    try {
      const to = req.query.to || config.ADMIN_EMAIL;
      const subject = 'Test Email from Padel Backend';
      const html = `<p>This is a test message from the Padel backend at ${new Date().toISOString()}.</p>`;
      // Email sending is disabled in production. Log the test payload and return a
      // helpful message so callers know the endpoint won't actually send mail.
      console.info('Email disabled: test email requested to', to, 'subject:', subject);
      console.info('Email body:', html);
      return res.json({ success: true, message: 'Email sending is disabled in this deployment. Payload logged.' });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },
};

module.exports = debugController;
