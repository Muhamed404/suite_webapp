"use client";

import { useState, useEffect } from "react";
import { Search, Plus, FileText, ChevronsUpDown, SearchX, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { certificateService, type CertificateTemplate } from "@/services/certificateService";
import { addToast } from "@heroui/toast";
import { getCertificateAssetUrl } from "@/utils/contentAssetUrl";
import { AuthImage } from "@/components/ui/auth-image";
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS, getLanguageFlag, getLanguageCountryCode } from "@/utils/supportedLanguages";
import ReactCountryFlag from "react-country-flag";
import { generateCertificateHtml } from "@/utils/certificateHtmlGenerator";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isPlatformAdmin, isOrgAdmin } from "@/utils/roles";
import { Image as ImageIcon } from "lucide-react";
export function CertificateManagementListPage() {
    const tMenu = useTranslations("dashboard");
    const t = useTranslations("certificateBranding");
    const { dir } = useI18n();
    const isRtl = dir === "rtl";

    const { user } = useAuthStore();
    const [certificates, setCertificates] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [language, setLanguage] = useState("all");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const fetchCertificates = async () => {
        setIsLoading(true);
        try {
            let filter = "";
            if (isPlatformAdmin(user?.role_id)) {
                filter = "default_brandings";
            } else if (isOrgAdmin(user?.role_id)) {
                filter = "my_brandings";
            }

            const response = await certificateService.getCertificates({ filter });
            if (response.success && response.data) {
                setCertificates(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch certificates:", error);
            addToast({
                title: t("toasts.errorTitle"),
                description: t("toasts.loadFailed"),
                color: "danger"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCertificates();
        }
    }, [user?.role_id]);

    const handleDelete = async (id: number) => {
        if (!window.confirm(t("confirmDelete"))) return;

        try {
            const response = await certificateService.deleteCertificate(id);
            if (response.success) {
                addToast({
                    title: t("toasts.successTitle"),
                    description: t("toasts.deleteSuccess"),
                    color: "success"
                });
                fetchCertificates();
            }
        } catch (error) {
            console.error("Failed to delete certificate:", error);
            addToast({
                title: t("toasts.errorTitle"),
                description: t("toasts.deleteFailed"),
                color: "danger"
            });
        }
    };

    const handleDownload = (cert: CertificateTemplate) => {
        const htmlContent = generateCertificateHtml({
            templateText: cert.template_text,
            bgColor: cert.bg_color || "#ffffff",
            assets: {
                logo: cert.top_logo_url ? getCertificateAssetUrl(cert.top_logo_url) : null,
                bottomLogo: cert.bottom_logo_url ? getCertificateAssetUrl(cert.bottom_logo_url) : null,
                border: cert.border_image_url ? getCertificateAssetUrl(cert.border_image_url) : null,
                watermark: cert.bg_watermark_url ? getCertificateAssetUrl(cert.bg_watermark_url) : null,
                stamp: cert.stamp_logo_url ? getCertificateAssetUrl(cert.stamp_logo_url) : null,
                signature: cert.sign_image_url ? getCertificateAssetUrl(cert.sign_image_url) : null,
            }
        });
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.open();
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
            // Automatically trigger print dialog since they clicked download
            previewWindow.onload = () => {
                previewWindow.print();
            };
        } else {
            addToast({
                title: t("toasts.errorTitle"),
                description: t("toasts.popupBlocked"),
                color: "warning"
            });
        }
    };

    const filteredCerts = certificates.filter((cert) => {
        const name = t("certificateNameWithLanguage", {
            language: cert.language?.name || t("unknownLanguage"),
        });
        const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchesLang = language === "all" || cert.language?.name === language;
        return matchesSearch && matchesLang;
    });

    const pages = Math.ceil(filteredCerts.length / rowsPerPage) || 1;
    const items = filteredCerts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-3">
                    {/* Breadcrumb */}
                    <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5">
                        <span className="hover:text-gray-700 transition cursor-pointer">{tMenu("menu.systemBranding")}</span>
                        <span className="text-gray-400">›</span>
                        <span className="font-semibold text-gray-900">{tMenu("menu.certificate")}</span>
                    </nav>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
                            <p className="text-xs text-gray-500">{t("description")}</p>
                        </div>
                        <Link href="/dashboard/system-branding/certificate/new">
                            <Button
                                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full text-xs min-w-0 h-auto"
                                startContent={<Plus size={18} />}
                            >
                                {t("addNew")}
                            </Button>
                        </Link>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[13px] font-medium text-gray-700">{t("allCertificates")}</span>

                            <div className="flex gap-3">
                                <div className="relative w-64">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={t("searchPlaceholder")}
                                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all h-9"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                <div className="w-40">
                                    <select
                                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white h-9 appearance-none cursor-pointer"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <option value="all">{t("allLanguages")}</option>
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <option key={lang.id} value={lang.name}>
                                                {LANGUAGE_FLAGS[lang.id as keyof typeof LANGUAGE_FLAGS]} {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="pb-2">
                            <div className="overflow-x-auto relative" style={{ minHeight: '420px' }}>
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3.5 text-left font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span>{t("table.certificateName")}</span>
                                                    <ChevronsUpDown size={14} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span>{t("table.language")}</span>
                                                    <ChevronsUpDown size={14} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-semibold">{t("table.topLogo")}</th>
                                            <th className="px-4 py-3.5 text-left font-semibold">{t("table.watermark")}</th>
                                            <th className="px-4 py-3.5 text-left font-semibold">{t("table.border")}</th>
                                            <th className="px-4 py-3.5 text-left font-semibold">{t("table.action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={6} className="h-[400px]">
                                                    <div className="flex items-center justify-center">
                                                        <Spinner color="primary" label={t("loading")} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : items.length > 0 ? items.map((cert) => (
                                            <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3.5 text-gray-900 font-medium">
                                                    {t("certificateNameWithLanguage", {
                                                        language: cert.language?.name || t("unknownLanguage"),
                                                    })}
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 overflow-hidden rounded-full border border-gray-100">
                                                            <ReactCountryFlag
                                                                countryCode={getLanguageCountryCode(cert.lang_id)}
                                                                svg
                                                                cdnUrl="/awm/vendor/flag-icons/flags/4x3/"
                                                                style={{ fontSize: "1.5em", lineHeight: "1.5em" }}
                                                                title={cert.language?.name || t("unknownLanguage")}
                                                            />
                                                        </span>
                                                        <span>{cert.language?.name || t("unknownLanguage")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className={`flex ${isRtl ? "justify-end pe-2" : "justify-start"}`}>
                                                        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                                            {cert.top_logo_url ? (
                                                                <AuthImage src={getCertificateAssetUrl(cert.top_logo_url)} alt="Logo" className="object-contain" fill resolveUrl={false} />
                                                            ) : (
                                                                <ImageIcon size={18} className="text-gray-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className={`flex ${isRtl ? "justify-end pe-2" : "justify-start"}`}>
                                                        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                                            {cert.bg_watermark_url ? (
                                                                <AuthImage src={getCertificateAssetUrl(cert.bg_watermark_url)} alt="Watermark" className="object-contain" fill resolveUrl={false} />
                                                            ) : (
                                                                <ImageIcon size={18} className="text-gray-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className={`flex ${isRtl ? "justify-end pe-2" : "justify-start"}`}>
                                                        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                                            {cert.border_image_url ? (
                                                                <AuthImage src={getCertificateAssetUrl(cert.border_image_url)} alt="Border" className="object-contain" fill resolveUrl={false} />
                                                            ) : (
                                                                <ImageIcon size={18} className="text-gray-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-sky-500 font-semibold cursor-pointer">
                                                    <div className={`flex items-center gap-3 ${isRtl ? "justify-end" : "justify-start"}`}>
                                                        <Link href={`/dashboard/system-branding/certificate/${cert.id}/edit`} className="hover:text-sky-700">
                                                            {t("actions.edit")}
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDownload(cert)}
                                                            className="text-sky-500 hover:text-sky-700 transition"
                                                            title={t("actions.download")}
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => cert.id && handleDelete(cert.id)}
                                                            className="text-rose-500 hover:text-rose-700 transition"
                                                            title={t("actions.delete")}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="h-[400px]">
                                                    <div className="flex flex-col items-center justify-center text-center">
                                                        <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                                                            <SearchX size={40} className="text-gray-400" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("empty.title")}</h3>
                                                        <p className="text-sm text-gray-500">{t("empty.description")}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                <FileText size={16} />
                                <span>
                                    {t("pagination.showing", {
                                        start: items.length > 0 ? (page - 1) * rowsPerPage + 1 : 0,
                                        end: Math.min(page * rowsPerPage, filteredCerts.length),
                                        total: filteredCerts.length,
                                    })}
                                </span>
                            </div>
                            <Pagination
                                isCompact
                                showControls
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={setPage}
                                classNames={{
                                    cursor: "bg-sky-500 text-white",
                                    prev: isRtl ? "rotate-180" : "",
                                    next: isRtl ? "rotate-180" : "",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
