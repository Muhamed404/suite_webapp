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
    FileText
} from "lucide-react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
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
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
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

    const getProcessedText = (html: string) => {
        return html
            .replace(/&lt;%first_name%&gt;/g, '<span class="text-[#00CCC4] font-semibold italic font-[Fondamento]">John</span>')
            .replace(/&lt;%last_name%&gt;/g, '<span class="text-[#00CCC4] font-semibold italic font-[Fondamento]">Doe</span>')
            .replace(/&lt;%content_name%&gt;/g, '<span class="font-bold">Cyber Security 101</span>')
            .replace(/&lt;%completion_date%&gt;/g, '<span class="font-medium">March 25, 2026</span>')
            .replace(/<%first_name%>/g, '<span class="text-[#00CCC4] font-semibold italic font-[Fondamento]">John</span>')
            .replace(/<%last_name%>/g, '<span class="text-[#00CCC4] font-semibold italic font-[Fondamento]">Doe</span>')
            .replace(/<%content_name%>/g, '<span class="font-bold">Cyber Security 101</span>')
            .replace(/<%completion_date%>/g, '<span class="font-medium">March 25, 2026</span>');
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

    const CertificatePreview = () => (
        <div
            className="relative w-full aspect-[1.414/1] bg-white shadow-2xl overflow-hidden print:shadow-none mx-auto border border-gray-100 flex items-center justify-center p-0"
            style={{ backgroundColor: bgColor }}
        >
            <link href="https://fonts.googleapis.com/css2?family=Fondamento:ital@0;1&family=Nunito+Sans:wght@200..1000&display=swap" rel="stylesheet" />

            {/* Border */}
            {assets.border && (
                <AuthImage src={assets.border} alt="" className="object-fill z-10 pointer-events-none" fill resolveUrl={false} />
            )}

            {/* Watermark */}
            {assets.watermark && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-[0.08] z-0 pointer-events-none">
                    <AuthImage src={assets.watermark} alt="" className="object-contain" fill resolveUrl={false} />
                </div>
            )}

            <div className="relative z-20 flex flex-col items-center justify-between w-full h-full text-center py-12 px-20">
                {/* Logo */}
                <div className="h-20 w-48 relative flex items-center justify-center">
                    {assets.logo ? (
                        <AuthImage src={assets.logo} alt="Logo" className="object-contain" fill resolveUrl={false} />
                    ) : (
                        <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-full border border-dashed border-gray-200">
                            <ImageIcon size={24} className="text-gray-300" />
                        </div>
                    )}
                </div>

                {/* Text Content */}
                <div className="flex-1 flex items-center justify-center w-full my-6">
                    <div
                        className="certificate-content-render text-slate-800 font-['Nunito_Sans'] w-full"
                        dangerouslySetInnerHTML={{ __html: getProcessedText(templateText) }}
                        style={{ fontSize: 'clamp(14px, 2.2vw, 28px)', lineHeight: '1.6' }}
                    />
                </div>

                {/* Footer Assets (Stamp & Signature) */}
                <div className="w-full flex justify-between items-end mt-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-16 w-32 relative flex items-end">
                            {assets.signature ? (
                                <AuthImage src={assets.signature} alt="Signature" className="object-contain" fill resolveUrl={false} />
                            ) : (
                                <div className="h-px w-32 bg-slate-200" />
                            )}
                        </div>
                        <div className="w-40 h-[1.5px] bg-slate-900" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 font-['Nunito_Sans']">Signature</span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        {assets.stamp ? (
                            <div className="h-24 w-24 relative">
                                <AuthImage src={assets.stamp} alt="Stamp" className="object-contain" fill resolveUrl={false} />
                            </div>
                        ) : (
                            <div className="h-24 w-24 rounded-full border border-dashed border-gray-200 flex items-center justify-center">
                                <span className="text-[8px] text-gray-300 font-['Nunito_Sans']">STAMP HERE</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

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
                                    {/* ... rest unchanged inputs ... */}
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
                                            onClick={onOpen}
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

                {/* PREVIEW MODAL */}
                <Modal
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    size="5xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "bg-slate-50/95 backdrop-blur-xl",
                        header: "border-b border-slate-100",
                        footer: "border-t border-slate-100"
                    }}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="text-sky-500" size={20} />
                                        <span>Certificate Preview</span>
                                    </div>
                                    <span className="text-[11px] font-normal text-slate-400">High-fidelity visualization of the final certificate</span>
                                </ModalHeader>
                                <ModalBody className="py-8 bg-slate-200/50">
                                    <CertificatePreview />
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="flat" onPress={onClose} className="rounded-full text-xs font-semibold">
                                        Close Preview
                                    </Button>
                                    <Button color="primary" onPress={onClose} className="bg-sky-500 rounded-full text-xs font-semibold shadow-lg shadow-sky-200">
                                        Save Configuration
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

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
