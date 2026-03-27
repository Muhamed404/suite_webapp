"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/select";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgAdmin } from "@/utils/roles";
import { getContentTypeIconFor } from "@/utils/contentTypeIcons";
import { quizService } from "@/services/quizService";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { AuthImage } from "@/components/ui/auth-image";
import type { ModuleContent } from "@/types/quiz";

const AWARENESS_ASSETS = [
  {
    id: 0,
    name: "All",
  },
  {
    id: 4,
    name: "Posters",
  },
  {
    id: 5,
    name: "Screen Savers",
  },
  {
    id: 7,
    name: "Documents",
  },
] as const;

type AwarenessAssetType = (typeof AWARENESS_ASSETS)[number]["id"];

function getAssetTitle(asset: ModuleContent): string {
  return (
    asset.title ??
    (asset as { name?: string }).name ??
    `Asset ${asset.id}`
  );
}

function getAssetLanguage(asset: ModuleContent): string {
  return asset.language?.name ?? `Language ${asset.language?.id ?? "-"}`;
}

function getAssetSourceUrl(asset: ModuleContent): string | null {
  const source = asset.source_url ?? (asset as { source_path?: string }).source_path;

  if (!source?.trim()) return null;

  return source.startsWith("http") ? source : getContentAssetUrl(source);
}

function getAssetCreatedDate(asset: ModuleContent): string {
  const raw =
    asset.created_at ??
    (asset as { creation_date?: string }).creation_date ??
    (asset as { createdAt?: string }).createdAt;

  if (!raw) return "-";

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString();
}

function isImageAsset(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();

  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].some((ext) =>
    clean.endsWith(ext)
  );
}

function getAssetPreviewUrl(asset: ModuleContent): string | null {
  const logo = asset.logo_url ?? asset.logo_path;

  if (logo?.trim()) {
    return logo.startsWith("http") ? logo : getContentAssetUrl(logo);
  }

  const source = getAssetSourceUrl(asset);

  if (source && isImageAsset(source)) return source;

  return null;
}

