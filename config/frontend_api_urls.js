const config = require('./env.config')
module.exports = {

    LOGIN: {
        PRODUCT_SUITE: '/login',
        PRODUCT_SUITE_DEFAULT: '/',
        PHISHMAGNUS: '/phm/login',
        AWAREMAGNUS: '/awm/login',
    },
    LOGOUT: {
        SIGNOUT: '/logout',
    },
    PRODUCT_SUITE: {
        Home: {
            INDEX: '/home',
        },
        User_Management: {
            CREATE_USER: '/user/create',
            // LIST_USERS: '/user/list',
            SUITE_USERS: '/user/suite-users',
            SECUREMAGNUS_USERS_LIST: '/user/securemagnus-users',
            CREATE_SECUREMAGNUS_USER: '/user/securemagnus-users/create',
            EDIT_USER: (userId) => `/user/show/${userId}`,
        },
        Service_Registry: {
            CREATE: '/service-registry/create',
            LIST: '/service-registry/',
            EDIT_SERVICE: (serviceId) => `/service-registry/update/${serviceId}`,
        },
        Subscription: {
            CREATE: (organizationId) => `/subscription/create/${organizationId}`,
            PROFILE: (organizationId) => `/organization/profile/${organizationId}`,
        },
        System_Template: {
            LIST: '/template/list',
            CLONE: (templateId, organizationId) => `/template/duplicate/${templateId}/${organizationId}`,
            EDIT: (templateId) => `/template/edit/${templateId}`,
            CREATE: '/template/create',
        },
        App_Service: {
            CREATE: '/app_service/create',
            LIST: '/app_service/list',
            EDIT_SERVICE: (serviceId) => `/app-service/update/${serviceId}`,
        },
        Package_Management: {
            CREATE_PACKAGE: '/package/create',
            LIST_PACKAGES: '/package/list',
            EDIT_PACKAGE: (packageId) => `/package/edit/${packageId}`,
        },

    },
    PHISHMAGNUS: {
        Home: {
            INDEX: '/phm/index',
        },
        Template: {
            LIST: '/phm/template/list',
        },
        SMTP_PHISHING: {
            Create_Action_URL: (organizationId) => `/phm/phishing-smtp/create/${organizationId}`,
            CREATE: '/phm/phishing-smtp/create',
            LIST: `/phm/phishing-smtp/list`,
            EDIT: (smtpId) => `/phm/phishing-smtp/edit/${smtpId}`,
            TEST: (smtpId) => `/phm/phishing-smtp/test/${smtpId}`,
        },
        Campaign: {
            SMS: {
                CREATE: '/phm/campaign/sms/create',
                VIEW: (campaignId) => `/phm/campaign/sms/report/campaign/${campaignId}`,
                RENDER_SMS_REPORT: `/phm/campaign/sms/list`,
            },
            Whatsapp: {
                CREATE: '/phm/campaign/whatsapp/create',
                VIEW: (campaignId) => `/phm/campaign/whatsapp/report/campaign/${campaignId}`,
                RENDER_WHATSAPP_REPORT: `/phm/campaign/whatsapp/report`,
            },
            NFC: {
                CREATE: `/phm/campaign/nfc/create`,
                VIEW: `/phm/campaign/nfc/report`,
            },
            QR: {
                DOWNLOAD_QR_URL: (qr_code) => `/phm/campaign/qr/download/${qr_code}`,
                RENDER_QR_REPORT: `/phm/campaign/qr/list`,
                VIEW: (campaignId) => `/phm/campaign/qr/details/${campaignId}`,
                CREATE: `/phm/campaign/qr/create`
            },
            USB: {
                CREATE: `/phm/campaign/usb/`,
                REPORT: `/phm/campaign/usb/report`,

            },
            EMAIL: {
                EMAIL_REPORT: (campId) => `/phm/campaign/details/${campId}`
            }

        },
        Department: {
            List: `/department/list`,
        },
        Group: {
            List: `/group/list`,
        }

    },
};
