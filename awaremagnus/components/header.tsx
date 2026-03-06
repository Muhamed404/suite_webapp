"use client";

import { useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";

interface HeaderProps {
  title: string;
  name: string;
  email: string;
  onSearch: (value: string) => void;
  onMailClick: () => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
}

export const Header = ({
  title,
  name,
  email,
  onSearch,
  onMailClick,
  onNotificationClick,
  onProfileClick,
}: HeaderProps) => {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side - Search and Icons */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <input
            className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search..."
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Mail */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={onMailClick}
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Notification */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={onNotificationClick}
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 17h5l-5 5v-5zM15 7v5h5l-5-5zM5 17h5l-5 5v-5zM5 7v5H0l5-5z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Profile */}
        <button
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={onProfileClick}
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
        </button>
      </div>
    </div>
  );
};
