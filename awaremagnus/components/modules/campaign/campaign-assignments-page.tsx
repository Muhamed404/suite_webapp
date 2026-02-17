"use client";

import type { CampaignAssignment } from "@/types/campaign";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import clsx from "clsx";
import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, SearchX, Rocket, Clock, BarChart3, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAssignedCampaigns } from "@/hooks/useCampaign";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserDashboards } from "@/hooks/useDashboard";
import { Header } from "@/components/header";
import {
  isPlatformAdmin as getIsPlatformAdmin,
  isOrgAdmin as getIsOrgAdmin,
  isUser as getIsUser,
} from "@/utils/roles";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function campaignName(c: CampaignAssignment): string {
  return c.name ?? `Campaign ${c.id}`;
}

function getCampaignStatus(campaign: CampaignAssignment): "active" | "pending" | "completed" {
  if (campaign.status) {
    const status = campaign.status.toLowerCase();
    if (status.includes('progress') || status.includes('in_progress')) return "active";
    if (status.includes('complete') || status.includes('completed')) return "completed";
    if (status.includes('pending')) return "pending";
  }
  const now = new Date();
  const start = campaign.start_date ? new Date(campaign.start_date) : null;
  const end = campaign.end_date ? new Date(campaign.end_date) : null;
  const progress = campaign.progress_percent ?? 0;

  if (progress === 100) return "completed";
  if (end && now > end) return "completed";
  if (start && now < start) return "pending";
  return "active";
}

function getStatusBadge(status: "active" | "pending" | "completed") {
  const badges = {
    active: { 
      class: 'bg-green-100 text-green-700 border border-green-200', 
      icon: 'play-circle', 
      text: 'Active' 
    },
    pending: { 
      class: 'bg-amber-100 text-amber-700 border border-amber-200', 
      icon: 'clock', 
      text: 'Pending' 
    },
    completed: { 
      class: 'bg-gray-100 text-gray-700 border border-gray-200', 
      icon: 'check-circle', 
      text: 'Completed' 
    }
  };
  
  const badge = badges[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badge.class} text-[10px] font-semibold min-w-[100px] justify-center`}>
      <span>{badge.text}</span>
    </span>
  );
}

function getActionButton(status: "active" | "pending" | "completed", campaignId: number) {
  const baseClasses = "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200";
  
  if (status === 'active') {
    return (
      <Link href="/module/physical-security">
        <button className={`${baseClasses} bg-[#3FBDFF] text-white hover:bg-opacity-90`}>
          <Rocket className="w-4 h-4" />
          <span>Launch</span>
        </button>
      </Link>
    );
  } else if (status === 'pending') {
    return (
      <button className={`${baseClasses} bg-amber-500 text-white hover:bg-amber-600`}>
        <Clock className="w-4 h-4" />
        <span>Schedule</span>
      </button>
    );
  } else {
    return (
      <Link href={`/dashboard/campaign-assignments/${campaignId}/modules`}>
        <button className={`${baseClasses} bg-gray-500 text-white hover:bg-gray-600`}>
          <BarChart3 className="w-4 h-4" />
          <span>View Report</span>
        </button>
      </Link>
    );
  }
}

