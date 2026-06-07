"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { useOrgLogo, useUploadOrgLogo, useRemoveOrgLogo } from "@/hooks/useOrgBranding";
import { brandAssets } from "@/config/branding";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export default function OrgLogoBrandingPage() {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: orgBrandingData, isLoading } = useOrgLogo();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadOrgLogo();
  const { mutate: removeLogo, isPending: isRemoving } = useRemoveOrgLogo();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const currentLogoUrl = orgBrandingData?.logo_url;

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t("branding.invalidFileType") ?? "Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return t("branding.fileTooLarge") ?? "File size must be less than 2MB.";
    }
    return null;
  }, [t]);

  const handleFileSelect = useCallback((file: File) => {
    clearMessages();
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [clearMessages, validateFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input value so the same file can be selected again
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleUpload = () => {
    if (!selectedFile) return;
    clearMessages();
    uploadLogo(selectedFile, {
      onSuccess: (res) => {
        if (res.success) {
          setSuccessMessage(t("branding.uploadSuccess") ?? "Logo uploaded successfully!");
          setSelectedFile(null);
          setPreviewUrl(null);
        } else {
          setError(res.message ?? "Upload failed");
        }
      },
      onError: (err: any) => {
        setError(err?.message ?? "An error occurred while uploading the logo.");
      },
    });
  };

  const handleRemove = () => {
    clearMessages();
    removeLogo(undefined, {
      onSuccess: (res) => {
        if (res.success) {
          setSuccessMessage(t("branding.removeSuccess") ?? "Logo removed. Default branding will be used.");
          setSelectedFile(null);
          setPreviewUrl(null);
        } else {
          setError(res.message ?? "Failed to remove logo.");
        }
      },
      onError: (err: any) => {
        setError(err?.message ?? "An error occurred while removing the logo.");
      },
    });
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    clearMessages();
  };

  // Resolve the display URL for the current logo
  const displayLogoUrl = previewUrl ?? (currentLogoUrl ? getContentAssetUrl(currentLogoUrl) : null);
  const defaultLogoIcon = brandAssets.companyLogo;
  const defaultLogoName = brandAssets.logoLight;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className={clsx("flex items-center gap-2 text-sm text-gray-500 mb-6", isRtl && "flex-row-reverse")}>
            <span>{t("menu.dashboard")}</span>
            <span>{isRtl ? "›" : "›"}</span>
            <span>{t("menu.systemBranding")}</span>
            <span>{isRtl ? "›" : "›"}</span>
            <span className="text-[var(--mainblue)] font-medium">{t("branding.title") ?? "Organization Logo"}</span>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--mainblue)] mb-2">
              {t("branding.title") ?? "Organization Logo"}
            </h1>
            <p className="text-sm text-gray-500">
              {t("branding.description") ?? "Upload your organization logo to replace the default Secure Magnus branding across the platform."}
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Logo Preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {t("branding.currentLogo") ?? "Current Logo"}
                </h3>
                <div className="bg-[#0B1A2E] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px] gap-4">
                  {displayLogoUrl ? (
                    <Image
                      alt="Organization Logo"
                      className="max-h-24 w-auto object-contain"
                      height={96}
                      src={displayLogoUrl}
                      width={240}
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Image alt="" className="size-8" height={32} src={defaultLogoIcon} width={32} />
                      <Image alt="Junior Magnus" className="h-5 w-auto" height={20} src={defaultLogoName} width={100} />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {displayLogoUrl
                      ? (previewUrl ? (t("branding.previewLabel") ?? "Preview (not saved yet)") : (t("branding.customLogo") ?? "Custom organization logo"))
                      : (t("branding.defaultLogo") ?? "Default Secure Magnus branding")}
                  </p>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {t("branding.uploadNewLogo") ?? "Upload New Logo"}
                </h3>
                <div
                  className={clsx(
                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-colors",
                    dragActive
                      ? "border-[var(--mainblue)] bg-blue-50/50"
                      : "border-gray-300 hover:border-gray-400 bg-gray-50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    {t("branding.dragDrop") ?? "Drag & drop your logo here"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("branding.orClick") ?? "or click to browse"}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("branding.fileRequirements") ?? "JPEG, PNG, GIF, WebP, or SVG • Max 2MB"}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  className="hidden"
                  type="file"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className={clsx("mt-8 pt-6 border-t border-gray-100 flex items-center gap-3 flex-wrap", isRtl && "flex-row-reverse")}>
              {selectedFile && (
                <>
                  <Button
                    className="bg-[var(--mainblue)] text-white font-medium px-6"
                    isDisabled={isUploading}
                    isLoading={isUploading}
                    size="md"
                    onPress={handleUpload}
                  >
                    {isUploading ? (t("branding.uploading") ?? "Uploading...") : (t("branding.saveChanges") ?? "Save Changes")}
                  </Button>
                  <Button
                    className="font-medium px-6"
                    isDisabled={isUploading}
                    size="md"
                    variant="bordered"
                    onPress={handleCancel}
                  >
                    {t("branding.cancel") ?? "Cancel"}
                  </Button>
                </>
              )}
              {currentLogoUrl && !selectedFile && (
                <Button
                  className="text-red-600 border-red-300 hover:bg-red-50 font-medium px-6"
                  isDisabled={isRemoving}
                  isLoading={isRemoving}
                  size="md"
                  variant="bordered"
                  onPress={handleRemove}
                >
                  {isRemoving ? (t("branding.removing") ?? "Removing...") : (t("branding.removeLogo") ?? "Remove Logo")}
                </Button>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    {t("branding.infoTitle") ?? "White-Label Branding"}
                  </p>
                  <p className="text-xs text-blue-600">
                    {t("branding.infoDescription") ?? "Your organization logo will replace the default Secure Magnus logo across the platform for all users within your organization. It will be displayed in the sidebar navigation. Removing the logo will revert to the default branding."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
