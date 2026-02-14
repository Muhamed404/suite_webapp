import Image from "next/image";
import Link from "next/link";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "h-10" }: LogoProps) => {
  return (
    <Link href="/">
      <div aria-label="AwareMagnus Logo" className={`relative ${className}`}>
        <Image
          priority
          alt="AwareMagnus Logo"
          className="h-full w-auto object-contain"
          height={40}
          src={getContentAssetUrl("/logo.svg")}
          width={120}
        />
      </div>
    </Link>
  );
};
