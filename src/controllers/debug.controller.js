const emailService = require('../services/email.service');
const config = require('../config');

const debugController = {
  async sendTestEmail(req, res) {
    try {
      const to = req.query.to || config.ADMIN_EMAIL;
      const subject = 'Test Email from Padel Backend';
      const html = `<p>This is a test message from the Padel backend at ${new Date().toISOString()}.</p>`;
      const result = await emailService.sendEmail(to, subject, html);
      if (result.success) {
        return res.json({ success: true, messageId: result.messageId });
      }
      return res.status(500).json({ success: false, error: result.error });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },
};

module.exports = debugController;
