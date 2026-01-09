const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os'); 
const getApiClient = require('../../../../utility/api-client')


exports.createAndDownloadUSBCampaignZipFile = async (req, res) => {
    try {
        logger.info('USB PHISHING DOWNLOADING METHOD ::: REQUEST RECEIVED');

        const user = req.user;
        const orgId = user.organization_id;
        const campId = req.params.campId;
        const usbCode = req.params.usbCode;

        const apiClient = getApiClient(req);
        const url = `/phm/campaign/usb/file-path/${orgId}/${campId}/${usbCode}`;

        logger.info("USB CREATE AND DOWNLOAD ZIP METHOD:::: Posting URL " + url);

        const response = await apiClient.get(url);
        const data = response.data.message;

        logger.info('USB PHISHING DOWNLOADING METHOD ::: RESPONSE ' + JSON.stringify(data));

        // Extract values
        const folderPath      = data.usbPhishingCampaignFolderPath;
        const exeSourcePath   = data.exeSourcePath;
        const exeFileName     = data.exeFileName;
        const fileContent     = data.fileContent;
        const fileName        = data.fileName;
        const zipFileName     = `${data.usbCampaignName}_${fileName}.zip`;

        const exeDestPath  = path.join(folderPath, exeFileName);
        const textFilePath = path.join(folderPath, 'data.txt');
        const zipFilePath  = path.join(folderPath, zipFileName);

        // Ensure directory exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Copy EXE
        fs.copyFileSync(exeSourcePath, exeDestPath);

        // Write data file
        fs.writeFileSync(textFilePath, fileContent);

        // Create ZIP
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on("error", err => {
            logger.error("ARCHIVE ERROR:", err);
            return res.status(500).send("Error creating ZIP file.");
        });

        output.on("close", () => {
            logger.info(`ZIP READY: ${zipFilePath}`);
            logger.info(`SIZE: ${archive.pointer()} bytes`);

            // Send the file
            res.download(zipFilePath, zipFileName, (err) => {
                if (err) {
                    logger.error("Download error:", err);
                }

                // Delay cleanup → prevents deleting ZIP too early
                setTimeout(() => {
                    try { fs.unlinkSync(exeDestPath); } catch {}
                    try { fs.unlinkSync(textFilePath); } catch {}
                    try { fs.unlinkSync(zipFilePath); } catch {}
                }, 3000);
            });
        });

        archive.pipe(output);
        archive.file(exeDestPath,  { name: exeFileName });
        archive.file(textFilePath, { name: "data.txt" });
        archive.finalize();

    } catch (error) {
        logger.error("USB DOWNLOAD ERROR:", error);
        return res.status(500).json({
            status: "failure",
            message: "Unexpected error"
        });
    }
};
