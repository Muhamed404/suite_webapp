const { logger } = require("../../../../logger/logger");
const Jimp = require("jimp");
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const axios = require('axios');
const envConfig = require("../../../../config/env.config");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const getApiClient = require("../../../../utility/api-client");
const backend_api_urls = require("../../../../config/backend_api_urls");
const ApplicationConstants = require('../../../../contants/application-constants');

let apiClient = null;

exports.downloadQRImage = async (req, res) => {
  logger.info("QR DOWNLOAD IMAGE MODULE::: STARTED");
  try {
    if (req.method !== "GET") {
      logger.warn("QR DOWNLOAD IMAGE MODULE::: Only GET method is supported");
      return res.status(405).send("Method Not Allowed");
    }

    const user = req.user;
    const orgId = user?.organization_id;
    const qrCode = req.params.qrCode;

    logger.info(`[PARAMS] orgId: ${orgId}, qrCode: ${qrCode}`);
    logger.debug(`[SESSION] user: ${JSON.stringify(user)}`);

    if (!qrCode) {
      logger.error("[VALIDATION] Missing qrCode in request parameters");
      return res.redirect(`${frontend_api_urls.PHISHMAGNUS.Campaign.QR.RENDER_QR_REPORT}?message=Missing campaign or QR code&alertType=error`);
    }

    // Get filename for the uploaded logo
    logger.info("[API] Fetching QR image file name from backend...");
    apiClient = getApiClient(req);
    const fileName = await getQRImageFileName(apiClient, qrCode);
    if (!fileName) {
      logger.error("[API] QR image file name could not be retrieved.");
      req.flash('alertType', 'error');
      req.flash('message', 'QR image not found');
      return res.redirect(`${frontend_api_urls.PHISHMAGNUS.Campaign.QR.RENDER_QR_REPORT}`);
    }
    logger.info(`[FILE] QR image file name: ${fileName}`);

    logger.info(`[CONFIG] QR_PHISHING_CAMPAIGN_IMAGE_STORAGE_PATH: ${ApplicationConstants.QR_CODE_STORAGE_DIR}`);
    const logoPath = path.join(ApplicationConstants.QR_CODE_STORAGE_DIR, fileName);
    logger.info(`[FILE] Logo path resolved: ${logoPath}`);

    try {
      await fs.access(logoPath);
      logger.info(`[FILE] Logo file exists at: ${logoPath}`);
    } catch {
      logger.error(`[FILE] Logo file does not exist at path: ${logoPath}`);
      return res.redirect(`${frontend_api_urls.PHISHMAGNUS.Campaign.QR.RENDER_QR_REPORT}?message=Logo file not found&alertType=error`);
    }

    const tempDir = os.tmpdir();
    const qrFilePath = path.join(tempDir, `qr-${qrCode}.png`);
    const tempQRPath = path.join(tempDir, `temp_qr-${qrCode}.png`);
    logger.info(`[TEMP] tempDir: ${tempDir}`);
    logger.info(`[TEMP] qrFilePath: ${qrFilePath}`);
    logger.info(`[TEMP] tempQRPath: ${tempQRPath}`);

    // URL to be embedded in the QR code
    const tvbsQRURL = `${envConfig.BACKEND_TVBS_URL}/rq?iqr=${qrCode}`;
    logger.info(`[QR] QR Code TVBS System URL: ${tvbsQRURL}`);

    // Generate QR code image
    logger.info("[QR] Generating QR code image...");
    await QRCode.toFile(tempQRPath, tvbsQRURL, {
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 10,
    });
    logger.info(`[QR] Temporary QR code image generated at: ${tempQRPath}`);

    // Load the QR code and the uploaded logo
    logger.info("[IMAGE] Reading QR code and logo images...");
    const qrImage = await Jimp.read(tempQRPath);
    logger.info("[IMAGE] QR code image loaded.");
    const logo = await Jimp.read(logoPath);
    logger.info("[IMAGE] Logo image loaded.");

    // Resize logo
    const qrSize = qrImage.getWidth();
    const logoSize = qrSize / 4;
    logo.resize(logoSize, logoSize);
    logger.info(`[IMAGE] Logo resized to: ${logoSize}x${logoSize}`);

    // Add white border to logo
    const borderSize = Math.round(logoSize * 0.1);
    const borderedLogo = new Jimp(logoSize + 2 * borderSize, logoSize + 2 * borderSize, 0xffffffff);
    borderedLogo.composite(logo, borderSize, borderSize);
    logger.info(`[IMAGE] White border added to logo. Border size: ${borderSize}`);

    // Overlay the logo onto the QR code
    const x = (qrSize - borderedLogo.getWidth()) / 2;
    const y = (qrSize - borderedLogo.getHeight()) / 2;
    qrImage.composite(borderedLogo, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1,
    });
    logger.info(`[IMAGE] Logo composited onto QR code at position: (${x}, ${y})`);

    // Save the final QR code
    await qrImage.writeAsync(qrFilePath);
    logger.info(`[FILE] Final QR code saved at: ${qrFilePath}`);

    // Cleanup temporary QR file
    await fs.unlink(tempQRPath);
    logger.info(`[CLEANUP] Temporary QR code image deleted: ${tempQRPath}`);

    // Send the QR Code as a downloadable file
    logger.info("[RESPONSE] Sending QR code image as download...");
    res.download(qrFilePath, `qr-${qrCode}.png`, async (err) => {
      if (err) {
        logger.error(`[RESPONSE] Error during file download: ${err}`);
        req.flash('alertType', 'error');
        req.flash('message', 'Error in generating QR image');
        res.redirect(`${frontend_api_urls.PHISHMAGNUS.Campaign.QR.RENDER_QR_REPORT}`);
      } else {
        logger.info("[RESPONSE] QR code image download successful.");
      }

      // Cleanup: Delete the temporary QR code file after download
      try {
        await fs.unlink(qrFilePath);
        logger.info(`[CLEANUP] Temporary QR code file deleted: ${qrFilePath}`);
      } catch (unlinkErr) {
        logger.error(`[CLEANUP] Error deleting temporary file: ${unlinkErr}`);
      }
    });

  } catch (error) {
    logger.error("Error in downloading QR image");
    logger.error(`[EXCEPTION] ${error.message}`);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Error in generating QR image');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};

async function getQRImageFileName(apiClient, qrcode) {
  try {
    logger.info('[API] GET QR IMAGE FILE NAME: CALLING getQRImageFileName API');
    let url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.QR.DOWNLOAD_QR_CODE(qrcode);
    logger.info('[API] URL getQRImageFileName: ' + url);

    const response = await apiClient.get(url);
    logger.info('[API] API response: ' + JSON.stringify(response?.data, null, 2));

    if (!response || !response.data || !response.data.message) {
      logger.warn(`[API] GET QR IMAGE FILE NAME: RESPONSE IS NULL or invalid for qrcode=${qrcode}`);
      return null;
    } else {
      logger.info(`[API] QR image file name received: ${response.data.message}`);
      return response.data.message;
    }
  } catch (error) {
    logger.error(`[API] GET QR IMAGE FILE NAME: ERROR IN FETCHING for qrcode=${qrcode} - ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}