import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "h-10" }: LogoProps) => {
  return (
    <Link href="/">
      <div className={`relative ${className}`} aria-label="AwareMagnus Logo">
        <Image
          src="/logo.svg"
          alt="AwareMagnus Logo"
          width={120}
          height={40}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
    </Link>
  );
};

