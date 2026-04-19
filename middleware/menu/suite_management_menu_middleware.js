const { logger } = require("../../logger/logger");
const enums = require('../../contants/enum')

function generateSuiteManagementMenu(req, organization) {
  const role = req.user.role.id;
  logger.info(`[Product Suite Menu] GENERATE MENU FOR USER ROLE ${role} FOR ORG ${organization}`);

  // 🔹 Define menu once with allowedRoles
  const suiteMenu = [
    {
      module: "Suite Management",
      labelKey: "menu.suite.suiteManagement",
      link: "/home",
      img_path: "/securemagnus_2025/images/icons/primary-suit.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin, enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Package",
      labelKey: "menu.suite.package",
      link: "/package/list",
      img_path: "/securemagnus_2025/images/icons/primary_group.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin]
    },
    {
      module: "Services",
      labelKey: "menu.suite.services",
      link: "/app_service/list",
      img_path: "/securemagnus_2025/images/icons/Icon_Service_Management.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin]
    },
    {
      module: "Organization",
      labelKey: "menu.suite.organization",
      link: "/organization/",
      img_path: "/securemagnus_2025/images/icons/primary-organization.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin]
    },
    {
      module: "User",
      labelKey: "menu.suite.user",
      link: "/user/securemagnus-users",
      img_path: "/securemagnus_2025/images/icons/primary-uses.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin]
    },
    {
      module: "Bulk import jobs",
      labelKey: "menu.suite.bulkImportJobs",
      link: "/user/bulk-import/jobs",
      img_path: "/securemagnus_2025/images/icons/primary-uses.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin]
    },
    {
      module: "Categories",
      labelKey: "menu.suite.cybersecurityCategories",
      link: "/cybersecurity/categories/list",
      img_path: "/securemagnus_2025/images/icons/Icon_Cybersecurity_Categories.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin]
    },
    {
      module: "Organization Settings",
      labelKey: "menu.suite.organizationSettings",
      link: "/organization/profile",
      img_path: "/securemagnus_2025/images/icons/primary-organization.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Users",
      labelKey: "menu.suite.users",
      link: "/user/suite-users",
      img_path: "/securemagnus_2025/images/icons/primary-uses.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Bulk import jobs",
      labelKey: "menu.suite.bulkImportJobs",
      link: "/user/bulk-import/jobs",
      img_path: "/securemagnus_2025/images/icons/primary-uses.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Department",
      labelKey: "menu.suite.department",
      link: `/department/list`,
      img_path: "/securemagnus_2025/images/icons/primary-department.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Groups",
      labelKey: "menu.suite.groups",
      link: "/group/list",
      img_path: "/securemagnus_2025/images/icons/primary_group.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Subscription History",
      labelKey: "menu.suite.subscriptionHistory",
      link: "/organization/subscription-history",
      img_path: "/securemagnus_2025/images/icons/primary_subscription.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Products",
      labelKey: "menu.suite.products",
      link: "/home",
      img_path: "/securemagnus_2025/images/icons/primary_products.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Notification Mail Log",
      labelKey: "menu.suite.notificationMailLog",
      link: "/notification-mail",
      img_path: "/securemagnus_2025/images/icons/second-menu-template.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin]
    },
    {
      module: "Settings",
      labelKey: "menu.suite.settings",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin],
      img_path: "/securemagnus_2025/images/icons/Icon_Service_Management.svg",
      children: [
        {
          labelKey: "menu.suite.serviceRegistry",
          link: "/service-registry/"
        },
        {
          labelKey: "menu.suite.smtpNotifications",
          link: "/settings/smtp/"
        },
        {
          labelKey: "menu.suite.notificationTemplates",
          link: "/notification-template/"
        },
        {
          labelKey: "menu.suite.notificationMailLog",
          link: "/notification-mail"
        }
      ]
    }
  ];

  // 🔹 Filter menu items by current role
  const filteredMenu = suiteMenu
    .filter(item => item.allowedRoles.includes(role))
    .map(item => {
      const translatedItem = {
        ...item,
        label: req.__(item.labelKey)
      };
      if (item.children) {
        translatedItem.children = item.children.map(child => ({
          ...child,
          label: req.__(child.labelKey)
        }));
      }
      return translatedItem;
    });

  return { suite: filteredMenu };
}


module.exports = { generateSuiteManagementMenu };
