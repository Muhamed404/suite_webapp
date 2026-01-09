const typeOfFile = {
  Document: 1,
  PDF: 2,
  Excel: 3,
  DOS: 4,
  JavaScript: 10,
};

const phishingType = {
  SMS: 1,
  Email: 2,
  USB: 3,
  Whatsapp: 4,
  QR: 5,
  NFC: 6
};
const phishingTypeById = {
  1: 'SMS',
  2: 'Email',
  3: 'USB',
  4: 'Whatsapp',
  5: 'QR',
  6: 'NFC'
};
const phishingTypeByNames = {
  SMS: 'SMS',
  Email: 'Email',
  USB: 'USB',
  Whatsapp: 'Whatsapp',
  QR: 'QR',
  NFC: 'NFC'
};

const paymentStatus = {
  BankProgress: 1,
  Unpaid: 2,
  Paid: 3,
  InProgress: 4,
  Disputed: 5,
  Cancelled: 6,
  Free: 7,
};
const paymentStatusById = {
  1: 'BankProgress',
  2: 'Unpaid',
  3: 'Paid',
  4: 'InProgress',
  5: 'Disputed',
  6: 'Cancelled',
  7: 'Free'
};

const orderStatus = {
  CreateOrder: 0,
  PendingInvoice: 1,
  GenerateInvoice: 2,
  Active: 3,
  Cancelled: 4,
  SubscriptionCancelled: 5,
  SubscriptionExpired: 6,
};

const userType = {
  MagSuperAdmin: 1,
  MagSubAdmin: 2,
  OrgSuperAdmin: 3,
  OrgSubAdmin: 4,
  OrgUser: 5,
  GuestUser: 6,

};

const defaultOrganization = {
  SecureMagnus: 1
}

const defaultValues = {
  allDepartment: 0
}
const serviceTypes = {
  Phishing_ALL: 1,
  Phishing_Emails: 2,
  Phishing_Emails_SMS: 3,
  Phishing_Emails_SMS_Whatsapp: 4,
  LMS: 5,
  LMS_and_Phishing: 6,
  All: 7,
}

const phishingCategories = {
  SimplePhishing: 1,
  AttachmentBasedPhishing: 2,
  ClickURLPhishing: 3,
  DataEntryBasedPhishing: 4,
};

const phishingCategoriesName = {
  SimplePhishing: 'SimplePhishing',
  ClickURLPhishing: 'ClickURLPhishing',
  AttachmentBasedPhishing: 'AttachmentBasedPhishing',
  DataEntryBasedPhishing: 'DataEntryBasedPhishing',
};


const ModuleNames = {
  Application_Services: 'Application_Services',
  Package: 'Package',
  Organization: 'Organization',
  PROFILE_VIEW: 'ORGANIZATION PROFILE',
  User_Management: 'User Management',
  Organization_Suite_Mgmt: 'Suite Management',
  Department: 'Department',
  CyberSecurity: 'Cyber Security',
  SMTP: 'SMTP',
  Login_Access: 'Login',
  Subscription_History: 'Subscription_History',
  Organization_Settings: 'Organization_Settings',
  Order_Management: 'Order_Management',
  Invoice: 'Invoice',
  Subscription: 'Subscription',
  Audit_Log: 'Audit_Log',
  Group_Management: 'Group_Management',
  System_Template: 'System_Template',
  My_Template: 'My_Template',
  Campaign_Management: 'Campaign_Management',
  Campaign_Reports: 'Campaign_Reports',
  AWM_User_Migration: 'Awaremagnus_User_Migration',
  PHM_User_Migration: 'Phishmagnus_User_Migration',
  Service_Registry: 'Service_Registry',
  Campaign_SMS: 'Campaign_SMS',
  Campaign_Whatsapp: 'Campaign_Whatsapp',
}
const Access_Types = {
  RWD_ALL: 'RWD-ALL',
  RW_ALL: 'RW-ALL',
  R_ALL: 'R-ALL',
  No: 'No',
  R_O: 'R-O',
  RW_O: 'RW-O',
  RWD_O: 'RWD-O',
  R_P: 'R-P',
  RW_P: 'RW-P',
  RWD_P: 'RWD-P',
  YES: 'YES'

}

const Product_Selection = {
  All: 4,
  PhishMagnus: 2,
  AwareMagnus: 1,
  GRC: 3
}



const campaignUploadStatus = {

  InstantCampaign: 1,
  TestCampaign: 2,
  NFC_Campaign: 4,
  QR_Campaign: 5,
  Pending: 3,
  Completed: 6,
};

const campaignStatus = {
  3: 'Pending',
  6: 'Completed',
};


module.exports = {
  campaignUploadStatus,
  Product_Selection,
  Access_Types,
  ModuleNames,
  phishingCategoriesName,
  phishingCategories,
  serviceTypes,
  typeOfFile,
  defaultValues,
  phishingType,
  paymentStatus,
  orderStatus,
  userType,
  defaultOrganization,
  phishingTypeByNames,
  paymentStatusById,
  phishingTypeById,
  campaignStatus
};
