module.exports = {
    AwareMagnud: {
        PRODUCT_DASHBOARD: 'dashboard/awm_product_dashboard',
        LOGOUT: 'logout',
        LOGIN: 'login/awm_login',

    },
    PhishMagnus: {
        PRODUCT_DASHBOARD: 'pages/dashboard/phm_product_dashboard',
        LOGIN: 'pages/login/phm_login',
        LOGOUT: '/logout',
        SMTP_PHISHING: {
            LIST: 'pages/settings/smtp/phishing/list-phishing-smtp',
            CREATE: 'pages/settings/smtp/phishing/create-phishing-smtp',
            EDIT: 'pages/settings/smtp/phishing/edit-phishing-smtp',
        },
        Campaign: {
            NFC: {
                CREATE: 'pages/campaign/nfc-campaign/createNFCCampaign',
                RENDER_TAG_REPORT: 'pages/campaign/nfc-campaign/view-nfc-device-report',
                REPORT: 'pages/campaign/nfc-campaign/campaign-report',
                VIEW: 'pages/campaign/nfc-campaign/view-nfc-campaign-details',
            },
            QR: {
                CREATE: 'pages/campaign/qr-campaign/create-qr-campaign',
                CAMPAIGN_REPORT: 'pages/campaign/qr-campaign/qr-campaign-report',
                VIEW_CAMPAIGN: 'pages/campaign/qr-campaign/view-qr-campaign-details',
                RENDER_TAG_REPORT: 'pages/campaign/qr-campaign/view-qr-tag-report',


            },
            USB: {
                RENDER_CREATE_FORM: 'pages/campaign/usb/create-usb-campaign',
                CAMPAIGN_VIEW_REPORT: 'pages/campaign/usb/usb-campaign-view',
                RENDER_USB_REPORT: `pages/campaign/usb/usb-campaign-report`

            },
            Email: {
                CREATE: 'pages/campaign/email-campaign/create',
                CAMPAIGN_REPORT: 'pages/campaign/email-campaign/email-campaign-report',
                USER_REPORT: 'pages/campaign/email-campaign/emailUserReport',
                VIEW_CAMPAIGN: 'pages/campaign/email-campaign/view-email-campaign-details',
            },
            SMS: {
                CREATE: 'pages/campaign/sms-campaign/create-sms-campaign',
                CAMPAIGN_REPORT: 'pages/campaign/sms-campaign/campaign-report',
                VIEW_CAMPAIGN: 'pages/campaign/sms-campaign/view-sms-campaign-details',


            },
            Whatsapp: {
                CREATE: 'pages/campaign/whatsapp/create-campaign',
                CAMPAIGN_REPORT: 'pages/campaign/whatsapp/campaign-report',
                VIEW_CAMPAIGN: 'pages/campaign/whatsapp/view-campaign-details',

            },
            All: {
                LIST: 'pages/campaign/all-campaigns',
            },
            Reports: {
                ALL_REPORTS: 'pages/campaign/reports/all-reports',
            },
            ReportedEmails: {
                LIST: 'pages/campaign/reported-emails/reported-emails-list',
                DETAIL: 'pages/campaign/reported-emails/reported-email-detail',
            }
        },
        System_Template: {
            VIEW: 'pages/system_template/system-templates-list',
            SHOW: 'pages/system_template/show-template',
            // EDIT: 'pages/system_template/viewSystemTemplate',
        },
        Department: {
            RENDER_DEPARTMENT_VIEW: 'pages/department/viewDepartment',
            RENDER_CREATE_FORM: 'pages/department/createDepartment',
        },
        Group_Management: {
            LIST: 'pages/group/viewGroup',
            CREATE: 'pages/group/createGroup',
        },
    },
    ProductSuiteManagement: {
        LOGIN: 'pages/login/psm_login',
        LOGOUT: '/logout',
        Home: `pages/product_suite_management/suite_management`,
        Domain_Management:{
            Render_List_DMS : 'pages/organization/domain_management/list-domain-management',
        },
        Service_Registry: {
            CREATE: 'pages/service_registry/create_service_registry',
            LIST: 'pages/service_registry/service_registry_list',
            EDIT_SERVICE: 'pages/service_registry/edit_service_registry',
        },
        Notification_Template: {
            LIST: 'pages/notification_template/list-notification-templates',
            CREATE: 'pages/notification_template/create-notification-template',
            EDIT: 'pages/notification_template/edit-notification-template',
        },
        Notification_Mail: {
            LIST: 'pages/notification_mail/list-notification-mails',
        },
        MFA_Mail: {
            LIST: 'pages/mfa/list-mfa-mails',
        },
        Package_Management: {
            CREATE: 'pages/package/create_package',
        },
        App_Service: {
            CREATE: 'pages/app_service/create_app_service',
            LIST: 'pages/app_service/list_app_service',
        },
        User_Management: {
            LIST_SECUREMAGNUS_USERS: 'pages/user_management/list-securemagnus-users',
            LIST: 'pages/user_management/list-user',
            BULK_UPLOAD: 'pages/user_management/upload-user',
            BULK_IMPORT_JOBS: 'pages/user_management/list-bulk-import-jobs',
            // CREATE: 'pages/user_management/addUser',
            CREATE_USER: 'pages/user_management/create-user', // This is new temporary file for new design
            CREATE_SECUREMAGNUS_USER: 'pages/user_management/create-securemagnus-user',
            EDIT_USER: 'pages/user_management/edit-user',
            LICENSED_USERS: 'pages/user_management/licensed-users'

        },
        Organization:
        {
            CREATE: 'pages/organization/create-organization',

        }
    }
};
