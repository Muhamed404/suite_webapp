export interface CertificateTemplateAssets {
  logo?: string | null;
  bottomLogo?: string | null;
  border?: string | null;
  watermark?: string | null;
  stamp?: string | null;
  signature?: string | null;
}

export interface CertificateTemplateData {
  templateText: string;
  bgColor: string;
  assets: CertificateTemplateAssets;
  firstName?: string;
  lastName?: string;
  courseName?: string;
  completionDate?: string;
}

export const getProcessedText = (
  templateText: string,
  firstName: string,
  lastName: string,
  courseName: string,
  completionDate: string
) => {
  const defaultTemplate =
    "This is to certify that <%first_name%> <%last_name%> has successfully completed <%content_name%> on <%completion_date%>";
  const templateHtml = templateText?.trim() || defaultTemplate;

  return templateHtml
    .replace(/<%first_name%>/g, firstName)
    .replace(/<%last_name%>/g, lastName)
    .replace(/<%content_name%>/g, courseName)
    .replace(/<%completion_date%>/g, completionDate)
    .replace(/&lt;%first_name%&gt;/g, firstName)
    .replace(/&lt;%last_name%&gt;/g, lastName)
    .replace(/&lt;%content_name%&gt;/g, courseName)
    .replace(/&lt;%completion_date%&gt;/g, completionDate);
};

export const generateCertificateHtml = (data: CertificateTemplateData) => {
  const {
    templateText,
    bgColor = "#ffffff",
    assets,
    firstName = "John",
    lastName = "Doe",
    courseName = "Cybersecurity Awareness on Physical Security",
    completionDate = "1/27/2026",
  } = data;

  const logo = assets.logo || "";
  const bottomLogo = assets.bottomLogo || "";
  const stampLogo = assets.stamp || "";
  const signImage = assets.signature || "";
  const borderImage = assets.border || "";
  const watermarkImage = assets.watermark || "";

  const certificateText = getProcessedText(
    templateText,
    firstName,
    lastName,
    courseName,
    completionDate
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate Preview</title>
  <style>
    @media print {
      @page {
        size: 940px 690px;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: transparent !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .certificate-wrapper {
        padding: 0;
        margin: 0;
        display: block;
        min-height: auto;
      }
      .certificate-container {
        margin: 0;
        box-shadow: none !important;
      }
      .export-btn {
        display: none !important;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, "Times New Roman", serif;
      background-color: #f3f3f3;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .certificate-wrapper {
      position: relative;
    }

    .export-btn {
      position: absolute;
      top: -60px;
      right: 0;
      padding: 10px 24px;
      border-radius: 999px;
      border: none;
      background: #0ea5e9;
      color: white;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(14,165,233,0.35);
      z-index: 100;
      font-family: inherit;
    }

    .export-btn:hover {
      background: #0284c7;
    }

    .certificate-container {
      position: relative;
      width: 900px;
      height: 650px;
      background-color: ${bgColor};
      color: #333;
      border: 20px solid transparent;
      box-shadow: 0 4px 25px rgba(0,0,0,0.2);
      overflow: hidden;
      margin: 0 auto;
    }

    /* Proper border image */
    .certificate-container {
      ${
        borderImage
          ? `
      border-image-slice: 30;
      border-image-repeat: round;
      border-image-width: 20px;
      border-image-source: url('${borderImage}');
      `
          : `border: 2px solid #ccc;`
      }
    }

    /* Background watermark */
    .certificate-watermark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      ${watermarkImage ? `background-image: url('${watermarkImage}');` : ""}
      background-repeat: no-repeat;
      background-position: center;
      background-size: 60%;
      opacity: 0.15;
      z-index: 0;
      pointer-events: none;
    }

    /* Top logo */
    .certificate-top-logo {
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      height: 80px;
      z-index: 2;
      object-fit: contain;
    }

    /* Bottom logo */
    .certificate-bottom-logo {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      height: 60px;
      z-index: 2;
      object-fit: contain;
    }

    .certificate-content {
      position: relative;
      z-index: 1;
      padding: 140px 60px 80px 60px;
      text-align: center;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .certificate-title {
      font-size: 36px;
      font-weight: bold;
      color: #333;
      margin-bottom: 30px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .certificate-text {
      font-size: 20px;
      line-height: 1.6;
      color: #444;
      margin: 20px auto;
      width: 85%;
    }
    
    /* Handle Quill's p tags inside the templateText */
    .certificate-text p {
      margin-bottom: 10px;
    }

    .certificate-signature-area {
      position: absolute;
      bottom: 60px;
      left: 60px;
      right: 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      z-index: 2;
    }

    .certificate-sign {
      text-align: center;
      min-width: 200px;
    }
    
    .certificate-sign-line {
      width: 200px;
      height: 1px;
      background-color: #333;
      margin: 10px auto;
    }

    .certificate-sign img {
      height: 60px;
      object-fit: contain;
      margin-bottom: 5px;
    }

    .certificate-stamp {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 120px;
      opacity: 0.85;
      object-fit: contain;
    }

  </style>
</head>
<body>
  <div class="certificate-wrapper">
    <button class="export-btn" onclick="window.print()">Download Certificate</button>
    <div class="certificate-container" style="background-color: ${bgColor};">
      <!-- Watermark -->
      <div class="certificate-watermark"></div>

      <!-- Top Logo -->
      ${logo ? `<img class="certificate-top-logo" src="${logo}" alt="Logo">` : ""}

      <!-- Bottom Logo -->
      ${bottomLogo ? `<img class="certificate-bottom-logo" src="${bottomLogo}" alt="Bottom Logo">` : ""}

      <!-- Content -->
      <div class="certificate-content">
        <div class="certificate-title">Certificate of Completion</div>
        <div class="certificate-text">
          ${certificateText}
        </div>
      </div>

      <!-- Signature + Stamp -->
      <div class="certificate-signature-area">
        <div class="certificate-sign">
          ${signImage ? `<img src="${signImage}" alt="Signature">` : '<div style="height: 60px;"></div>'}
          <div class="certificate-sign-line"></div>
          <small>Authorized Signature</small>
        </div>
        
        <div class="certificate-sign">
          <!-- secondary signature if needed -->
          <div class="certificate-sign-line"></div>
          <small>Date</small>
        </div>
      </div>
      
      <!-- Stamp in the middle -->
      ${stampLogo ? `<img src="${stampLogo}" alt="Stamp" class="certificate-stamp">` : ""}

    </div>
  </div>
</body>
</html>
  `;
};
