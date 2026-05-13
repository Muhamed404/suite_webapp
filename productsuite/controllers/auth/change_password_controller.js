
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger"); 
const getApiClient = require('../../../utility/api-client'); 
const { redactEmail, redactLogData } = require("../../../utility/redact");

exports.changePassword = async (req, res, next) => {
  logger.info(`Incoming Req received in changePassword`);
  if (req.method === "GET") {
    try {
      logger.info("Entering into the changePassword method.");

      res.render("pages/login/change_password");
    } catch (error) {
      logger.error(`Error in changePassword method \n `, error);
      res.redirect("/phm/index");
    }
  } else if (req.method === "POST") {
    try {
      const apiClient = getApiClient(req);
      const { current_password, new_password } = req.body;
      logger.info(`Req body params values ${JSON.stringify(redactLogData(req.body), null, 2)}`);
      let user = req.user;
      let payload = {
        current_password,
        new_password,
        email: user.email,
      };
      logger.info('Change Password: Sending Payload: ' + JSON.stringify(redactLogData(payload)));

      const orgId = parseInt(req.user.organization_id);
      const email = req.user.email;
      logger.info('change password user data: ' + JSON.stringify(redactLogData(req.user)))
      let url = `/changePassword/${orgId}/${email}`;
      const redactedUrl = `/changePassword/${orgId}/${redactEmail(email)}`;
      logger.info(`submitting url: ` + redactedUrl);

      await apiClient.post(url, payload);
      req.session.destroy((err) => {
        if (err) {
          console.error("Error in change passsword destroying session:", err);
          res.redirect(
            "/logout?message=Password has changed&alertType=success"
          );
        }
        res.redirect(frontend_api_urls.LOGIN.PRODUCT_SUITE+'?message=Password has updated&alertType=success')
        // res.render("pages/login/psm_login", {
        //   message: "Password has updated.",
        //   alertType: "success",
        // });
      });
    } catch (error) {
      logger.error(`Issue in submitting change password post `, error);
      logger.error(error.message);
      res.redirect(
        "/logout?message=Error in Change Password&alertType=error"
      );
    }
  } else {
    logger.error(`Invalid Request in change password method`);
    res.redirect("/logout");
  }
};