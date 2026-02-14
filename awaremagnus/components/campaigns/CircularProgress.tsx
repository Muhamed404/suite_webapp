"use client";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = "#3FBDFF",
  backgroundColor = "#E5E7EB",
  label,
  sublabel,
  showPercentage = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <span className="text-2xl font-bold" style={{ color }}>
              {percentage}%
            </span>
          )}
          {!showPercentage && label && (
            <span className="text-3xl font-bold" style={{ color }}>
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <span className="text-sm text-gray-600 mt-2 font-medium">{sublabel}</span>
      )}
    </div>
  );
}