export function CampaignAssignmentsPage() {
  const t = useTranslations("campaigns");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const { data: campaignsRes, isLoading } = useAssignedCampaigns();
  const campaigns = campaignsRes?.success ? (campaignsRes.data ?? []) : [];

  const { data: userDashboardsRes } = useUserDashboards();
  const userMetrics = userDashboardsRes?.object?.dashboardUsers?.[0] || null;

  // Mock data for testing
  const mockCampaigns: CampaignAssignment[] = [
    { id: 1, name: "Phishing Awareness Q1", start_date: "2026-01-15", end_date: "2026-02-15", progress_percent: 75 },
    { id: 2, name: "Password Security Training", start_date: "2026-01-10", end_date: "2026-02-10", progress_percent: 75 },
    { id: 3, name: "Compliance Training 2026", start_date: "2026-01-20", end_date: "2026-03-20", progress_percent: 75 },
    { id: 4, name: "Social Engineering Defense", start_date: "2026-01-05", end_date: "2026-02-05", progress_percent: 75 },
    { id: 5, name: "Data Privacy Essentials", start_date: "2025-12-01", end_date: "2026-01-01", progress_percent: 100 },
    { id: 6, name: "Device Safety Campaign", start_date: "2025-11-15", end_date: "2025-12-15", progress_percent: 100 },
    { id: 7, name: "Cloud Security Basics", start_date: "2025-11-01", end_date: "2025-12-01", progress_percent: 100 },
    { id: 8, name: "Email Security Training", start_date: "2025-10-20", end_date: "2025-11-20", progress_percent: 100 },
    { id: 9, name: "Network Security Fundamentals", start_date: "2026-02-01", end_date: "2026-03-01", progress_percent: 0 },
    { id: 10, name: "Ransomware Protection", start_date: "2026-02-10", end_date: "2026-03-10", progress_percent: 0 },
    { id: 11, name: "Mobile Security Awareness", start_date: "2026-02-15", end_date: "2026-03-15", progress_percent: 0 },
    { id: 12, name: "VPN Best Practices", start_date: "2026-02-20", end_date: "2026-03-20", progress_percent: 0 },
    { id: 13, name: "Zero Trust Security", start_date: "2025-10-01", end_date: "2025-11-01", progress_percent: 100 },
    { id: 14, name: "Incident Response Training", start_date: "2025-09-15", end_date: "2025-10-15", progress_percent: 100 },
    { id: 15, name: "Security Audit Preparation", start_date: "2025-09-01", end_date: "2025-10-01", progress_percent: 100 },
    { id: 16, name: "GDPR Compliance Module", start_date: "2026-01-12", end_date: "2026-02-12", progress_percent: 75 },
    { id: 17, name: "ISO 27001 Training", start_date: "2026-01-18", end_date: "2026-02-18", progress_percent: 75 },
    { id: 18, name: "PCI DSS Awareness", start_date: "2026-01-22", end_date: "2026-02-22", progress_percent: 75 },
    { id: 19, name: "HIPAA Security Rules", start_date: "2026-02-05", end_date: "2026-03-05", progress_percent: 0 },
    { id: 20, name: "SOC 2 Compliance", start_date: "2026-02-12", end_date: "2026-03-12", progress_percent: 0 },
    { id: 21, name: "Cryptocurrency Security", start_date: "2025-08-20", end_date: "2025-09-20", progress_percent: 100 },
    { id: 22, name: "API Security Essentials", start_date: "2025-08-01", end_date: "2025-09-01", progress_percent: 100 },
    { id: 23, name: "Container Security", start_date: "2025-07-15", end_date: "2025-08-15", progress_percent: 100 },
    { id: 24, name: "Kubernetes Security", start_date: "2025-07-01", end_date: "2025-08-01", progress_percent: 100 },
    { id: 25, name: "DevSecOps Fundamentals", start_date: "2026-01-25", end_date: "2026-02-25", progress_percent: 75 },
    { id: 26, name: "Secure Coding Practices", start_date: "2026-01-28", end_date: "2026-02-28", progress_percent: 75 },
    { id: 27, name: "Web Application Security", start_date: "2026-02-18", end_date: "2026-03-18", progress_percent: 0 },
    { id: 28, name: "SQL Injection Prevention", start_date: "2026-02-22", end_date: "2026-03-22", progress_percent: 0 },
    { id: 29, name: "XSS Attack Prevention", start_date: "2026-02-25", end_date: "2026-03-25", progress_percent: 0 },
    { id: 30, name: "CSRF Protection", start_date: "2025-06-20", end_date: "2025-07-20", progress_percent: 100 },
    { id: 31, name: "Authentication Best Practices", start_date: "2025-06-01", end_date: "2025-07-01", progress_percent: 100 },
    { id: 32, name: "Multi-Factor Authentication", start_date: "2026-01-30", end_date: "2026-02-28", progress_percent: 75 },
    { id: 33, name: "Single Sign-On Security", start_date: "2026-02-28", end_date: "2026-03-28", progress_percent: 0 },
    { id: 34, name: "OAuth 2.0 Security", start_date: "2025-05-15", end_date: "2025-06-15", progress_percent: 100 },
    { id: 35, name: "JWT Security", start_date: "2025-05-01", end_date: "2025-06-01", progress_percent: 100 },
    { id: 36, name: "Session Management", start_date: "2026-01-08", end_date: "2026-02-08", progress_percent: 75 },
    { id: 37, name: "Access Control Basics", start_date: "2026-02-08", end_date: "2026-03-08", progress_percent: 0 },
    { id: 38, name: "Role-Based Access Control", start_date: "2026-02-14", end_date: "2026-03-14", progress_percent: 0 },
    { id: 39, name: "Attribute-Based Access", start_date: "2025-04-20", end_date: "2025-05-20", progress_percent: 100 },
    { id: 40, name: "Privilege Escalation", start_date: "2025-04-01", end_date: "2025-05-01", progress_percent: 100 },
    { id: 41, name: "Least Privilege Principle", start_date: "2026-01-16", end_date: "2026-02-16", progress_percent: 75 },
    { id: 42, name: "Security Monitoring", start_date: "2026-02-26", end_date: "2026-03-26", progress_percent: 0 },
    { id: 43, name: "SIEM Implementation", start_date: "2026-03-01", end_date: "2026-04-01", progress_percent: 0 },
    { id: 44, name: "Threat Intelligence", start_date: "2025-03-15", end_date: "2025-04-15", progress_percent: 100 }
  ];

  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "completed">("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [sortColumn, setSortColumn] = useState<'name' | 'start' | 'end' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const filteredCampaigns = useMemo(() => {
    let filtered = displayCampaigns;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => getCampaignStatus(c) === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        campaignName(c).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const days = parseInt(dateFilter);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(c => {
        const start = c.start_date ? new Date(c.start_date) : null;
        return start && start >= cutoff;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case 'name':
          aVal = campaignName(a).toLowerCase();
          bVal = campaignName(b).toLowerCase();
          break;
        case 'start':
          aVal = a.start_date ? new Date(a.start_date).getTime() : 0;
          bVal = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case 'end':
          aVal = a.end_date ? new Date(a.end_date).getTime() : 0;
          bVal = b.end_date ? new Date(b.end_date).getTime() : 0;
          break;
        case 'status':
          aVal = getCampaignStatus(a);
          bVal = getCampaignStatus(b);
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [displayCampaigns, statusFilter, searchQuery, dateFilter, sortColumn, sortDirection]);

  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  const handleSort = (column: 'name' | 'start' | 'end' | 'status') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const updateTabIndicator = (activeTab: string) => {
    if (!tabIndicatorRef.current || !tabsContainerRef.current) return;
    const tabs = tabsContainerRef.current.querySelectorAll('.tab-btn');
    const activeIndex = Array.from(tabs).findIndex(tab => tab.getAttribute('data-status') === activeTab);
    if (activeIndex === -1) return;
    const activeTabEl = tabs[activeIndex] as HTMLElement;
    const left = activeTabEl.offsetLeft + 4;
    const width = activeTabEl.offsetWidth - 8;
    tabIndicatorRef.current.style.left = `${left}px`;
    tabIndicatorRef.current.style.width = `${width}px`;
  };

  useEffect(() => {
    updateTabIndicator(statusFilter);
  }, [statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDateDropdown && !(event.target as Element).closest('.date-dropdown-container')) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDateDropdown]);

  const handleTabClick = (status: "all" | "active" | "pending" | "completed") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    if (!userMetrics) return { assignment: 0, completed: 0, pending: 0, responseRate: 0, active: 0 };

    return {
      assignment: userMetrics.total_campaigns,
      completed: userMetrics.total_completed_modules,
      pending: userMetrics.total_modules_enrolled - userMetrics.total_completed_modules,
      responseRate: userMetrics.global_progress_percent,
      active: userMetrics.total_achievements_completed,
    };
  }, [userMetrics]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        {!getIsUser(user?.role_id) && (
          <Header
            title="Welcome Alrajhi"
            name="Alrajhi Bank"
            email={user?.email || "info@user.com"}
            onSearch={() => {}}
            onMailClick={() => {}}
            onNotificationClick={() => {}}
            onProfileClick={() => {}}
          />
        )}

        <div className="p-3 min-h-screen">
          <h1 className="text-lg font-semibold mb-4">Assignment</h1>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image src="/awm/images/assing/assingment.svg" alt="" width={20} height={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">Assignment</p>
                <p className="text-lg font-semibold">{stats.assignment}</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image src="/awm/images/assing/assingment.svg" alt="" width={20} height={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-lg font-semibold">{stats.completed}</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image src="/awm/images/assing/pending.svg" alt="" width={20} height={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-semibold">{stats.pending}</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image src="/awm/images/assing/res-rate.svg" alt="" width={20} height={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">Response Rate</p>
                <p className="text-lg font-semibold">{stats.responseRate}%</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image src="/awm/images/assing/assingment.svg" alt="" width={20} height={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-lg font-semibold">{stats.active}</p>
              </div>
            </Card>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            <style>
              {`
                .tab-btn.active:hover {
                  background-color: transparent !important;
                }
                .tab-btn:not(.active):hover {
                  background-color: rgba(243, 244, 246, 1);
                }
                /* Base Button Styles */
                .modern-dropdown-button {
                  width: 100%;
                  height: 47px; /* Overridden by small variant */
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 0.5rem; /* Overridden by rounded-full */
                  padding: 0 2.5rem 0 0.75rem; /* Overridden by variants */
                  font-size: 0.75rem;
                  color: #374151;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  user-select: none;
                  outline: none;
                  line-height: 1.5;
                }

                /* Small Size Variant */
                .modern-dropdown-wrapper.small .modern-dropdown-button {
                  height: 39px;
                  padding: 0 2rem 0 0.625rem; /* Left padding overridden by inline style */
                  font-size: 0.75rem;
                }

                /* Rounded-Full Variant */
                .modern-dropdown-wrapper.rounded-full .modern-dropdown-button {
                  border-radius: 9999px;
                  padding: 0 2rem 0 0.875rem; /* Left padding overridden by inline style */
                }

                /* Hover State */
                .modern-dropdown-button:hover {
                  border-color: #d1d5db;
                }

                /* Active/Focused State */
                .modern-dropdown-button.active {
                  border-color: #3b82f6;
                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* Arrow Icon */
                .modern-dropdown-arrow {
                  position: absolute;
                  right: 0.75rem;
                  top: 50%;
                  transform: translateY(-50%);
                  pointer-events: none;
                  transition: transform 0.2s ease;
                }

                .modern-dropdown-arrow svg {
                  width: 1rem;
                  height: 1rem;
                  color: #6b7280;
                  transition: color 0.2s;
                }

                /* Dropdown Menu */
                .modern-dropdown-menu {
                  position: absolute;
                  top: calc(100% + 0.25rem);
                  left: 0;
                  right: 0;
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 0.5rem; /* 1rem for rounded-full */
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  max-height: 240px;
                  overflow-y: auto;
                  z-index: 50;
                  opacity: 0;
                  transform: translateY(-10px);
                  pointer-events: none;
                  transition: all 0.2s ease;
                }

                .modern-dropdown-menu.open {
                  opacity: 1;
                  transform: translateY(0);
                  pointer-events: auto;
                }
              `}
            </style>
            {/* Tabs */}
            <div className="flex gap-0 bg-white p-0.5 rounded-full relative" ref={tabsContainerRef}>
              {/* Sliding Background Indicator */}
              <div ref={tabIndicatorRef} className="absolute bg-[#051226] rounded-full transition-all duration-300" style={{ top: '3px', height: 'calc(100% - 6px)' }}></div>
              
              {[
                { key: "all", label: "All", count: stats.assignment },
                { key: "active", label: "Active", count: stats.active },
                { key: "pending", label: "Pending", count: stats.pending },
                { key: "completed", label: "Completed", count: stats.completed },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={clsx(
                    "tab-btn px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10",
                    statusFilter === tab.key ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"
                  )}
                  data-status={tab.key}
                  onClick={() => handleTabClick(tab.key as any)}
                >
                  <span className="tab-label">{tab.label}</span>
                  <span className={clsx(
                    "tab-count w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-200",
                    statusFilter === tab.key ? "bg-white/30 text-white" : "bg-green-100 text-green-400"
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Date Filter */}
            <div className="flex gap-2">
              {/* Search with Icon */}
              <div className="relative w-64">
                <Search className="absolute text-gray-400 pointer-events-none z-10 w-4 h-4" style={{ left: '16px', top: '40%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search Campaign..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="datatable-input w-full pr-4 py-2 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-9 placeholder-gray-400" 
                  style={{ paddingLeft: '40px' }}
                />
              </div>

              {/* Date Filter with Modern Dropdown */}
              <div className="relative w-40 modern-dropdown-wrapper small rounded-full date-dropdown-container">
                <button 
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  className="modern-dropdown-button"
                >
                  <span>
                    {dateFilter === 'all' ? 'All Time' : 
                     dateFilter === '7' ? 'Last 7 Days' :
                     dateFilter === '30' ? 'Last 30 Days' :
                     dateFilter === '90' ? 'Last 3 Months' :
                     dateFilter === '180' ? 'Last 6 Months' :
                     'This Year'}
                  </span>
                  <div className="modern-dropdown-arrow">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showDateDropdown && (
                  <div className="modern-dropdown-menu open">
                    <button 
                      onClick={() => { setDateFilter('all'); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      All Time
                    </button>
                    <button 
                      onClick={() => { setDateFilter('7'); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button 
                      onClick={() => { setDateFilter('30'); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button 
                      onClick={() => { setDateFilter('90'); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 3 Months
                    </button>
                    <button 
                      onClick={() => { setDateFilter('180'); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 6 Months
                    </button>
                    <button 
                      onClick={() => { setDateFilter('365'); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      This Year
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Table Container with Fixed Height (VH) */}
            <div className="overflow-x-auto overflow-y-auto relative" style={{ height: "55vh", minHeight: "400px" }}>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        <span>Campaign Name</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === 'name' ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('start')}>
                      <div className="flex items-center gap-2">
                        <span>Start Date</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === 'start' ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('end')}>
                      <div className="flex items-center gap-2">
                        <span>End Date</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === 'end' ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === 'status' ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <span>Action</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCampaigns.length > 0 ? paginatedCampaigns.map((campaign) => {
                    const status = getCampaignStatus(campaign);
                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{campaignName(campaign)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span>{formatDate(campaign.start_date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span>{formatDate(campaign.end_date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(status)}</td>
                        <td className="px-4 py-3.5">{getActionButton(status, campaign.id)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="text-center py-12">
                          <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                            <SearchX className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Campaigns Found</h3>
                          <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 bg-gray-50 gap-3">
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <span>Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} out of {filteredCampaigns.length} Entries</span>
              </div>
              <div className="flex gap-1.5" id="paginationButtons">
                <button 
                  className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {(() => {
                  const buttons = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  
                  // First page + ellipsis
                  if (startPage > 1) {
                    buttons.push(
                      <button 
                        key={1}
                        className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100" 
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      buttons.push(
                        <span key="ellipsis1" className="px-2 text-gray-400 flex items-center">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      );
                    }
                  }
                  
                  // Page number buttons
                  for (let i = startPage; i <= endPage; i++) {
                    buttons.push(
                      <button 
                        key={i}
                        className={`min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all ${
                          i === currentPage 
                            ? 'bg-blue-50 text-blue-600 border-blue-500 font-semibold' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`} 
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  // Last page + ellipsis
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      buttons.push(
                        <span key="ellipsis2" className="px-2 text-gray-400 flex items-center">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      );
                    }
                    buttons.push(
                      <button 
                        key={totalPages}
                        className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100" 
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  
                  return buttons;
                })()}
                
                <button 
                  className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
