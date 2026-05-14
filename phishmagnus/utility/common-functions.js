
const { PDFDocument, rgb } = require('pdf-lib');
const { logger } = require("../../logger/logger");
const { redactEmail } = require("./redact");

const getApiClient = require("../../utility/api-client");


async function getStateByCounty(req, res) {
  try {
    logger.info("inside getStateByCounty");
    const id = parseInt(req.params.countryId);
    logger.info(id);
    logger.info(`inside create org get`);
    const url = `/phm/commons/state/${id}`;
    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    const states = response.data.states;
    logger.info(JSON.stringify(states));
    return res.status(200).json({ states: states });
  } catch (err) {
    logger.error("Error fetching states:" + err);
    throw err; // Rethrow the error for handling in the caller
  }
}

async function getCityByState(req, res) {
  try {
    logger.info("inside getCityByState");
    const id = parseInt(req.params.selectedStateId);
    logger.info(id);
    logger.info(`inside create org get`);
    const url = `/phm/commons/city/${id}`;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)

    const cities = response.data.cities;

    return res.status(200).json({ cities: cities });
  } catch (err) {
    logger.error("Error fetching getCityByState:" + err);
    throw err; // Rethrow the error for handling in the caller
  }
}













async function getCategories(req, res) {
  try {
    logger.info("inside getCategories");
    const phishingType = req.params?.selectedPhishingType || 0;
    const url = `/phm/settings/templates/get-phishing-categories/${phishingType}`;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    const categories = response.data.message;
    return res.status(200).json({ categories });
  } catch (err) {
    logger.info(err.message);
    logger.error("Error fetching getCategories:" + err.stack);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getRawHtml(req, res) {
  try {
    logger.info("getRawHtml function");

    let url = req.params.url;
    let lang = req.params.lang;
    logger.info(`incoming url in getting raw html \n ${url} , ${lang}`);
    // Set the Accept-Language header to specify English
    const config = {
      headers: {
        "Accept-Language": `${lang},en;q=0.9`, // Specify the language preference here
      },
    };

    const response = await axios.get(url, config);
    let rawHtml = response.data;
    //logger.info(rawHtml);

    res.send(rawHtml);
  } catch (err) {
    logger.error("check internet connection");
    logger.error(err.message);
    logger.error("Fetching getting GetRawHtml:" + err.stack);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
async function fetchPhishingPagesByOrganization(req, res) {
  try {
    logger.info("start receving phishing pages");

    let lang = req.params.lang;

    let orgId = req.user.organization_id;

    const url = `/phm/settings/templates/getPhishingPages/${orgId}/${lang}`;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    //logger.info(response)
    let pages = response.data.message;
    logger.info(`fetched phishing pages \n ${JSON.stringify(pages)}`);
    //logger.info(rawHtml);

    res.status(200).json({ pages });
  } catch (err) {
    logger.error("check internet connection");
    logger.error(err.message);
    logger.error(
      "Fetching getting fetchPhishingPagesByOrganization:",
      err.stack
    );
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function validateUserAndOrganization(req) {
  try {
    logger.info("start receving validateUserAndOrganization");
    const { organizationId } = req.params;

    let userId = req.user.id;
    logger.info(organizationId, userId);

    let url = `/phm/commons/validateUser/${parseInt(
      userId
    )}/${parseInt(organizationId)}`;

    logger.info(`calling url request ${url}`);

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    //logger.info(response)
    let isValidated = response.data.message;
    if (!isValidated) {
      //logger.error(`throwing error`)
      throw new Error("user and organization verification has failed");
    }

    return true;
  } catch (err) {
    logger.error("exception in validateUserAndOrganization");
    logger.error(err.message);
    //logger.error(err.stack);
    throw err;
  }
}

// Function to generate and download PDF
async function generatePDF(req, res) {
  try {
    // Get HTML content from request body or generate dynamically
    const htmlContent = req.body.htmlContent; // Example: req.body.htmlContent

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Embed HTML content as a PDF page
    const pdfBytes = await pdfDoc.save();

    // Send PDF file as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    res.send(pdfBytes);
  } catch (error) {
    logger.error("Error generating PDF:" + error);
    res.status(500).send("Error generating PDF");
  }
}



async function checkDuplicateUser(req, res) {
  try {
    logger.info("[checkDuplicateUser]: start receving check Duplicate User for email:");
    const email = req.query.email;
    const redactedEmail = redactEmail(email);
    logger.info(`[checkDuplicateUser]: email: ${redactedEmail}`);
    let url = `/phm/commons/check-duplicate-user?email=` + email;
    const redactedUrl = `/phm/commons/check-duplicate-user?email=` + redactedEmail;
    logger.info(`[checkDuplicateUser]: calling url request ${redactedUrl}`);

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    //logger.info(response)
    let isProfileExist = response.data.message;
    if (isProfileExist === 'true') {
      logger.warn('[checkDuplicateUser]: Email already registerd for the email ' + redactedEmail)
      res.json({ isDuplicate: "true" });
    } else {
      logger.info('[checkDuplicateUser]: Email not registerd for the email ' + redactedEmail)
      res.json({ isDuplicate: "false" });
    }
  } catch (err) {
    logger.error("[checkDuplicateUser]: Exception is check duplicate user request");
    logger.error(err.stack);
    res.status(400).json({ message: 'Issue in fetching user.' });
  }
}

async function checkDuplicateOrganization(req, res) {
  try {
    logger.info("start receving check Duplicate Organization for name:" + req.query.name);
    const name = req.query.name;
    let url = `/phm/commons/check-duplicate-organization?name=` + name;
    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    let organization = response.data.message;
    if (organization === 'true') {
      logger.warn('Organization already registerd for the name ' + name)
      res.json({ isDuplicate: "true" });
    } else {
      logger.info('Organization not registerd for the name ' + name)
      res.json({ isDuplicate: "false" });
    }
  } catch (err) {
    logger.error("Exception is check duplicate Organization request");
    logger.error(err.stack);
    res.status(400).json({ message: 'Issue in fetching Organization.' });
  }
}

const QRCode = require('qrcode');

async function generateQRCode(data) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data); // Generates a Data URL
    return qrCodeDataURL; // This can be used in an image tag or saved to the database
  } catch (err) {
    logger.error("Error generating QR Code: " + err);
    throw err;
  }
}




module.exports = {

  generateQRCode,
  getStateByCounty,
  getCityByState,
  getCategories,
  getRawHtml,
  fetchPhishingPagesByOrganization,
  validateUserAndOrganization,
  generatePDF,
  checkDuplicateUser,
  checkDuplicateOrganization,
};
