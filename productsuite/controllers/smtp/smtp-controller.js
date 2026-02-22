const {createSMTP} = require('./createSmtpController')
const {showAllSMTPByOrganization} = require('../../../phishmagnus/controllers/phishing_smtp/list-phishing-smtp-controller')
const {testSMTPConnection} = require('./test-smtp-connection')


module.exports = {
  createSMTP,
  showAllSMTPByOrganization,
  testSMTPConnection
}