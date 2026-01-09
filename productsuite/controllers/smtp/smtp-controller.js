const {createSMTP} = require('./createSmtpController')
const {showAllSMTPByOrganization} = require('./list-smtp-configuration-organization')
const {testSMTPConnection} = require('./test-smtp-connection')


module.exports = {
  createSMTP,
  showAllSMTPByOrganization,
  testSMTPConnection
}