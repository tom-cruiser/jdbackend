const courtsService = require("../services/courts.service");
const { formatResponse } = require("../utils/helpers");

const courtsController = {
  async getAllCourts(req, res, next) {
    try {
      const activeOnly = req.query.active !== "false";
      const courts = await courtsService.getAllCourts(activeOnly);
      res.json(formatResponse(true, courts));
    } catch (error) {
      next(error);
    }
  },

  async getCourtById(req, res, next) {
    try {
      const court = await courtsService.getCourtById(req.params.id);
      if (!court) {
        return res
          .status(404)
          .json(formatResponse(false, null, "Court not found"));
      }
      res.json(formatResponse(true, court));
    } catch (error) {
      next(error);
    }
  },

  async createCourt(req, res, next) {
    try {
      const court = await courtsService.createCourt(req.body);
      res
        .status(201)
        .json(formatResponse(true, court, "Court created successfully"));
    } catch (error) {
      next(error);
    }
  },

  async updateCourt(req, res, next) {
    try {
      const court = await courtsService.updateCourt(req.params.id, req.body);
      if (!court) {
        return res
          .status(404)
          .json(formatResponse(false, null, "Court not found"));
      }
      res.json(formatResponse(true, court, "Court updated successfully"));
    } catch (error) {
      next(error);
    }
  },

  async deleteCourt(req, res, next) {
    try {
      const court = await courtsService.deleteCourt(req.params.id);
      if (!court) {
        return res
          .status(404)
          .json(formatResponse(false, null, "Court not found"));
      }
      res.json(formatResponse(true, null, "Court deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = courtsController;
