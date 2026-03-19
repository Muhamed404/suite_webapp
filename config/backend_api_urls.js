
const config = require('./env.config');

module.exports = {
    BASE_API_URL: config.BACKEND_EP,
    PRODUCT_SUITE: {
        LICENSE_INFORMATION: '/suite/management/information',
        PRODUCT_SUITE_DASHBOARD: '/phm/dashboard/',
        ORGANIZATION:{
            Active_Organization_List: '/organization/active/names',
        },
        SERVICE_REGISTRY: {
            CREATE: '/service-registry/create',
            LIST: '/service-registry/',
            UPDATE_SERVICE: (serviceId) => `/service-registry/update/${serviceId}`,
            RENDER_UPDATE_FORM: (service_id, registry_id) => `/service-registry/retrieve-service/${service_id}/r/${registry_id}`,
            DELETE_SERVICE: (registry_id, service_id) => `/service-registry/delete/r/${registry_id}/s/${service_id}`,

        },
        CYBERSECURITY: {
            FILE_POSTERS_UPLOAD: '/cybersecurity/filePostersUpload',
            CATEGORIES: {
                LIST: '/cybersecurity/categories/list',
                CREATE: '/cybersecurity/categories/create',
                UPDATE: (catId) => `/cybersecurity/categories/update/${catId}`,
                DELETE: (catId) => `/cybersecurity/categories/delete/${catId}`
            }
        },

        PACKAGE_MANAGEMENT: {
            CREATE: '/package/',
        },
        Application: {
            LIST: '/application/list',
            CREATE: '/application/create',
        },
        Application_Service: {
            LIST: '/app_service/list',
            CREATE: '/app_service/create',
            DELETE: '/app_service/delete',
        },

        Subscription: {
            Order: {
                Update_Invoice: (orgId, subscriptionId, orderId) => `/order/update-invoice/${orgId}/${subscriptionId}/${orderId}`
            },
            Find_Balance_By_Organization: (orgId) => `/subscription/find-balance/${orgId}`,
        },
        LICENSE_INFORMATION: {
            RETRIEVE_BY_PRODUCT_ENUM_KEY: (selectedProductKey) => `/license/retrieve/information/${selectedProductKey}`,
        },
        User_Management: {
            ENROLLED_PHM_USERS: `/user/retrieved-enrolled-users`,
            UNENROLLED_PHM_USERS: `/user/retrieved-unenrolled-users`,
            SAVE_ENROLLMENT: (hasRequestedToUnenroll) => `/user/update-license-status/${hasRequestedToUnenroll}`,
            DELETE: (userId) => `/user/delete/${userId}`,
            LIST_SUITE_USERS: (organization) => `/user/suite-users/${organization}`,
            RETRIEVE_USER_BY_ID: (userId) => `/user/show/${userId}`,
            SAVE_EDIT_USER: (userId) => `/user/update/${userId}`,
            LICENSED_USERS_BY_PRODUCT: (productId) => `/user/licensed-users/${productId}`,
            LIST_SECUREMAGNUS_USERS: `/user/securemagnus-users`,
            CREATE_SECUREMAGNUS_USER: `/user/securemagnus-users/create`,

        },
        Audit_Log: {
            VIEW_LOGS: (queryParams) => `/audit?${queryParams.toString()}`,
        },
        User_Roles: {
            User_Role_By_Organization: (organizationId) => `/user/role/organization/${organizationId}`,
        },
        Template: {
            LIST: '/template/list',
            VIEW: (templateId) => `/template/view/${templateId}`,
            CLONE: (templateId) => `/template/duplicate/${templateId}`,
            UPDATE: (templateId) => `/template/update/${templateId}`,
            CREATE: `/template/create`,
            DELETE: (templateId) => `/template/delete/${templateId}`,
            TEMPLATES_BY_CAMPAIGN_TYPE: (organizationId, phishingCampaignType) => `/template/organization/${organizationId}/campaign-type/${phishingCampaignType}`,


            PHM_LIST: '/template/phm/list',
            PHM_CREATE: `/template/phm/create`,
            PHM_UPDATE: (templateId) => `/template/phm/update/${templateId}`,
            PHM_DELETE: (templateId) => `/template/phm/delete/${templateId}`,
            PHM_VIEW: (templateId) => `/template/phm/view/${templateId}`,
            SYSTEM_TEMPLATES_BY_CAMPAIGN_TYPE: (phishingCampaignType) => `/template/system-bycampaign-type/${phishingCampaignType}`,

        },
        SMS: {
            CREATE: (organizationId) => `/sms/settings/create/${organizationId}`,
            UPDATE: (organizationId) => `/sms/settings/${organizationId}`,
        }

    },
    PHISHMAGNUS: {
        DASHBOARD_STATISTICS: '/phm/dashboard/',

        GROUPS: {
            FIND_GROUP_BY_ORGANIZATION: (orgId) => `/group/findByOrganization/${orgId}`,
            CREATE: '/group/create',
            ASSIGNED_USERS_BY_GROUP: (groupId) => `/group/assignedUsersByGroup/${groupId}`,
            UNASSIGNED_USERS_BY_GROUP: `/group/getUnassignedUser`,
            EnrolUserToGroup: (groupId, hasRequestedToUnenroll) => `/group/enrolUserToGroup/${groupId}/${hasRequestedToUnenroll}`,
        },
        CAMPAIGN: {
            SMS: {
                CREATE: '/phm/campaign/sms/create',
                RENDER_REPORT: (queryParams) => `/phm/campaign/sms/report?${queryParams.toString()}`,
                VIEW: (campaignId) => `/phm/campaign/sms/report/campaign/${campaignId}`,
                INVITEES: (campaignId) => `/phm/campaign/sms/invitees/${campaignId}`,

            },
            Whatsapp: {
                CREATE: '/phm/campaign/whatsapp/create',
                RENDER_REPORT: (queryParams) => `/phm/campaign/whatsapp/report?${queryParams.toString()}`,
                VIEW: (campaignId) => `/phm/campaign/whatsapp/report/campaign/${campaignId}`,
                INVITEES: (campaignId) => `/phm/campaign/whatsapp/invitees/${campaignId}`,

            },
            NFC: {
                CREATE: '/phm/campaign/nfc/create',
                RENDER_REPORT: (queryParams) => `/phm/campaign/nfc/report?${queryParams.toString()}`,
                RETRIEVE_NFC_DEVICES_BY_CAMPAIGN: (campId) => `/phm/campaign/nfc/retrieve/nfc-devices-code/${campId}`,
                CAMPAIGN_REPORT_DETAILS: (campId) => `/phm/campaign/nfc/report/view/${campId}`,
                TAG_REPORT: (campaignId, nfcDeviceCode) => `/phm/campaign/nfc/device/report/${campaignId}/${nfcDeviceCode}`,

            },
            QR: {
                CREATE: '/phm/campaign/qr/create',
                RENDER_REPORT: (queryParams) => `/phm/campaign/qr/report?${queryParams.toString()}`,
                CAMPAIGN_REPORT_DETAILS: (campId) => `/phm/campaign/qr/report/view/${campId}`,
                RETRIEVE_QR_CODES_BY_CAMPAIGN: (campId) => `/phm/campaign/qr/retrieve/qr-images/${campId}`,
                TAG_REPORT: (campaignId, qrImageCode) => `/phm/campaign/qr/tag/report/${campaignId}/${qrImageCode}`,

                // CAMPAIGN_INTERACTION_STATS_BY_EACH_QR: (campId) => `/phm/campaign/qr/report/by-qr/stats/${campId}`,

                // CAMP_USER_INTERACT_STATISTICS: (campId) => `/phm/campaign/qr/view/statistics/${campId}`,
                DOWNLOAD_QR_CODE: (qrcode) => `/phm/campaign/qr/download/qr-images/${qrcode}`
            },
            USB: {
                CREATE: `/phm/campaign/usb/usb-create`,
                RENDER_REPORT: (queryParams) => `/phm/campaign/usb/report?${queryParams.toString()}`,
                CAMPAIGN_REPORT_DETAILS: (campaignIdentifier) => `/phm/campaign/usb/report-view/${campaignIdentifier}`,


            },
            EMAIL: {
                CREATE: `/phm/campaign/email/create`,
                USER_REPORT: (inviteeId, campId) => `/phm/campaign/email/user/campaign/report/${inviteeId}/${campId}`,
                RENDER_EMAIL_CAMPAIGN_REPORT: `/phm/campaign/email/report/`,
                VIEW_EMAIL_CAMPAIGN_DETAILS_STATS: (campId) => `/phm/campaign/email/detail/statistic/${campId}`,
                PHISHING_USER_DETAIL: (campId) => `/phm/campaign/email/user/detail/${campId}`,
            }
        },
        DEPARTMENT: {
            Find_Department_By_Organization: (orgId) => `/department/list/${orgId}`,
            CREATE: '/department/',
            ASSIGNED_USERS_BY_DEPARTMENT: (orgId, deptId) => `/department/assigned-users/${orgId}?department=${deptId}`,
            UNASSIGNED_USERS_BY_ORGANIZATION: (orgId) => `/department/unassigned-users/${orgId}`,
            EnrolUserToDepartment: (departmentId, hasRequestedToUnenroll) => `/department/enrolUserToDepartment/${departmentId}/${hasRequestedToUnenroll}`,
        }, 
        THREAT_REPORTER: {
            LIST_BY_ORGANIZATION: (orgId) => `/phm/threat-reporter/${orgId}/organization`,
            REPORT_DETAIL: (reportId) => `/phm/threat-reporter/${reportId}/report`,
        },
        PHISHING_SMTP: {
            LIST: (orgId) => `/phm/phishing-smtp/organization/${orgId}`,
            CREATE: (orgId) => `/phm/phishing-smtp/create/${orgId}`,
            DETAIL: (smtpId) => `/phm/phishing-smtp/detail/${smtpId}`,
            UPDATE: (smtpId) => `/phm/phishing-smtp/edit/${smtpId}`,
            DELETE: (smtpId) => `/phm/phishing-smtp/delete/${smtpId}`,
            TEST: (smtpId) => `/phm/phishing-smtp/test-connection/${smtpId}`,
        },

    }
};
