const express = require("express");
const router = express.Router();
const ProductSuiteLoginController = require('../../../productsuite/controllers/auth/login_controller')



router.get("/", ProductSuiteLoginController.renderLoginPage);

module.exports = router;