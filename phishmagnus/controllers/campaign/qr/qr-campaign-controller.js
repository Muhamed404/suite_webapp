

// const { qrModule } = require('./create-qr-campaign')
const { createCampaign, submitForm } = require('./create-qr-campaign')
const { renderQRCampaignReport } = require('./render-qr-campaign-report')
const { viewQRCampaignDetails } = require('./view-qr-campaign-details')
// const { nfcReportCampaign, qrReportCompletedCampaign } = require('./qr-report-campaign');
const { generateQRTagReport } = require('./generate-qr-tag-report.js');
const {downloadQRImage} = require('./download-qr-image.js')

module.exports = {
  submitForm,
  createCampaign,
  renderQRCampaignReport,
  viewQRCampaignDetails,
  // qrReportCompletedCampaign,
  generateQRTagReport,
  downloadQRImage,

  // qrModule
}