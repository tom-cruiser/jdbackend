const publicNoteService = require('../services/publicNote.service');
const { formatResponse } = require('../utils/helpers');

const publicNoteController = {
  async getPublicNote(req, res, next) {
    try {
      const note = await publicNoteService.getPublicNote();
      res.json(formatResponse(true, note));
    } catch (error) {
      next(error);
    }
  },

  async getAdminNote(req, res, next) {
    try {
      const note = await publicNoteService.getCurrentNote();
      res.json(formatResponse(true, note));
    } catch (error) {
      next(error);
    }
  },

  async upsertNote(req, res, next) {
    try {
      const note = await publicNoteService.upsertNote(req.body, req.profile);
      res.json(formatResponse(true, note, 'Note saved successfully'));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = publicNoteController;
