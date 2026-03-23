const express = require('express');
const publicNoteController = require('../controllers/publicNote.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { validate, schemas } = require('../middleware/validate.middleware');

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public endpoint for app users/visitors.
publicRouter.get('/', publicNoteController.getPublicNote);

adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.get('/', publicNoteController.getAdminNote);
adminRouter.put('/', validate(schemas.appNote), publicNoteController.upsertNote);

module.exports = {
  publicRouter,
  adminRouter,
};
