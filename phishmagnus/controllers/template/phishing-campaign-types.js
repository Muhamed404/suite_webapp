
const { logger } = require("../../../logger/logger");
 
 const getApiClient = require('../../../utility/api-client')

exports.phishingCampaignTypes = async (req, res) => {
  logger.info('PHISHING CAMPAIGN TYPES::: GETTING PHISHING CAMPAIGN TYPES ');
    
      if (req.method === "GET") {
        let orgId = req.params.orgId;
        let sessionRoleId = req.user.role.id;
        if (orgId === null || orgId === undefined) {
          logger.info(`incoming org param id is null or undefined`);
          if (isMagSuperAdmin(sessionRoleId)) {
            logger.info(`user is super admin in show all template by organization`);
            orgId = [req.user.organization_id];
          }
        }
        const attFileTpypes = `/phm/commons/getAttachmentFileTypes`;
        logger.info(`attFileTpypes url ${attFileTpypes}`); 
        const apiClient = getApiClient(req);
        const [resAttFileTypes] = await Promise.all([ apiClient.get(attFileTpypes), ]);
        const fileTypes = resAttFileTypes.data.filetypes;
        
        res.render("pages/settings/templates/add-template", {
          organization: orgId,
          fileTypes,
        });
      } else if (req.method === "POST") {
        const payload = req.body;
        logger.info(`Posted Template data is ${JSON.stringify(payload)}`);
    
        try {
          let paramOrg = req.params.orgId;
    
          // let orgId = req.user.organization_id;
          paramOrg = paramOrg === undefined ? 0 : paramOrg;
          let userOrg = parseInt(req.user.organization_id,10);
          logger.info(`UserOrg value is ${userOrg}`)
          logger.info(`paramOrg value is ${paramOrg}`)
         
          let templateId = req.params.templateId == undefined ? 0 : req.params.templateId;
          if (templateId == 0) {
            logger.info(`This request for creating a new template`)
           // templateId = req.params.templateId == undefined ? 0 : req.params.templateId;
          }
    
          payload.landing_page_content = payload.landing_page_content === '<p><br></p>' ? '' : payload.landing_page_content.trim();
          payload.phishing_page_content = payload.phishing_page_content === '<p><br></p>' ? '' : payload.phishing_page_content.trim();
          payload.phishing_content = payload.phishing_content === '<p><br></p>' ? '' : payload.phishing_content.trim();
          
          const url = `/phm/settings/templates/${paramOrg}/${templateId}`;
          logger.info(`posting template url ${url}`);
          const apiClient = getApiClient(req);
          const response = await apiClient.post(url, payload);
          const data = response.data;
          logger.info(data.message);
          let message = data.message;
          let alertType = data.alertType;
          let redirectUrl = '';
          if (paramOrg === userOrg) {
            redirectUrl=`/phm/settings/templates/showTemplate/?message=${message}&alertType=${alertType}`;
          }else{
            redirectUrl=`/phm/settings/templates/showTemplate/${paramOrg}?message=${message}&alertType=${alertType}`;
          }
          
          logger.info('Redirecting URL is : '+ redirectUrl+`?message=${message}&alertType=${alertType}`)
          
          res.redirect(redirectUrl);
        } catch (error) {
          logger.error(error);
          logger.error(error.stack)
          res.render("pages/product_suite_management/suite_management", {
            message: "Error in Template",
            alertType: "error",
          });
        }
      }
    };