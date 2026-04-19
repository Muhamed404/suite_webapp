const express        = require('express');
const router         = express.Router();
const checkPermission = require('../../../utility/check-permission');
const enums          = require('../../../contants/enum');
const { listNotificationMails } = require('../../controllers/notification_mail/list-notification-mails');

// GET /notification-mail
router.get(
  '/',
  checkPermission(enums.ModuleNames.Notification_Template, [
    enums.Access_Types.RWD_ALL,
    enums.Access_Types.RWD_O,
    enums.Access_Types.R_O,
  ]),
  listNotificationMails
);

module.exports = router;
