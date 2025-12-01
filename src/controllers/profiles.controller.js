const profilesService = require("../services/profiles.service");
const { formatResponse } = require("../utils/helpers");

const profilesController = {
  async getMyProfile(req, res, next) {
    try {
      const profile = await profilesService.getProfile(req.user.id);
      if (profile) {
        // remove sensitive fields
        const safe = { ...profile };
        delete safe.password_hash;
        delete safe.email_confirm_token;
        delete safe.password_reset_token;
        delete safe.password_reset_expires;
        res.json(formatResponse(true, safe));
      } else {
        res.json(formatResponse(true, null));
      }
    } catch (error) {
      next(error);
    }
  },

  async updateMyProfile(req, res, next) {
    try {
      const updatedProfile = await profilesService.updateProfile(
        req.user.id,
        req.body
      );
      res.json(
        formatResponse(true, updatedProfile, "Profile updated successfully")
      );
    } catch (error) {
      next(error);
    }
  },

  async getAllProfiles(req, res, next) {
    try {
      const profiles = await profilesService.getAllProfiles();
      const safe = profiles.map((p) => {
        const copy = { ...p };
        delete copy.password_hash;
        delete copy.email_confirm_token;
        delete copy.password_reset_token;
        delete copy.password_reset_expires;
        return copy;
      });
      res.json(formatResponse(true, safe));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = profilesController;
