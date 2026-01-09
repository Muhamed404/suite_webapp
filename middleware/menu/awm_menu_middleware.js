const { logger } = require("../../logger/logger");
const enums = require('../../contants/enum')


function generateAwareMagnusMenu(req, organization) {
  const role = req.user.role.id;
  logger.info(`[Aware Magnus Menu] GENERATE MENU FOR USER ROLE ${role} FOR ORG ${organization}`);

  // Define menu once; visibility controlled by allowedRoles
  const productMenu2 = [
    {
      module: "Dashboard",
      label: "Dashboard",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/icons/second-menu-dashboard-active.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin, enums.userType.MagSubAdmin],
    },
    {
      module: "Licensed Users",
      label: "Licensed Users",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/Icon_License.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin],
    },
    {
      module: "Servery or Broadcast Management",
      label: "Servery or Broadcast Management",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/icons/primary-suit.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin],
    },
    {
      module: "Training Content Library",
      label: "Training Content Library",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/icons/primary-suit.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin, enums.userType.MagSubAdmin],
    },
    {
      module: "My Content Library",
      label: "My Content Library",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/Icon_Template.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin],
    },
    {
      module: "Certificate Management",
      label: "Certificate Management",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/icons/primary-suit.svg",
      allowedRoles: [enums.userType.MagSuperAdmin],
    },
    {
      module: "Training Campaigns",
      label: "Training Campaigns",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/icons/primary-suit.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin],
    },
    {
      module: "Reports",
      label: "Reports",
      link: "/awm/home",
      img_path: "/securemagnus_2025/images/Icon_Template.svg",
      allowedRoles: [enums.userType.MagSuperAdmin, enums.userType.OrgSuperAdmin, enums.userType.MagSubAdmin],
    },
  ];

  // Filter menu items by current role
  const filteredMenu = productMenu2.filter(item => item.allowedRoles.includes(role));

  return { productMenu2: filteredMenu };
}


module.exports = { generateAwareMagnusMenu };
