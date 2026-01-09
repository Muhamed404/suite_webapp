const express = require("express");
const router = express.Router();
const userManagement = require("../../controllers/user_management/user-management-controller");
const { deleteUser } = require('../../controllers/user_management/delete-phm-user')
const { retrieveUser } = require('../../controllers/user_management/show-user')
const { editUser } = require('../../controllers/user_management/edit-user')
const enums = require('../../../contants/enum')
const { renderSuiteUsers } = require('../../controllers/user_management/render-suite-users')

const checkPermission = require("../../../utility/check-permission");
const { renderLicensedUserByProduct } = require("../../controllers/user_management/render-licensed-users-by-product-controller");
const { renderSecureMagnusUsers } = require("../../controllers/user_management/render-secure-magnus-users-controller");
const { createSecureMagnusUser, submitSecureMagnusUser } = require("../../controllers/user_management/create-securemagnus-user");



// Below is for PHM Licensed Users list
router.get("/licensed-users/:productId",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  renderLicensedUserByProduct);


// adding with new design page. this is not functional yet
router.get("/create/bulk", async (req, res) => { userManagement.renderBulkUserModule(req, res); });

router.post("/create/bulk", checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  async (req, res) => { userManagement.uploadBulkUsers(req, res); });

// create single phm user
router.get("/create", checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  async (req, res) => { userManagement.create(req, res); });

router.post("/create", checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  async (req, res) => { userManagement.submitCreationForm(req, res); });

router.get("/list",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  userManagement.renderUserList);

router.get("/suite-users/:organizationId?",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  renderSuiteUsers);

router.get("/securemagnus-users",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL]),
  renderSecureMagnusUsers);
router.get("/securemagnus-users/create",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL]),
  createSecureMagnusUser);
router.post("/securemagnus-users/create",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL]),
  submitSecureMagnusUser);


router.get("/retrieved-enrolled-phm-users",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  userManagement.retrieveEnrolledPHMUsers);

router.get("/retrieved-unenrolled-phm-users",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  userManagement.retrieveUnEnrolledPHMUsers);

router.post("/update-license-status/:hasRequestedToUnenroll?",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  userManagement.saveUserAllocationLicense);

router.get(
  "/delete/:userId",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RWD_ALL]),
  deleteUser
);

router.get(
  "/show/:userId",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RWD_ALL]),
  retrieveUser
);
router.post(
  "/update/:userId",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RWD_ALL]),
  editUser
);


module.exports = router;
