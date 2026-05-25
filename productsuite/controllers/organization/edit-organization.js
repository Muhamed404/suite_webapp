
const config = require("../../../config/env.config");
const ICONSTANT = require("../../../contants/ICONSTANTS");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const { redactLogData } = require("../../../utility/redact");
exports.editOrganization = async (req, res) => {
  logger.info(`EDIT ORGANIZATION: INCOMING REQUEST`);
  if (req.method === "GET") {
    try {
      logger.info(`EDIT ORGANIZATION: INCOMING GET`);


      const organizationId = req.params?.organizationId || 0;

      if (!organizationId) {
        logger.warn("EDIT ORGANIZATION: Missing organization ID in route params");
        return res.render("pages/404", {
          message: "Invalid Organization ID",
          alertType: "error",
        });
      }

      const fetchOrganizationUrl = `/organization/get-organization-details-by-id/${organizationId}`;

      const apiClient = getApiClient(req);
      const response = await apiClient.get(fetchOrganizationUrl);

      const { status, message: organizationDetails } = response.data;

      if (status !== 200 || !organizationDetails) {
        logger.error("EDIT ORGANIZATION: Backend returned invalid data");
        return res.render("pages/error", {
          message: "Failed to fetch organization details",
          alertType: "error",
        });
      }

      logger.info(`EDIT ORGANIZATION: Data fetched successfully for Org ID ${organizationId}`);

      return res.render("pages/organization/edit-organization/edit-organization", {
        enableSuiteManagementLeftMenu: true,
        profileId: organizationId,
        organizationDetails,
      });
    } catch (error) {
      logger.error("EDIT ORGANIZATION: " + redactLogData(error.message));
      logger.error(redactLogData(error.stack));

      return res.status(500).render("pages/404", {
        message: "Internal Server Error while editing organization",
        alertType: "error",
      });
    }
  } else if (req.method === 'POST') {
    logger.info(`EDIT ORGANIZATION: INCOMING POST`);
    const organizationId = req.params?.organizationId || 0;

    const payload = {
      address: req.body.address,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      postalCode: parseInt(req.body.postalCode),
      contact: req.body.contact
    };

    if (req.body.password) {
      payload.password = req.body.password;
    }
    logger.info(`EDIT ORGANIZATION: FINAL PAYLOAD:${JSON.stringify(redactLogData(payload))}`);

    try {

      const apiClient = getApiClient(req);
      const response = await apiClient.post(`/organization/edit/${organizationId}`, { payload });
      if (response.status !== ICONSTANT.HTTP_CREATED) {
        logger.warn('Error in updating organization')
        throw Error('Error in updating the organization')

      }
      logger.info('EDIT ORGANIZATION: ORGANIZATION HAS BEEN UPDATE');
      req.flash('message', req.__('organization.edit.successMessage'));
      req.flash('alertType', 'success');
      res.redirect(`/organization/profile/${organizationId}`);
    } catch (error) {
      logger.error("Error creating organization:" + redactLogData(error.stack));
      req.flash('message', req.__('organization.edit.errorMessage'));
      req.flash('alertType', 'error');
      res.redirect(`/organization/profile/${organizationId}`);
    }
  }
};