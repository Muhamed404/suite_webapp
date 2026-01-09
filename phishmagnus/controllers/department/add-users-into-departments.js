
const { logger } = require("../../../logger/logger");

exports.addUsersIntoDepartments = async (req, res) => {
  logger.info('INCOMING REQ ADD USERS INTO DEPT::')
  // const { departmentId } = req.params;
  // const { selectedUsers } = req.body; // Array of selected user IDs
  // logger.info(`INCOMING REQ ADD USERS INTO DEPT:: departmentId ${departmentId}`)
  // const config = require("../../../config/env.config");
  // 
  // const { logger } = require("../../../logger/logger");

  // exports.addUsersIntoDepartments = async (req, res) => {
  //   logger.info('INCOMING REQ ADD USERS INTO DEPT::')
  //   const { departmentId } = req.params;
  //   const { selectedUsers } = req.body; // Array of selected user IDs
  //   logger.info(`INCOMING REQ ADD USERS INTO DEPT:: departmentId ${departmentId}`)

  //   logger.info(`INCOMING REQ ADD USERS INTO DEPT:: length of selctedUsers ${selectedUsers.length}`)
  //   if (!selectedUsers || !Array.isArray(selectedUsers)) {
  //     return res.status(400).json({ success: false, message: 'Invalid users data' });
  //   }
  //   logger.info('INCOMING REQ ADD USERS INTO DEPT::BODY ' + selectedUsers)


  //   return res.status(200).json({ success: true });

  // };


  // if (!selectedUsers || !Array.isArray(selectedUsers)) {
  //   return res.status(400).json({ success: false, message: 'Invalid users data' });
  // }
  // logger.info('INCOMING REQ ADD USERS INTO DEPT::BODY ' + selectedUsers)


  // return res.status(200).json({ success: true });
  return res.status(400).json({ success: 'Delete code#####################' });
};
