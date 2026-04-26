const {create} = require('./create-user')
const {submitCreationForm} = require('./create-user')
// const {renderUserList} = require('./render-user-list')
const {renderBulkUserModule} = require('./render-bulk-user-module')
const {uploadBulkUsers} = require('./render-bulk-user-module')
const { renderBulkImportJobs } = require('./render-bulk-import-jobs')
const { retrieveEnrolledPHMUsers } = require('./retrieve-enrolled-phm-users')
const { retrieveUnEnrolledPHMUsers } = require('./retrieve-unenrolled-phm-users')
const {saveUserAllocationLicense} = require('./save-user-allocation-license')
module.exports = {
  saveUserAllocationLicense,
  retrieveUnEnrolledPHMUsers,
  retrieveEnrolledPHMUsers,
  create,
  submitCreationForm,
  // renderUserList,
  renderBulkUserModule,
  uploadBulkUsers,
  renderBulkImportJobs
};