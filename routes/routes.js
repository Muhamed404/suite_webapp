const express = require('express');
const router = express.Router();
const PhishMagnusRoutes = require('../phishmagnus/routes/phishmagnus-routes');
const ProductSuiteRoutes = require('../productsuite/routes/product_suite_routes');
const AwarenessMagnusRoutes = require('../awaremagnus/routes/awm_routes');



// router.use("/awm", AwarenessMagnusRoutes);
router.use("/phm", PhishMagnusRoutes);
router.use("/", ProductSuiteRoutes);




module.exports = router;