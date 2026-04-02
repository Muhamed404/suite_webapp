const { listDomains } = require('./list-domains');
const { createDomain } = require('./create-domain');
const { editDomain } = require('./edit-domain');
const { deleteDomain } = require('./delete-domain');
const { toggleDomain } = require('./toggle-domain');
const { toggleRestrict } = require('./toggle-restrict');

module.exports = { listDomains, createDomain, editDomain, deleteDomain, toggleDomain, toggleRestrict };
