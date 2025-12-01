const messagesService = require("../services/messages.service");
const { formatResponse } = require("../utils/helpers");

const messagesController = {
  async createMessage(req, res, next) {
    try {
      const message = await messagesService.createMessage(req.body);
      res
        .status(201)
        .json(formatResponse(true, message, "Message sent successfully"));
    } catch (error) {
      next(error);
    }
  },

  async getAllMessages(req, res, next) {
    try {
      const messages = await messagesService.getAllMessages();
      res.json(formatResponse(true, messages));
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const message = await messagesService.markAsRead(req.params.id);
      if (!message) {
        return res
          .status(404)
          .json(formatResponse(false, null, "Message not found"));
      }
      res.json(formatResponse(true, message, "Message marked as read"));
    } catch (error) {
      next(error);
    }
  },

  async deleteMessage(req, res, next) {
    try {
      const message = await messagesService.deleteMessage(req.params.id);
      if (!message) {
        return res
          .status(404)
          .json(formatResponse(false, null, "Message not found"));
      }
      res.json(formatResponse(true, null, "Message deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = messagesController;
