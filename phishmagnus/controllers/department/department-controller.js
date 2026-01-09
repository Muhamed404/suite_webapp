const { fetchDepartment } = require("./fetch-department");
const { createDepartment } = require("./create-department");
const { renameDepartment } = require("./rename-department");
const { disableDepartment } = require("./disable-department");
const {addUsersIntoDepartments} = require('./add-users-into-departments')
const { enrolToDepartment } = require("./enrolToDepartment");
  
module.exports = {
  fetchDepartment,
  createDepartment,
  renameDepartment,
  disableDepartment,
  addUsersIntoDepartments,
  enrolToDepartment
}