export default function AwarenessAssetsPage() {
  const t = useTranslations("dashboard");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<AwarenessAssetType>(0);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const user = useAuthStore((s) => s.user);
  const isOrgAdminUser = isOrgAdmin(user?.role_id);

  const {
    data: assetsResponse,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["awareness-assets", activeFilter, currentPage],
    queryFn: () =>
      activeFilter === 0
        ? quizService.getContents({ page: currentPage, limit: 9 })
        : quizService.getContents({ contype_id: activeFilter, page: currentPage, limit: 9 }),
    enabled: isOrgAdminUser,
    staleTime: 60 * 1000,
  });

  const activeFilterInfo =
    AWARENESS_ASSETS.find((asset) => asset.id === activeFilter) ?? AWARENESS_ASSETS[0];

  const assets = useMemo(() => {
    if (!assetsResponse?.success) return [] as ModuleContent[];

    const data = assetsResponse.data as { contents?: ModuleContent[]; pagination?: any };
    return Array.isArray(data.contents) ? data.contents : [];
  }, [assetsResponse]);

  const pagination = useMemo(() => {
    if (!assetsResponse?.success) return null;

    const data = assetsResponse.data as { contents?: ModuleContent[]; pagination?: any };
    return data.pagination || null;
  }, [assetsResponse]);

  const filteredAssets = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return assets;

    return assets.filter((asset) => {
      const title = getAssetTitle(asset).toLowerCase();
      const description = (asset.description ?? "").toLowerCase();
      const language = getAssetLanguage(asset).toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        language.includes(query)
      );
    });
  }, [assets, searchText]);

  const totalPages = pagination?.total_pages ?? 1;
  const totalItems = pagination?.total_items ?? assets.length;

  const pageItems = filteredAssets;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchText]);


  useEffect(() => {
    if (user && !isOrgAdminUser) {
      router.replace("/dashboard");
    }
  }, [user, isOrgAdminUser, router]);

  if (user && !isOrgAdminUser) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6", isRtl && "text-right")}>
          <h1 className="text-lg font-semibold text-[var(--mainblue)]">{t("menu.awarenessAssets")}</h1>
          <p className="mt-1 text-sm text-[var(--darkgray)]">
            Select a filter and open the required content.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              className="flex-1 rounded-full border border-[var(--strokeGray)] bg-white px-4 py-2 text-sm text-[var(--mainblue)] outline-none placeholder:text-[var(--darkgray)] focus:border-[var(--blue)]"
              placeholder="Search by title, language, or description"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className="min-w-[150px]">
              <Select
                selectedKeys={[String(activeFilter)]}
                onSelectionChange={(keys) => {
                  const next = Number(Array.from(keys as Set<string>)[0] ?? activeFilter);
                  setActiveFilter(next as AwarenessAssetType);
                }}
                className="rounded-full border border-[var(--strokeGray)] bg-white text-sm text-[var(--mainblue)]"
              >
                {AWARENESS_ASSETS.map((asset) => (
                  <SelectItem key={asset.id} textValue={asset.name}>
                    {asset.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {isLoading || isFetching ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-40 animate-pulse rounded-lg border border-[var(--strokeGray)] bg-white"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Unable to load awareness assets. {error instanceof Error ? error.message : ""}
            </div>
          ) : assetsResponse && !assetsResponse.success ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              {assetsResponse.message ?? "Could not fetch awareness assets."}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="mt-5 rounded-lg border border-[var(--strokeGray)] bg-white p-4 text-sm text-[var(--darkgray)]">
              No records found for {activeFilterInfo.name}{searchText.trim() ? " with this search." : "."}
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((asset) => {
                const sourceUrl = getAssetSourceUrl(asset);
                const previewUrl = getAssetPreviewUrl(asset);
                const title = getAssetTitle(asset);

                return (
                  <article
                    key={asset.id}
                    className="rounded-lg border border-[var(--strokeGray)] bg-white p-3"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[var(--gray)]/40">
                        {previewUrl ? (
                          <AuthImage
                            fill
                            alt={title}
                            className="object-cover"
                            sizes="80px"
                            src={previewUrl}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Image
                              alt={activeFilterInfo.name}
                              height={34}
                              src={getContentTypeIconFor(activeFilterInfo.id, activeFilterInfo.name)}
                              width={34}
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-sm font-semibold text-[var(--mainblue)]">{title}</h2>
                        <p className="mt-0.5 text-xs text-[var(--darkgray)]">
                          {getAssetLanguage(asset)} • {getAssetCreatedDate(asset)}
                        </p>
                      </div>
                    </div>

                    {asset.description && (
                      <p className="mb-3 line-clamp-2 text-xs text-[var(--darkgray)]">{asset.description}</p>
                    )}

                    <div className="flex items-center justify-end">
                        {sourceUrl ? (
                          <a
                            className="inline-flex items-center rounded-md bg-[var(--blue)] px-3 py-1.5 text-xs font-medium text-white"
                            href={sourceUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            View
                          </a>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-[var(--gray)] px-3 py-1.5 text-xs text-[var(--darkgray)]">
                            No Source
                          </span>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[var(--darkgray)]">
                Showing {((currentPage - 1) * (pagination?.per_page ?? 9)) + 1}–{Math.min(currentPage * (pagination?.per_page ?? 9), totalItems)} of {totalItems} results
              </div>
              <Pagination
                showControls
                classNames={{
                  wrapper: "flex gap-1",
                  item: "min-w-8 h-8 text-xs font-medium bg-white border border-gray-200 hover:bg-gray-100",
                  cursor: "bg-[#0ea5e9] text-white font-medium",
                  prev: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                  next: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                }}
                page={currentPage}
                radius="sm"
                size="sm"
                total={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
