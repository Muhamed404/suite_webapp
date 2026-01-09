const express = require("express");
const checkPermission = require("../../utility/check-permission");
const enums = require('../../contants/enum')
const router = express.Router();
const { getStateByCounty, getCityByState, getCategories, getRawHtml, fetchPhishingPagesByOrganization,
  generatePDF, checkDuplicateUser, checkDuplicateOrganization, getUsersByDepartment, getUsersByUnAssignedDepartment,
} = require("../../phishmagnus/utility/common-functions");


router.get("/states/:countryId", getStateByCounty);
router.get("/cities/:selectedStateId", getCityByState);
router.get("/showTemplateCategories/:selectedPhishingType?", getCategories)
router.get("/getPhishPage/:url/:lang", getRawHtml)
router.get(`/showPhishingPage/:lang`, fetchPhishingPagesByOrganization)
router.post('/generatePDF', generatePDF)
router.get('/check-duplicate-user', checkDuplicateUser)
router.get('/check-duplicate-organization', checkDuplicateOrganization)

// router.post("/enrollToDepartment/:departmentId", saveSelectedUsers);



module.exports = router;
