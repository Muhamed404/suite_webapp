"use client";

import type { Certificate } from "@/types/campaign";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useUserCertificates } from "@/hooks/useCampaign";
import { EmptyState } from "@/components/ui/empty-state";
import { campaignService } from "@/services/campaignService";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
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

function certificateName(c: Certificate): string {
  return c.certificate_name ?? c.name ?? c.title ?? `Certificate ${c.id}`;
}

export function CertificateListPage() {
  const t = useTranslations("campaigns");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();

  const { data: certsRes, isLoading } = useUserCertificates();
  const certificates = certsRes?.success ? (certsRes.data ?? []) : [];

  // Transform certificates to match table format
  const certificateData = certificates.map(cert => ({
    id: cert.id,
    name: cert.campaign_name || 'Unknown Campaign',
    content: cert.module_name || 'Unknown Module',
    date: cert.certificate_issue_date || cert.created_at || '',
    status: (cert.status as 'active' | 'pending' | 'completed') || 'completed'
  }));

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const [currentStatus, setCurrentStatus] = useState('all');
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentDateFilter, setCurrentDateFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Refs for tab indicator animation
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

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
    updateTabIndicator(currentStatus);
  }, [currentStatus]);

  // Helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const statusBadge = (status: string) => {
    const badges = {
      active: { class: 'bg-green-50 text-green-700 border border-green-200', text: 'Active' },
      pending: { class: 'bg-amber-50 text-amber-700 border border-amber-200', text: 'Pending' },
      completed: { class: 'bg-gray-50 text-gray-700', text: 'Completed' }
    };
    const badge = badges[status as keyof typeof badges] || badges.completed;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badge.class} text-[10px] font-semibold min-w-[96px] justify-center`}>
        {badge.text}
      </span>
    );
  };

  const actionButton = (cert: typeof certificateData[0]) => {
    const handleDownload = async () => {
      try {
        await campaignService.downloadCertificate(cert.id);
      } catch (error) {
        console.error('Failed to download certificate:', error);
        // You might want to show a toast or alert here
      }
    };

    return (
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 border border-sky-500 text-sky-500 px-2 py-1.5 rounded-full text-[11px] text-xs hover:bg-sky-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        <span>Download</span>
      </button>
    );
  };

  const filterByDateRange = (data: typeof certificateData) => {
    if (currentDateFilter === 'all') return data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = parseInt(currentDateFilter, 10);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - days);
    return data.filter(item => new Date(item.date) >= cutoff);
  };

  const filteredData = () => {
    let filtered = [...certificateData];
    if (currentStatus !== 'all') {
      filtered = filtered.filter(c => c.status === currentStatus);
    }
    if (currentSearch) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
        c.content.toLowerCase().includes(currentSearch.toLowerCase())
      );
    }
    filtered = filterByDateRange(filtered);

    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;
        if (sortColumn === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortColumn === 'content') {
          valA = a.content.toLowerCase();
          valB = b.content.toLowerCase();
        } else if (sortColumn === 'date') {
          valA = new Date(a.date);
          valB = new Date(b.date);
        } else if (sortColumn === 'status') {
          valA = a.status;
          valB = b.status;
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleTabClick = (status: string) => {
    setCurrentStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setCurrentSearch(value);
    setCurrentPage(1);
  };

  // Header handlers
  const handleSearch = (value: string) => {
    setCurrentSearch(value);
    setCurrentPage(1);
  };

  const handleMailClick = () => {
    // TODO: Implement mail functionality
    console.log('Mail clicked');
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
    console.log('Notification clicked');
  };

  const handleProfileClick = () => {
    // TODO: Implement profile functionality
    console.log('Profile clicked');
  };

  const changePage = (page: number) => {
    const totalPages = Math.ceil(filteredData().length / rowsPerPage) || 1;
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Calculate pagination
  const data = filteredData();
  const total = data.length;
  const totalPages = Math.ceil(total / rowsPerPage) || 1;
  const start = (currentPage - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, total);
  const pageData = data.slice(start, end);

  // Tab counts
  const allCount = certificateData.length;
  const activeCount = certificateData.filter(c => c.status === 'active').length;
  const pendingCount = certificateData.filter(c => c.status === 'pending').length;
  const completedCount = certificateData.filter(c => c.status === 'completed').length;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-3">


          {/* Breadcrumb */}
          <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5">
            <a href="#" className="hover:text-gray-700 transition">System branding</a>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">Certificate</span>
          </nav>

          {/* Header */}
          <div className="flex items-center mb-4">
            <h1 className="text-xl font-semibold">Certificate List</h1>
          </div>

          {/* Filters */}
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
              <div ref={tabIndicatorRef} className="absolute bg-[#051226] rounded-full transition-all duration-300" style={{ top: '3px', height: 'calc(100% - 6px)' }}></div>

              <button className={`tab-btn ${currentStatus === 'all' ? 'active' : ''} px-3 py-0.5 text-xs font-semibold ${currentStatus === 'all' ? 'text-white' : 'bg-transparent text-gray-700'} rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`} data-status="all" onClick={() => handleTabClick('all')}>
                <span className="tab-label">All</span>
                <span className={`tab-count w-5 h-5 rounded-full ${currentStatus === 'all' ? 'bg-white/30 text-white' : 'bg-green-100 text-green-400'} text-[10px] font-bold flex items-center justify-center transition-all duration-200`}>{allCount}</span>
              </button>
              <button className={`tab-btn ${currentStatus === 'active' ? 'active' : ''} px-3 py-0.5 text-xs font-semibold ${currentStatus === 'active' ? 'text-white' : 'bg-transparent text-gray-700'} rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`} data-status="active" onClick={() => handleTabClick('active')}>
                <span className="tab-label">Active</span>
                <span className={`tab-count w-5 h-5 rounded-full ${currentStatus === 'active' ? 'bg-white/30 text-white' : 'bg-green-100 text-green-400'} text-[10px] font-bold flex items-center justify-center transition-all duration-200`}>{activeCount}</span>
              </button>
              <button className={`tab-btn ${currentStatus === 'pending' ? 'active' : ''} px-3 py-0.5 text-xs font-semibold ${currentStatus === 'pending' ? 'text-white' : 'bg-transparent text-gray-700'} rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`} data-status="pending" onClick={() => handleTabClick('pending')}>
                <span className="tab-label">Pending</span>
                <span className={`tab-count w-5 h-5 rounded-full ${currentStatus === 'pending' ? 'bg-white/30 text-white' : 'bg-green-100 text-green-400'} text-[10px] font-bold flex items-center justify-center transition-all duration-200`}>{pendingCount}</span>
              </button>
              <button className={`tab-btn ${currentStatus === 'completed' ? 'active' : ''} px-3 py-0.5 text-xs font-semibold ${currentStatus === 'completed' ? 'text-white' : 'bg-transparent text-gray-700'} rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`} data-status="completed" onClick={() => handleTabClick('completed')}>
                <span className="tab-label">Completed</span>
                <span className={`tab-count w-5 h-5 rounded-full ${currentStatus === 'completed' ? 'bg-white/30 text-white' : 'bg-green-100 text-green-400'} text-[10px] font-bold flex items-center justify-center transition-all duration-200`}>{completedCount}</span>
              </button>
            </div>

            {/* Search & Date Filter */}
            <div className="flex gap-2">
              {/* Search with Icon */}
              <div className="relative w-64">
                <Search className="absolute text-gray-400 pointer-events-none z-10 w-4 h-4" style={{ left: '16px', top: '40%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search certificate..."
                  value={currentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                    {currentDateFilter === 'all' ? 'All Time' :
                      currentDateFilter === '7' ? 'Last 7 Days' :
                        currentDateFilter === '30' ? 'Last 30 Days' :
                          currentDateFilter === '90' ? 'Last 3 Months' :
                            currentDateFilter === '180' ? 'Last 6 Months' :
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
                      onClick={() => { setCurrentDateFilter('all'); setCurrentPage(1); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => { setCurrentDateFilter('7'); setCurrentPage(1); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => { setCurrentDateFilter('30'); setCurrentPage(1); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => { setCurrentDateFilter('90'); setCurrentPage(1); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 3 Months
                    </button>
                    <button
                      onClick={() => { setCurrentDateFilter('180'); setCurrentPage(1); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Last 6 Months
                    </button>
                    <button
                      onClick={() => { setCurrentDateFilter('365'); setCurrentPage(1); setShowDateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      This Year
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto overflow-y-auto relative" style={{ height: "55vh", minHeight: "400px" }}>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" data-sort="name" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        <span>Certificate Name</span>
                        <span className={`sort-icon ${sortColumn === 'name' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {sortColumn === 'name' ? (
                            sortDirection === 'asc' ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            )
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" data-sort="content" onClick={() => handleSort('content')}>
                      <div className="flex items-center gap-2">
                        <span>Content Name</span>
                        <span className={`sort-icon ${sortColumn === 'content' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {sortColumn === 'content' ? (
                            sortDirection === 'asc' ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            )
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" data-sort="date" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-2">
                        <span>Issue Date</span>
                        <span className={`sort-icon ${sortColumn === 'date' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {sortColumn === 'date' ? (
                            sortDirection === 'asc' ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            )
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors" data-sort="status" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <span className={`sort-icon ${sortColumn === 'status' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {sortColumn === 'status' ? (
                            sortDirection === 'asc' ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            )
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
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
                <tbody id="tableBody" className="divide-y divide-gray-100">
                  {pageData.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-700">{cert.name}</td>
                      <td className="px-4 py-3.5 text-gray-600">{cert.content}</td>
                      <td className="px-4 py-3.5 text-gray-600">{formatDate(cert.date)}</td>
                      <td className="px-4 py-3.5">{statusBadge(cert.status)}</td>
                      <td className="px-4 py-3.5">{actionButton(cert)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div id="emptyState" className={`${total === 0 && !isLoading ? '' : 'hidden'} absolute inset-0 flex items-center justify-center bg-white`}>
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Certificates Found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                </div>
              </div>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading certificates...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5  bg-gray-50 gap-3">
              <div id="paginationInfo" className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <span>Showing {start + 1}–{end} out of {total} Entries</span>
              </div>
              <div id="paginationButtons" className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all ${page === currentPage
                        ? 'bg-blue-50 text-blue-600 border-blue-500 font-semibold'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    onClick={() => changePage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
