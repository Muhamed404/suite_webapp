const { generatePhishMagnusMenu } = require('./phm_menu_middleware');
const { generateSuiteManagementMenu } = require('./suite_management_menu_middleware');

/**
 * Combines suite and productMenu menus for a user role.
 * @param {object} req - Express request object (with session)
 * @param {string|number} organization - Organization identifier
 * @returns {object} { suite: [...], productMenu: [...] }
 */
function generateMenu(req, organization) {
  // Get suite menu (may be {suite: [...]})
  
  const suiteMenuObj = generateSuiteManagementMenu(req, organization);
  // Get productMenu menu (may be {productMenu: [...]}, or an array)
  let phmMenuObj = [];
  if (req.user.phm_license) {
    phmMenuObj = generatePhishMagnusMenu(req, organization);
    logger.info(`Phish Magnus Menu Object: ${phmMenuObj.productMenu.length}`);
  }

  // Extract suite and productMenu arrays safely
  const suite = suiteMenuObj && suiteMenuObj.suite ? suiteMenuObj.suite : [];
  const productMenu = phmMenuObj && phmMenuObj.productMenu ? phmMenuObj.productMenu : (
    Array.isArray(phmMenuObj) ? phmMenuObj : []
  );
  // logger.info(`Generated Suite Menu: ${JSON.stringify(suite, null, 2)}`);
  // logger.info(`Generated Product Menu: ${JSON.stringify(productMenu, null, 2)}`);
  return { suite, productMenu };
}

module.exports = { generateMenu };