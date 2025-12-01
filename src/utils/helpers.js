const formatResponse = (success, data = null, message = "", error = null) => {
  return {
    success,
    data,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
};

const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    offset,
    limit: Math.min(limit, 100), // Cap at 100
  };
};

const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
  return input;
};

module.exports = {
  formatResponse,
  paginate,
  sanitizeInput,
};
