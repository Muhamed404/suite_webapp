const backend_api_urls = require("../../../config/backend_api_urls");

const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');

exports.createDepartment = async (req, res, next) => {
  logger.info('Incoming Request for create department');
  const apiClient = getApiClient(req);
  const organization = req.user.organization_id;

  if (req.method === "GET") {
    const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.Find_Department_By_Organization(organization);

    try {
      const response = await apiClient.get(url);
      const departments = response.data?.message || [];
      logger.info(`[Department GET] Retrieved ${departments.length} departments for organization ${organization}`);
      logger.info(`[Department GET] Departments Data: ${JSON.stringify(departments, null, 2)}`);
      logger.info(`[Department GET] Rendering create department form`);
      return res.render(render_ejs_urls.PhishMagnus.Department.RENDER_CREATE_FORM, {
        enableSuiteManagementLeftMenu: true,
        departments,
        organization,
        organizationName: req.query?.On || ''
      });
    } catch (error) {
      logger.error(`[Department GET] ${error.message}`);
      logger.error('Exception:' + error.stack)
      req.flash("message", "Error loading departments");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Department.List);
    }
  } else if (req.method === "POST") {
    logger.info('Incoming POST body for creating department');

    const department = {
      name: req.body.name,
      description: req.body.description,
      departmentParent: req.body.dept,
      organization: organization
    };

    logger.info(`[Department POST] Payload: ${JSON.stringify(department, null, 2)}`);
    const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.CREATE;

    try {
      await apiClient.post(url, department);

      req.flash("message", 'Department has created successfully');
      req.flash("alertType", 'success');
      logger.info(`[Department POST] Department created successfully, redirecting to list`);
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Department.List);
    } catch (error) {
      logger.error(`[Department POST] ${error.message}`);
      logger.error('Exception:' + error.stack)
      const message = "Error creating department";
      const alertType = "error";
      req.flash("message", message);
      req.flash("alertType", alertType);
      return res.redirect(
        `${frontend_api_urls.PHISHMAGNUS.Department.List}`
      );
    }
  }
};
