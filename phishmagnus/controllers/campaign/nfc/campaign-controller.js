
const { createNFCCampaign } = require('./create-nfc-campaign')
const { renderCampaignReport } = require('./render-nfc-campaign-report')
const { viewNFCCampaignDetails } = require('./view-nfc-campaign-details')
const{generateNFCDeviceReport} = require('./generate-nfc-device-report')
module.exports = {
  renderCampaignReport,
  createNFCCampaign,
  viewNFCCampaignDetails,
  generateNFCDeviceReport
}