
const { logger } = require("../../../logger/logger");
 
const getApiClient = require('../../../utility/api-client')
exports.organizationalStatistics = async (req, res) => {
  let user = req.user;
  let orgId = req.params.orgId === undefined ? user.organization_id : req.params.orgId;
  const apiClient = getApiClient(req);
  if (isMagAdmin(req.user.role.id)) {

    const statisticsUrl = `/phm/dashboard/statistics/${orgId}`;
    // Fetch statistics data using Promises
    apiClient.get(statisticsUrl)
      .then((statisticsResponse) => {
        const statistics = statisticsResponse.data.message.statistics; // Assuming response data has the stats you need

        // Extract YearMonth and values
        const yearMonths = ['x']; // for x-axis labels
        const campaignInitiated = ['campaignInitiated'];
        const openEmail = ['openEmail'];
        const clickEmail = ['clickEmail'];
        const interactForm = ['interactForm'];
        const formSubmit = ['formSubmit'];
        const attachmentOpen = ['attachmentOpen'];

        statisticsResponse.data.message.organizationalAssessment.forEach(item => {
          yearMonths.push(item.YearMonth + '-01');
          campaignInitiated.push(item.Count);
          openEmail.push(item.is_phish_msg_opened)
          clickEmail.push(item.is_phish_msg_link_opened);
          interactForm.push(item.is_phish_msg_data_entered_in_form);
          formSubmit.push(item.is_phish_msg_data_entered_submited_in_form);
          attachmentOpen.push(item.is_phish_msg_file_downloaded);
        });

        res.render("pages/organization/statistics-organizational", {
          statistics,
          yearMonths,
          campaignInitiated,
          openEmail,
          clickEmail,
          interactForm,
          formSubmit,
          attachmentOpen
        });
      })
      .catch((error) => {
        logger.error(`Issue in fetching statistics: ${error.message}`);
        return res.redirect("/phm/");
      });

  }
}