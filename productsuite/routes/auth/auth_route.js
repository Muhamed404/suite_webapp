const express = require("express");
const { renderLoginPage, postLogin } = require("../../controllers/auth/login_controller");
const { logout } = require("../../controllers/auth/logout_controller");
const { changePassword } = require("../../controllers/auth/change_password_controller");
const {validate, handleValidationResult} = require('../../../middleware/routes-validation')
const router = express.Router();

router.get("/", renderLoginPage);
router.post("/", postLogin);
router.get("/logout", logout);

// router.get("/changePassword", changePassword);
// router.post("/changePassword", validate("changePassword"), handleValidationResult, changePassword);




module.exports = router;