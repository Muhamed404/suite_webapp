const { logger } = require("../../logger/logger");
const enums = require('../../contants/enum')

function generatePhishMagnusMenu(req, organization) {
  const role = req.user.role.id;
  logger.info(`[phm_menu_middleware] GENERATE MENU FOR USER ROLE ${role} FOR ORG ${organization}`);

  // Define once; visibility controlled by allowedRoles
  const productMenu = [
    {
      module: "Dashboard",
      labelKey: "menu.phishmagnus.dashboard",
      link: "/phm/index",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/Dashboard_Soli.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin, enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
    {
      module: "Campaigns",
      labelKey: "menu.phishmagnus.campaigns",
      link: "/phm/campaign/all-campaigns",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/Campaign_Sold.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
    {
      module: "Licensed Users",
      labelKey: "menu.phishmagnus.licensedUsers",
      link: "/user/licensed-users/phm",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/Licensed_user_Solid.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
    {
      module: "My Templates",
      labelKey: "menu.phishmagnus.templates",
      link: "/phm/template/list",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/Template_Solid.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
    {
      module: "System Template",
      labelKey: "menu.phishmagnus.systemTemplate",
      link: "/template/list",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/System_Template_Solid.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin, enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
    {
      module: "Simulator Emails",
      labelKey: "menu.phishmagnus.simulatorEmails",
      link: "/phm/phishing-smtp/list",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/Simulator_Emails_Solid.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin, enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
    {
      module: "Reports",
      labelKey: "menu.phishmagnus.reports",
      link: "/phm/campaign/reports",
      img_path: "/securemagnus_2025/images/phishmagnus_sidebar/Report_Solid.svg",
      allowedRoles: [enums.userType.OrgSuperAdmin, enums.userType.OrgSubAdmin],
    },
  ];

  // Filter by current role
  const filtered = productMenu
    .filter(item => item.allowedRoles.includes(role))
    .map(item => ({
      ...item,
      label: req.__(item.labelKey)
    }));
  return { productMenu: filtered };
}

module.exports = { generatePhishMagnusMenu };
