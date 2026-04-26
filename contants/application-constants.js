const path = require("path");
const envConfig = require('../config/env.config');
const SECURE_MAGNUS_WORKSPACE = envConfig.SECURE_MAGNUS_WORKSPACE;


const WORK_SPACE_FOLDER_NAMES = {
  ORGANIZATION: "organization",
  SECURE_MAGNUS: "secure_magnus",
  PHISHMAGNUS: "phishmagnus",
  TEMPLATES: "templates",
  SYSTEM_FILES: "system_files",
  POSTERS_LIBRARY: "posters_library",
  ATTACHMENT_BASED_FILES: "attachment_based_files",
  USER_FOLDER: "import_users_files",
  QR_CODE_STORAGE: "qr_code_storage",
  USB_PHISHING_EXE: "usb_phishing_exe"
}

const TVB_Main_Routes = {
  NFC: '/fc',
  QR: '/rq',
  EMAIL: '/em',
  SMS: '/ms',
  Whatsapp: '/wp',
  USB: '/sb'
}

const TVB_Sub_Routes = {
  Download_File_URL: '/dfurl',
  Open_Email_URL: '/ourl',
  Attachment_URL: '/aurl'
}

const TVB_Query_Params = {
  Invitee_Id: 'inv',
  Campaign_Id: 'cid',
  NFC_Device_Code: 'ifc'
}



const QR_CODE_STORAGE_DIR = path.join(SECURE_MAGNUS_WORKSPACE, WORK_SPACE_FOLDER_NAMES.QR_CODE_STORAGE);
const POSTERS_LIBRARY_DIR = path.join(SECURE_MAGNUS_WORKSPACE, WORK_SPACE_FOLDER_NAMES.POSTERS_LIBRARY);
const PHISHMAGNUS_USERS_IMPORT_FILES = path.join(SECURE_MAGNUS_WORKSPACE, WORK_SPACE_FOLDER_NAMES.USER_FOLDER);
// const BACKEND_NFC_TVBS_URL = envConfig.BACKEND_TVBS_URL + '/nfc/';
const BACKEND_TVBS_URL = envConfig.BACKEND_TVBS_URL;
const BACKEND_SUITE_PUBLIC_KEY = envConfig.BACKEND_SUITE_PUBLIC_KEY;
const COOKIE_JWT_TOKEN_EXPIRY = envConfig.COOKIE_JWT_TOKEN_EXPIRY;
// console.log('Application Constants loaded with COOKIE_JWT_TOKEN_EXPIRY:', COOKIE_JWT_TOKEN_EXPIRY);



const NotificationTypes = [
  "OTP_LOGIN", "WELCOME_ADMIN", "PHM_CAMPAIGN","WELCOME_USER","AWM_CAMPAIGN_INVITE","AWM_SURVEY_INVITE"
];



module.exports = {
  NotificationTypes,
  COOKIE_JWT_TOKEN_EXPIRY,
  BACKEND_SUITE_PUBLIC_KEY,
  BACKEND_TVBS_URL,
  // BACKEND_NFC_TVBS_URL,
  QR_CODE_STORAGE_DIR,
  POSTERS_LIBRARY_DIR,
  PHISHMAGNUS_USERS_IMPORT_FILES,
  TVB_Main_Routes,
  TVB_Query_Params,
  TVB_Sub_Routes
}