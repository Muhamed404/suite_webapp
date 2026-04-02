const {createSMTP} = require('./create-organization-smtp-controller')
const {showAllSMTPByOrganization} = require('../../../phishmagnus/controllers/phishing_smtp/list-phishing-smtp-controller')
const {testOrganizationSMTPConnection} = require('./test-smtp-connection')


module.exports = {
  createSMTP,
  showAllSMTPByOrganization,
  testOrganizationSMTPConnection
}