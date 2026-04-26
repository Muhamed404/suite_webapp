const express = require("express");
const router = express.Router();
const checkPermission = require("../../../utility/check-permission");
const enums = require("../../../contants/enum");
const { listNotificationTemplates } = require("../../controllers/notification_template/list-notification-templates");
const { renderForm, submitForm } = require("../../controllers/notification_template/create-notification-template");
const { renderEditForm, submitEditForm } = require("../../controllers/notification_template/edit-notification-template");
const { deleteTemplate } = require("../../controllers/notification_template/delete-notification-template");

router.get(
  "/",
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
  ]),
  listNotificationTemplates
);

router.get(
  "/create",
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
  ]),
  renderForm
);

router.post(
  "/create",
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
  ]),
  submitForm
);

router.get(
  "/:id/edit",
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
  ]),
  renderEditForm
);

router.post(
  "/:id/edit",
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
  ]),
  submitEditForm
);

router.post(
  "/:id/delete",
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
  ]),
  deleteTemplate
);

module.exports = router;
