const QRCode = require("qrcode");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const qrData = "https://example.com"; // Your encoded URL or data
const qrOutputPath = path.resolve(__dirname, "hungerstation-logo-shadow-qrcode_with_logo.png");
const logoPath = path.resolve(__dirname, "hungerstation-logo-shadow.png"); // Ensure your logo is in the same folder
const tempQRPath = path.resolve(__dirname, "temp_qr.png");

async function generateQRWithLogo() {
    try {
        console.log("🔄 Generating QR Code...");
        
        // Generate QR code and save as PNG
        await QRCode.toFile(tempQRPath, qrData, {
            errorCorrectionLevel: "H", // High error correction for embedding logo
            margin: 6,
            scale: 10,
        });

        console.log("✅ QR Code generated successfully.");

        // Load QR code image and logo
        const qrImage = await Jimp.read(tempQRPath);
        const logo = await Jimp.read(logoPath);

        // Resize the logo
        const qrSize = qrImage.getWidth();
        const logoSize = qrSize / 4; // 25% of QR size
        logo.resize(logoSize, logoSize);

        // Create a white border around the logo
        const borderSize = Math.round(logoSize * 0.1); // 10% border
        const borderedLogo = new Jimp(logoSize + 2 * borderSize, logoSize + 2 * borderSize, 0xffffffff);
        borderedLogo.composite(logo, borderSize, borderSize);

        console.log("🔲 Logo resized and bordered.");

        // Embed the logo into the QR code center
        const x = (qrSize - borderedLogo.getWidth()) / 2;
        const y = (qrSize - borderedLogo.getHeight()) / 2;
        qrImage.composite(borderedLogo, x, y, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 1,
        });

        console.log("🖼️ Logo embedded into QR Code.");

        // Save the final QR code
        await qrImage.writeAsync(qrOutputPath);
        console.log(`✅ QR Code saved at: ${qrOutputPath}`);

        // Cleanup temporary file
        fs.unlinkSync(tempQRPath);
        console.log("🗑️ Temporary file removed.");
    } catch (error) {
        console.error("❌ Error generating QR Code:", error);
    }
}

// Run Function
generateQRWithLogo();
