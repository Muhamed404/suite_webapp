"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
    Languages,
    Palette,
    Image as ImageIcon,
    Box,
    Waves,
    CheckCircle2,
    Pencil,
    Upload,
    Eye,
    Type,
    Sparkles,
    X,
    FileText,
    History,
    FileImage
} from "lucide-react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { certificateService } from "@/services/certificateService";
import { getCertificateAssetUrl } from "@/utils/contentAssetUrl";
import { AuthImage } from "@/components/ui/auth-image";

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="h-44 bg-slate-50 animate-pulse border border-slate-200 rounded-2xl" />
});
import "react-quill-new/dist/quill.snow.css";

interface ImageUploadPillProps {
    label: string;
    icon: React.ReactNode;
    initialUrl?: string | null;
    onImageChange: (file: File | null, previewUrl: string | null) => void;
}

function ImageUploadPill({ label, icon, initialUrl, onImageChange }: ImageUploadPillProps) {
    const [preview, setPreview] = useState<string | null>(initialUrl || null);
    const [fileName, setFileName] = useState(initialUrl ? "Existing asset" : "No file chosen");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialUrl) {
            setPreview(initialUrl);
            setFileName("Existing asset");
        }
    }, [initialUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = reader.result as string;
                setPreview(url);
                onImageChange(file, url);
            };
            reader.readAsDataURL(file);
        } else {
            setFileName("No file chosen");
            setPreview(null);
            onImageChange(null, null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
            <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-2">
                {icon}
                {label}
            </div>

            <div className="flex items-center gap-3">
                {/* preview */}
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-300 text-lg overflow-hidden shrink-0">
                    {preview ? (
                        <AuthImage src={preview} alt="preview" className="object-contain" fill resolveUrl={false} />
                    ) : (
                        <ImageIcon size={20} />
                    )}
                </div>

                {/* file pill */}
                <div className="flex-1 flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 pl-4 pr-2 py-2 min-w-0">
                    <span className="text-[11px] text-slate-400 truncate mr-2">
                        {fileName}
                    </span>

                    <label className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 shrink-0">
                        <Upload size={12} />
                        <span>Choose File</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}

export function CertificateBrandingForm() {
    const tMenu = useTranslations("dashboard");
    const params = useParams();
    const router = useRouter();
    const certificateId = params?.id ? parseInt(params.id as string) : null;
    const isEdit = !!certificateId;

    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [language, setLanguage] = useState("1"); // Use numeric ID as string for select
    const [bgColor, setBgColor] = useState("#ffffff");
    const [templateText, setTemplateText] = useState("<p>This is to certify that <strong>&lt;%first_name%&gt; &lt;%last_name%&gt;</strong></p><br/><p>has successfully completed <strong>&lt;%content_name%&gt;</strong> on <strong>&lt;%completion_date%&gt;</strong></p>");

    const [assets, setAssets] = useState({
        logo: null as string | null,
        border: null as string | null,
        watermark: null as string | null,
        stamp: null as string | null,
        signature: null as string | null,
    });

    const [files, setFiles] = useState({
        logo: null as File | null,
        border: null as File | null,
        watermark: null as File | null,
        stamp: null as File | null,
        signature: null as File | null,
    });

    useEffect(() => {
        if (isEdit) {
            const fetchCertificate = async () => {
                setIsLoading(true);
                try {
                    const response = await certificateService.getCertificateById(certificateId!);
                    if (response.success && response.data) {
                        const cert = response.data;
                        setLanguage(cert.lang_id.toString());
                        setBgColor(cert.bg_color || "#ffffff");
                        setTemplateText(cert.template_text);
                        setAssets({
                            logo: cert.top_logo_url ? getCertificateAssetUrl(cert.top_logo_url) : null,
                            border: cert.border_image_url ? getCertificateAssetUrl(cert.border_image_url) : null,
                            watermark: cert.bg_watermark_url ? getCertificateAssetUrl(cert.bg_watermark_url) : null,
                            stamp: cert.stamp_logo_url ? getCertificateAssetUrl(cert.stamp_logo_url) : null,
                            signature: cert.sign_image_url ? getCertificateAssetUrl(cert.sign_image_url) : null,
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch certificate:", error);
                    addToast({
                        title: "Error",
                        description: "Failed to load certificate data",
                        color: "danger"
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCertificate();
        }
    }, [isEdit, certificateId]);

    const quillModules = useMemo(() => ({
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'align': [] }],
            ['clean']
        ],
    }), []);

    const getProcessedText = (firstName: string, lastName: string, courseName: string, completionDate: string) => {
        const defaultTemplate = 'This is to certify that <%first_name%> <%last_name%> has successfully completed <%content_name%> on <%completion_date%>';
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

    const generateCertificateHtml = () => {
        const firstName = "John";
        const lastName = "Doe";
        const topic = "Physical Security";
        const courseName = "Cybersecurity Awareness on Physical Security";
        const completionDate = "1/27/2026";
        
        const bottomLogo = assets.logo || '';
        const stampLogo = assets.stamp || '';
        const signImage = assets.signature || '';
        const certificateText = getProcessedText(firstName, lastName, courseName, completionDate);

        return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background-color: #f5f5f5;
        padding: 20px;
        font-family: Arial, sans-serif;
      }
      .certificate-wrapper {
        position: relative;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .export-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 24px;
        border-radius: 999px;
        border: none;
        background: #0ea5e9;
        color: white;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(14,165,233,0.35);
        z-index: 100;
      }
      .certificate-container {
        position: relative;
        padding: 20px;
        width: 100%;
        max-width: 900px;
        background-color: ${bgColor};
        border: 4px solid #999;
        box-shadow: 0 4px 25px rgba(0,0,0,0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        margin-top: 60px;
      }
      .certificate-header {
        background: #ffffff;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: auto;
        min-height: 150px;
      }
      .certificate-header-img {
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
      }
      .certificate-content {
        padding: 40px 40px 60px;
        text-align: center;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .topic-section {
        margin-bottom: 20px;
      }
      .topic-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #64748b;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }
      .topic-label i {
        font-size: 16px;
      }
      .topic-title {
        font-size: 48px;
        font-weight: bold;
        color: #1e293b;
        margin-bottom: 20px;
      }
      .divider {
        width: 200px;
        height: 2px;
        background-color: #cbd5e1;
        margin: 0 auto 30px;
      }
      .certification-text {
        font-size: 16px;
        color: #475569;
        line-height: 1.8;
        margin-bottom: 20px;
        letter-spacing: 0.5px;
      }
      .user-name {
        font-size: 24px;
        font-weight: bold;
        color: #1e293b;
        margin-top: 20px;
      }
      .signature-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 30px;
        margin-top: 40px;
        padding-top: 20px;
      }
      .signature-item {
        flex: 1;
        text-align: center;
      }
      .signature-line {
        width: 100%;
        height: 2px;
        background-color: #94a3b8;
        margin-bottom: 8px;
      }
      .signature-img {
        height: 50px;
        margin-bottom: 8px;
      }
      .signature-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }
      .logo-placeholder {
        width: 160px;
        height: 160px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 8px;
        color: #94a3b8;
        font-size: 28px;
      }
      .stamp {
        width: 70px;
        height: 70px;
        border: 3px solid #dc2626;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 8px;
        transform: rotate(15deg);
        font-size: 10px;
        font-weight: bold;
        color: #dc2626;
        text-align: center;
        line-height: 1.2;
      }
      .stamp-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      /* Added overlays for Watermark and Border */
      .certificate-border {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        ${assets.border ? `background-image: url('${assets.border}'); background-size: 100% 100%;` : ''}
      }
      .certificate-watermark {
        position: absolute;
        top: 55%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50%;
        height: 50%;
        opacity: 0.08;
        pointer-events: none;
        z-index: 0;
        ${assets.watermark ? `background-image: url('${assets.watermark}'); background-size: contain; background-repeat: no-repeat; background-position: center;` : ''}
      }
      @media print {
        .export-btn { display: none; }
        body { background: white; padding: 0; }
        .certificate-wrapper { padding: 0; margin: 0; }
        .certificate-container { margin: 0; box-shadow: none; width: 100%; max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="certificate-wrapper">
      <button class="export-btn" onclick="window.print()">Export PDF</button>
      
      <div class="certificate-container">
        <div class="certificate-border"></div>
        <div class="certificate-watermark"></div>

        <!-- Header -->
        <div class="certificate-header">
          <img src="/images/coc.png" alt="Certificate of Completion" class="certificate-header-img" onerror="this.src='https://placehold.co/1000x250/0ea5e9/ffffff?text=CERTIFICATE+OF+COMPLETION'" />
        </div>

        <!-- Content -->
        <div class="certificate-content" style="position: relative; z-index: 10;">
          <div>
            <!-- Topic Section -->
            <div class="topic-section">
              <div class="topic-label">
                <i class="bi bi-bookmark"></i>
                <span>Topic</span>
              </div>
              <h2 class="topic-title">${topic}</h2>
              <div class="divider"></div>
            </div>
            
            <!-- Certification Text -->
            <div class="certification-text">
              ${certificateText}
            </div>
            
            <!-- User Name -->
            <div class="user-name">${firstName} ${lastName}</div>
          </div>
          
          <!-- Signature Row -->
          <div class="signature-row">
            <div class="signature-item">
              ${signImage ? `<img src="${signImage}" alt="Signature" class="signature-img" style="width: 100%; height: auto; max-height: 50px; object-fit: contain; margin-bottom: 8px;">` : `<div class="signature-line"></div>`}
              <div class="signature-label">Authorized Signature</div>
            </div>
            
            <div class="signature-item">
              <div class="logo-placeholder">
                ${bottomLogo ? `<img src="${bottomLogo}" alt="Logo" style="width: 170px; height: 170px; object-fit: contain;">` : `<i class="bi bi-building"></i>`}
              </div>
            </div>
            
            <div class="signature-item">
              ${stampLogo ? `<img src="${stampLogo}" alt="Stamp" class="stamp-img" style="width: 70px; height: 70px; margin: 0 auto 8px; transform: rotate(15deg);">` : `<div class="stamp">OFFICIAL<br/>STAMP</div>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
    };

    const handlePreview = () => {
        const htmlContent = generateCertificateHtml();
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.open();
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        } else {
            addToast({
                title: "Error",
                description: "Pop-up blocked. Please allow pop-ups to see the preview.",
                color: "warning"
            });
        }
    };

    const handleAssetChange = (key: keyof typeof assets) => (file: File | null, url: string | null) => {
        setAssets(prev => ({ ...prev, [key]: url }));
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("lang_id", language);
        formData.append("template_text", templateText);
        formData.append("bg_color", bgColor);

        if (files.logo) formData.append("top_logo", files.logo);
        if (files.border) formData.append("border_image", files.border);
        if (files.watermark) formData.append("bg_watermark", files.watermark);
        if (files.stamp) formData.append("stamp_logo", files.stamp);
        if (files.signature) formData.append("sign_image", files.signature);

        try {
            let response;
            if (isEdit) {
                response = await certificateService.updateCertificate(certificateId!, formData);
            } else {
                response = await certificateService.createCertificate(formData);
            }

            if (response.success) {
                addToast({
                    title: "Success",
                    description: `Certificate template ${isEdit ? 'updated' : 'created'} successfully`,
                    color: "success"
                });
                router.push("/dashboard/system-branding/certificate");
            }
        } catch (error) {
            console.error("Failed to save certificate:", error);
            addToast({
                title: "Error",
                description: "Failed to save certificate template",
                color: "danger"
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-3">
                    {/* Breadcrumb */}
                    <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0">
                        <span className="hover:text-gray-700 transition cursor-pointer">Training Library</span>
                        <span className="text-gray-400">›</span>
                        <span className="hover:text-gray-700 transition cursor-pointer">System Library</span>
                        <span className="text-gray-400">›</span>
                        <span className="hover:text-gray-700 transition cursor-pointer">Branding</span>
                        <span className="text-gray-400">›</span>
                        <span className="font-semibold text-gray-900">Certificate Configuration</span>
                    </nav>

                    <div className="flex flex-col p-3 py-0 gap-0.5 mb-4">
                        <h3 className="text-xl font-semibold">Certificate Branding Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                        {/* LEFT: FORM */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-[22px] px-2 py-2 space-y-4">
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    {/* Language */}
                                    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                                                <Languages size={18} className="text-sky-500" />
                                                Language
                                            </span>

                                            <div className="relative w-48">
                                                <select
                                                    className="w-full px-4 py-1.5 text-xs border border-gray-200 rounded-full bg-white transition-all focus:outline-none focus:ring-1 focus:ring-sky-500 appearance-none h-9 cursor-pointer"
                                                    value={language}
                                                    onChange={(e) => setLanguage(e.target.value)}
                                                    disabled={isEdit} // Lang ID often cannot be changed after creation
                                                >
                                                    <option value="1">English</option>
                                                    <option value="2">Arabic</option>
                                                    <option value="3">French</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Background Color */}
                                    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Palette size={18} className="text-sky-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold text-slate-700">
                                                        Background Color
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 capitalize">
                                                        {bgColor === "#ffffff" ? "White" : bgColor}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-9 h-5 rounded-full border border-slate-200"
                                                    style={{ backgroundColor: bgColor }}
                                                ></div>

                                                <label
                                                    htmlFor="bgColorInput"
                                                    className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-400 text-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                                >
                                                    <Sparkles size={16} />
                                                </label>
                                                <input
                                                    id="bgColorInput"
                                                    type="color"
                                                    value={bgColor}
                                                    onChange={(e) => setBgColor(e.target.value)}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <ImageUploadPill
                                        label="Logo"
                                        icon={<ImageIcon size={18} className="text-sky-500" />}
                                        initialUrl={assets.logo}
                                        onImageChange={handleAssetChange("logo")}
                                    />
                                    <ImageUploadPill
                                        label="Border Image"
                                        icon={<Box size={18} className="text-sky-500" />}
                                        initialUrl={assets.border}
                                        onImageChange={handleAssetChange("border")}
                                    />
                                    <ImageUploadPill
                                        label="Background Watermark"
                                        icon={<Waves size={18} className="text-sky-500" />}
                                        initialUrl={assets.watermark}
                                        onImageChange={handleAssetChange("watermark")}
                                    />
                                    <ImageUploadPill
                                        label="Stamp Logo"
                                        icon={<CheckCircle2 size={18} className="text-sky-500" />}
                                        initialUrl={assets.stamp}
                                        onImageChange={handleAssetChange("stamp")}
                                    />
                                    <ImageUploadPill
                                        label="Signature Image"
                                        icon={<Pencil size={18} className="text-sky-500" />}
                                        initialUrl={assets.signature}
                                        onImageChange={handleAssetChange("signature")}
                                    />

                                    {/* Footer buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-4 px-2">
                                        <Link href="/dashboard/system-branding/certificate">
                                            <button type="button" className="px-7 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 font-sans h-9">
                                                Cancel
                                            </button>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handlePreview}
                                            className="px-6 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 font-sans h-9 flex items-center gap-2"
                                        >
                                            <Eye size={16} />
                                            Preview
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-8 py-2 rounded-full bg-sky-500 text-[13px] font-semibold text-white hover:bg-sky-600 flex items-center gap-2 font-sans h-9 disabled:bg-sky-300 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <Spinner size="sm" color="white" /> : (isEdit ? "Update" : "Create")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* RIGHT: TEMPLATE TEXT + PREVIEW */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-[22px] px-2 py-4 h-full">
                                <div className="space-y-4">
                                    <div className="bg-white rounded-3xl px-5 py-4">
                                        <h5 className="text-sm font-semibold text-slate-700 mb-2">Template Text</h5>
                                        <div className="rich-editor-container overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            {/* ReactQuill dynamic import */}
                                            <ReactQuill
                                                theme="snow"
                                                value={templateText}
                                                onChange={setTemplateText}
                                                modules={quillModules}
                                                className="bg-white"
                                            />
                                        </div>
                                        {/* Variable Guide */}
                                        <div className="mt-4 p-3 bg-sky-50 rounded-xl border border-sky-100">
                                            <p className="text-[11px] text-sky-700 font-medium mb-2 flex items-center gap-1">
                                                <Sparkles size={12} />
                                                Available Variables
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {["<%first_name%>", "<%last_name%>", "<%content_name%>", "<%completion_date%>"].map(v => (
                                                    <code key={v} className="text-[10px] bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-600 font-mono">{v}</code>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <style jsx global>{`
          .quill .ql-toolbar {
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            background: #fff;
            border-color: #e2e8f0;
            padding: 0.75rem;
          }
          .quill .ql-container {
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
            background: #f8fafc;
            border-color: #e2e8f0;
            min-height: 250px;
            font-size: 14px;
          }
          .certificate-content-render p {
            margin-bottom: 0.5em;
          }
          .certificate-content-render strong {
            color: #0f172a;
          }
        `}</style>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
