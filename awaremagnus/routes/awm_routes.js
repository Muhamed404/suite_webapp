const express = require('express');
const router = express.Router();
const IndexRoute = require("./index.route");

const ProductSuiteLoginController = require('../../productsuite/controllers/auth/login_controller')


// router.use((req, res, next) => {
//     console.log('[AWM Route] Awaremagnus route used:', req.method, req.originalUrl);
//     next();
// });


router.use("/login", ProductSuiteLoginController.renderLoginPage);
router.use("/index", IndexRoute);

module.exports = router;