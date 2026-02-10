const express = require("express");
const router = express.Router();
const { renderCreateTemplate, createTemplate } = require('../../controllers/template/create-template-controller')
const { retrieveAllTemplates } = require('../../controllers/template/list-templates-controller.js')
const { disableTemplate } = require('../../controllers/template/disable-template.js')
const { viewTemplate } = require('../../controllers/template/view-template.js')
const { viewTemplateApi } = require('../../controllers/template/view-template-api.js')

// const { updateSystemTemplate } = require('../../controllers/system_template/updateSystemTemplateController')


// const SystemTemplateController = require("../../controllers/system_template/systemTemplateController");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum');
const { updateTemplateController } = require("../../controllers/template/upate-template-controller");


// below to show secure magnus defined templates if request is coming from organization admin
router.get("/list", checkPermission(enums.ModuleNames.My_Template,
    [enums.Access_Types.R_O, enums.Access_Types.RWD_O]), retrieveAllTemplates);

router.post("/update/:templateId", checkPermission(enums.ModuleNames.My_Template, [enums.Access_Types.RWD_O]),
    updateTemplateController);

router.get("/create", checkPermission(enums.ModuleNames.My_Template, [enums.Access_Types.RWD_O]),
    renderCreateTemplate);

router.post("/create", checkPermission(enums.ModuleNames.My_Template, [enums.Access_Types.RWD_O]),
    createTemplate);

// API endpoint to get template details as JSON (for preview functionality)
router.get("/api/view/:templateId", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), viewTemplateApi);

router.get("/view/:templateId", checkPermission(enums.ModuleNames.My_Template, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), viewTemplate);

router.get("/delete/:templateId", checkPermission(enums.ModuleNames.My_Template, [enums.Access_Types.RWD_O]),
    disableTemplate);




// for disable the template



// for editing the template
// router.get("/edit/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]), 
// SystemTemplateController.renderEditFormTemplate);



// router.get("/duplicate/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O]), SystemTemplateController.renderDuplicateTemplate); // for making clonning of the system template
// router.post("/duplicate/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O]), SystemTemplateController.createDuplicateTemplate);

// for template creation either secure magnus admins / organization admins
// router.post("/update/:templateId", checkPermission(enums.ModuleNames.System_Template, [enums.Access_Types.RWD_ALL]),
//     updateSystemTemplate);






module.exports = router;
