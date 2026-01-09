const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const { currentDateTime, currentDate, currentTime } = require("../../../phishmagnus/utility/common-functions");
const enums = require('../../../contants/enum');

const config = require("../../../config/env.config");
const path = require('path');
const fs = require('fs');



exports.displayPhishingPage = async (req, res) => {
  logger.info(`TVBS DISPLAY PHISHING PAGE::: INCOMING REQUEST`);
  const queryInviteeId = req.query.invitee;
  const queryCampaignUniqueCode = req.query.campaign;
  logger.info(`TVBS DISPLAY PHISHING PAGE::: INCOMING QUERY PARAMTERS INVITEE : ${queryInviteeId}, CAMPAIGN UNIQUE CODE: ${queryCampaignUniqueCode}`);
  //const users = await SMApplicationUsers.findAll();
  const baseUrl = config.BACKEND_TVBS_URL;
  const params = {
    invitee: queryInviteeId,
    campaign: queryCampaignUniqueCode
  };

  // Construct the URL with query parameters
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  // Print the URL
  logger.info('Posting TVBS DISPLAY URL:' + url.toString());
  return Promise.all([axios.get(url.toString())])
    .then(([response]) => {
      let campaignDetails = response.data.message;
      logger.info(`TVBS DISPLAY PHISHING PAGE::: DETAILS OF RESPONSE : ${JSON.stringify(campaignDetails)}`);

      const first_name = campaignDetails.Phishing_Invities[0].User.UserProfile.first_name;
      const last_name = campaignDetails.Phishing_Invities[0].User.UserProfile.last_name;
      const email = campaignDetails.Phishing_Invities[0].User.UserProfile.email;
      const current_date = currentDate;
      const current_time = currentTime;
      const sender = campaignDetails.Templates.sender_display_name;
      const company = campaignDetails.Templates.company_name;
      const company_domain = campaignDetails.Templates.company_domain;
      // Let's assume the template path comes from the backend response (could be dynamic)
      const dynamicPhishingWebPageTemplatePath = campaignDetails.Templates.phishing_page_url;

      // Ensure the file exists
      if (fs.existsSync(dynamicPhishingWebPageTemplatePath)) {
        // Render the EJS file using the absolute path
        res.render(dynamicPhishingWebPageTemplatePath, {
          first_name, last_name, email, current_date, current_time, sender, company, company_domain
        });
      } else {
        res.status(404).render('pages/404', { message: 'Page Not Found' });
      }

      // res.redirect(`/campaign/email?message=${message}&alertType=${alertType}&alertSwal=true`);
    })
    .catch((error) => {
      logger.error(`${error.message}`);
      logger.error(error);
      logger.error(error.stack);
      res.status(404).render('pages/404', { message: 'Page Not Found' });
    });

  // logger.info('TVBS DISPLAY PHISHING PAGE::: FOUND CAMPAIGN DETAILS \n'+ JSON.stringify(campaignDetails))
  // return next(APIResponse(campaignDetails,ICONSTANTS.HTTP_OK,'info'))
};


exports.test = async (req, res) => {
  logger.info(`TVBS DISPLAY PHISHING PAGE::: INCOMING REQUEST`);
  res.send('Phishing Page');

  // logger.info('TVBS DISPLAY PHISHING PAGE::: FOUND CAMPAIGN DETAILS \n'+ JSON.stringify(campaignDetails))
  // return next(APIResponse(campaignDetails,ICONSTANTS.HTTP_OK,'info'))
};
