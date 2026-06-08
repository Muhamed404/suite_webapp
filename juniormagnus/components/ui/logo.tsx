import Image from "next/image";
import Link from "next/link";

import { brandAssets } from "@/config/branding";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const Logo = ({ className = "h-12", variant = "light" }: LogoProps) => {
  const src = variant === "dark" ? brandAssets.logoDark : brandAssets.logoLight;

  return (
    <Link href="/">
      <div aria-label="Junior Magnus Logo" className={`relative ${className}`}>
        <Image
          priority
          alt="Junior Magnus Logo"
          className="h-full w-auto object-contain"
          height={48}
          src={src}
          width={160}
        />
      </div>
    </Link>
  );
};
