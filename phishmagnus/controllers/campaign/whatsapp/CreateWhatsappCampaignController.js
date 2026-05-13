const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");

const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client')
const DepartmentService = require('../../../services/department/department-service')
const GroupService = require('../../../services/group/group-service')
const TemplateService = require('../../../services/template/template-service');
const { redactLogData } = require("../../../utility/redact");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const backend_api_urls = require("../../../../config/backend_api_urls");

exports.renderFormController = async (req, res) => {
  logger.info("Controller - Render Form:Incoming request");
  try {
    if (req.method === "GET") {
      logger.info("Controller - Render Form: Render Email Module");

      const organization = Number(req?.user?.organization_id) || null;
      if (!organization) {
        logger.warn("Controller - Render Form: missing organization in session");
        return res.redirect('/phm/?message=' + encodeURIComponent('Organization not found') + '&alertType=error');
      }

      try {
        // fetch all needed data in parallel; swallow per-request errors and continue with sensible defaults
        const [
          deptResponse,
          grpResponse,
          templateResponse,
          systemTemplateResponse
        ] = await Promise.all([
          DepartmentService.getDepartmentsByOrganization(req).catch(err => ({ data: { message: [] }, _err: err })),
          GroupService.getGroupsByOrganization(req).catch(err => ({ data: { message: [] }, _err: err })),
          TemplateService.listTemplatesByOrgAndType(organization, enums.phishingType.Whatsapp, req).catch(err => ({ data: { message: [] }, _err: err })),
          TemplateService.getSystemTemplates(enums.phishingType.Whatsapp, req).catch(err => ({ _err: err, templates: null }))
        ]);

        if (deptResponse?._err) logger.warn('Controller - Render Form: department fetch failed', { err: deptResponse._err && (deptResponse._err.stack || deptResponse._err.message) });
        if (grpResponse?._err) logger.warn('Controller - Render Form: group fetch failed', { err: grpResponse._err && (grpResponse._err.stack || grpResponse._err.message) });
        if (templateResponse?._err) logger.warn('Controller - Render Form: template fetch failed', { err: templateResponse._err && (templateResponse._err.stack || templateResponse._err.message) });
        if (systemTemplateResponse?._err) logger.warn('Controller - Render Form: system template fetch failed', { err: systemTemplateResponse._err && (systemTemplateResponse._err.stack || systemTemplateResponse._err.message) });

        // Normalize system templates into an array for rendering
        let systemTemplates = [];
        if (Array.isArray(systemTemplateResponse)) {
          systemTemplates = systemTemplateResponse;
        } else if (systemTemplateResponse && Array.isArray(systemTemplateResponse.templates)) {
          systemTemplates = systemTemplateResponse.templates;
        } else if (systemTemplateResponse && systemTemplateResponse.data && Array.isArray(systemTemplateResponse.data.message)) {
          // backward-compat fallback if some callers still returned an axios-like response
          systemTemplates = systemTemplateResponse.data.message;
        } else if (systemTemplateResponse == null) {
          systemTemplates = [];
        }

        logger.info(`Controller - Render Form: system templates count=${systemTemplates.length}`);
        logger.info(`Controller - Render Form: user templates deptResponse count=${JSON.stringify(deptResponse.data.message, null, 2)}`);
        logger.info(`Controller - Render Form: user templates count=${JSON.stringify(systemTemplates, null, 2)}`);
        logger.info(`Controller - Render Form: user templates grpResponse count=${JSON.stringify(grpResponse.data.message, null, 2)}`);
        // logger.debug('Controller - Render Form: system templates sample', { sample: systemTemplates[0] || null });

        return res.render(render_ejs_urls.PhishMagnus.Campaign.Whatsapp.CREATE, {
          department: deptResponse.data.message,
          group: grpResponse.data.message,
          templates: templateResponse.data.message,
          systemTemplate: systemTemplates,
        });
      } catch (err) {
        logger.error(`Controller - Render Form: error in processing request ${err.message}`);
        logger.error(err.stack);
        req.flash('message', 'Error processing request in creating email campaign');
        req.flash('alertType', 'error');
        return res.redirect('/home');
      }


    }
  } catch (error) {
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('message', 'Error in rendering form for creating WhatsApp campaign');
    req.flash('alertType', 'error');
    res.redirect("/home");
  }
};



exports.submitFormController = async (req, res) => {
  logger.info("Controller - Create WhatsApp Campaign:Incoming request");
  try {
    if (req.method === "POST") {
      logger.info(`Campaign IncomingBody Request: \n ${JSON.stringify(redactLogData(req.body), null, 2)}`);
      let payload = req.body;

      // normalize arrays (ensure arrays when single values posted)
      const departmentIds = Array.isArray(payload.departmentIds) ? payload.departmentIds : (payload.departmentIds ? [payload.departmentIds] : []);
      const groupIds = Array.isArray(payload.groupIds) ? payload.groupIds : (payload.groupIds ? [payload.groupIds] : []);
      payload.departmentIds = departmentIds;
      payload.groupIds = groupIds;

      // If both departmentIds and groupIds are empty -> error
      if ((departmentIds.length === 0) && (groupIds.length === 0)) {
        logger.warn('Controller - Create WhatsApp Campaign: Invitees are empty - no departments or groups selected');
        const message = req.__('validation_messages.invalid_invitees_selected');
        const alertType = 'error';
        req.flash('message', message);
        req.flash('alertType', alertType);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.CREATE);
      }

      // Validate and convert templateSelect to templateId
      if (!payload.templateSelect) {
        logger.warn('Controller - Create WhatsApp Campaign: templateSelect is missing');
        const message = req.__('validation_messages.invalid_template_selected');
        const alertType = 'error';
        req.flash('message', message);
        req.flash('alertType', alertType);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.CREATE);
      }

      const templateId = Number(payload.templateSelect);
      if (isNaN(templateId) || templateId <= 0) {
        logger.warn('Controller - Create WhatsApp Campaign: Invalid templateId: ' + payload.templateSelect);
        const message = req.__('validation_messages.invalid_template_id');
        const alertType = 'error';
        req.flash('message', message);
        req.flash('alertType', alertType);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.CREATE);
      }

      // Add templateId to payload
      payload.templateId = templateId;
      delete payload.templateSelect;
      logger.info("Payload data " + JSON.stringify(redactLogData(payload)));
      const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.CREATE;
      logger.info("Posting Campaign URL " + url);
      const apiClient = getApiClient(req);
      const response = await apiClient.post(url, payload);
      if (response.data.success) {
        req.flash('message', response.data.message);
        req.flash('alertType', response.data.alertType);
        const newCampaign = response.data.object;
        logger.info(`Controller - Create WhatsApp Campaign: Created new campaign id=${newCampaign.id}, name=${newCampaign.name}`);
        logger.info(`Controller - Create WhatsApp Campaign: Redirecting to campaign details page for campaign id=${newCampaign.id}`);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.VIEW(newCampaign.id));
      }

      req.flash('message', response.data.message);
      req.flash('alertType', response.data.alertType);
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.CREATE);
    }
  } catch (error) {
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('message', 'Error submitting request in creating WhatsApp campaign');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.CREATE);
  }
};

