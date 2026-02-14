const express = require("express");
const router = express.Router();
const { renderCreateTemplate, createTemplate } = require('../../../controllers/system_template/create-template-controller')
// const {showTemplate} = require('../../../controllers/system_template/showTemplateController.js-----------')
const { showTemplate } = require('../../../controllers/system_template/show-templates-controller')
const { disableTemplate } = require('../../../controllers/system_template/disable-template-controller')
const { viewTemplate } = require('../../../controllers/system_template/view-template-controller')
const { updateTemplate } = require('../../../controllers/system_template/upate-template-controller.js')
// const SystemTemplateController = require("../../controllers/system_template/systemTemplateController");
const checkPermission = require("../../../../utility/check-permission");
const enums = require('../../../../contants/enum');
const { duplicateTemplate } = require("../../../controllers/system_template/duplicate-template-controller");
const { fetchHtmlFromUrl } = require('../../../../utility/helperFunctions.js');


// below to show secure magnus defined templates if request is coming from organization admin
router.get("/list", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O]), showTemplate);
router.get("/duplicate/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O]), viewTemplate); // for making clonning of the system template
router.post("/duplicate/:templateId/:organizationId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O]), duplicateTemplate);
router.get("/view/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), viewTemplate);
router.post("/edit/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), updateTemplate);
router.delete("/delete/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), disableTemplate);
router.get("/create", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), renderCreateTemplate);
router.post("/create", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), createTemplate);

/**
 * Proxy endpoint to fetch HTML from a URL (bypasses CORS for frontend)
 */
router.post('/api/fetch-html', async (req, res) => {
  try {
    const { url } = req.body;
    const html = await fetchHtmlFromUrl(url);
    res.json({ html });
  } catch (err) {
    let errorMessage = err.message || 'Server error.';
    if (errorMessage === 'Invalid URL format.') {
      errorMessage = req.__('system_template.create.invalidUrlFormat');
    }
    res.status(400).json({ error: errorMessage });
  }
});



// router.get("/showTemplate/:orgId?", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]) ,viewTemplate);


// display all templates by organization id is an optional value here.

// for create template to display the webpage


// for update template to display the webpage
// router.post("/update/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), SystemTemplateController.update);

// for disable the template
// router.get("/delete/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), 
// disableTemplate);


// for editing the template
// router.get("/edit/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), 
// SystemTemplateController.renderEditFormTemplate);




// for template creation either secure magnus admins / organization admins
// router.post("/update/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), 
// updateTemplateController);






module.exports = router;
