const { formatResponse } = require("../utils/helpers");

const adminMiddleware = (req, res, next) => {
  if (!req.profile || !req.profile.is_admin) {
    return res
      .status(403)
      .json(formatResponse(false, null, "Admin access required"));
  }
  next();
};

module.exports = adminMiddleware;
