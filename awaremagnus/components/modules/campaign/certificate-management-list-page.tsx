"use client";

import { useState, useEffect } from "react";
import { Search, Plus, FileText, ChevronsUpDown, SearchX, Trash2 } from "lucide-react";
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

export function CertificateManagementListPage() {
    const tMenu = useTranslations("dashboard");
    const { dir } = useI18n();
    const isRtl = dir === "rtl";

    const [certificates, setCertificates] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [language, setLanguage] = useState("all");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const fetchCertificates = async () => {
        setIsLoading(true);
        try {
            const response = await certificateService.getCertificates();
            if (response.success && response.data) {
                setCertificates(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch certificates:", error);
            addToast({
                title: "Error",
                description: "Failed to load certificates",
                color: "danger"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this certificate branding?")) return;

        try {
            const response = await certificateService.deleteCertificate(id);
            if (response.success) {
                addToast({
                    title: "Success",
                    description: "Certificate template deleted successfully",
                    color: "success"
                });
                fetchCertificates();
            }
        } catch (error) {
            console.error("Failed to delete certificate:", error);
            addToast({
                title: "Error",
                description: "Failed to delete certificate template",
                color: "danger"
            });
        }
    };

    const filteredCerts = certificates.filter((cert) => {
        const name = `Certificate - ${cert.language?.name || 'Unknown'}`;
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
                            <h1 className="text-xl font-semibold text-gray-900">Certificates</h1>
                            <p className="text-xs text-gray-500">Manage certificate templates and assets</p>
                        </div>
                        <Link href="/dashboard/system-branding/certificate/new">
                            <Button
                                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full text-xs min-w-0 h-auto"
                                startContent={<Plus size={18} />}
                            >
                                Add New Certificate
                            </Button>
                        </Link>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <span className="text-[13px] font-medium text-gray-700">All Certificate</span>

                            <div className="flex gap-3">
                                <div className="relative w-64">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search certificates..."
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
                                        <option value="all">All Languages</option>
                                        <option value="English">English</option>
                                        <option value="Arabic">Arabic</option>
                                        <option value="French">French</option>
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
                                                    <span>Certificate Name</span>
                                                    <ChevronsUpDown size={14} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span>Language</span>
                                                    <ChevronsUpDown size={14} className="text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3.5 text-left font-semibold">Top Logo</th>
                                            <th className="px-4 py-3.5 text-left font-semibold">Watermark</th>
                                            <th className="px-4 py-3.5 text-left font-semibold">Border</th>
                                            <th className="px-4 py-3.5 text-left font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={6} className="h-[400px]">
                                                    <div className="flex items-center justify-center">
                                                        <Spinner color="primary" label="Loading certificates..." />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : items.length > 0 ? items.map((cert) => (
                                            <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3.5 text-gray-900 font-medium">Certificate - {cert.language?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3.5 text-gray-600">{cert.language?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3.5 text-gray-400 italic">
                                                    {cert.top_logo_url ? <img src={cert.top_logo_url} alt="Logo" className="h-8 w-auto object-contain" /> : "None"}
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-400 italic">
                                                    {cert.bg_watermark_url ? <img src={cert.bg_watermark_url} alt="Watermark" className="h-8 w-auto object-contain" /> : "None"}
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-400 italic">
                                                    {cert.border_image_url ? <img src={cert.border_image_url} alt="Border" className="h-8 w-auto object-contain" /> : "None"}
                                                </td>
                                                <td className="px-4 py-3.5 text-sky-500 font-semibold cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <Link href={`/dashboard/system-branding/certificate/${cert.id}/edit`} className="hover:text-sky-700">
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => cert.id && handleDelete(cert.id)}
                                                            className="text-rose-500 hover:text-rose-700 transition"
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
                                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Certificates Found</h3>
                                                        <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
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
                                <span>Showing {items.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}–{Math.min(page * rowsPerPage, filteredCerts.length)} out of {filteredCerts.length} Entries</span>
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
                                }}
                            />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
