import Image from "next/image";

import { brandAssets } from "@/config/branding";

export const LoginHero = () => {
  return (
    <div
      className="relative w-full h-full flex justify-center items-center rounded-3xl overflow-hidden"
      style={{
        backgroundImage: `url(${brandAssets.heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[var(--dark-color)]/30" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 p-8">
        <Image
          priority
          alt="Junior Magnus"
          className="w-2/3 max-w-xs h-auto object-contain drop-shadow-lg"
          height={120}
          src={brandAssets.logoLight}
          width={280}
        />
        <Image
          alt="Saudi Made"
          className="h-16 w-auto object-contain opacity-95"
          height={64}
          src={brandAssets.saudiMade}
          width={120}
        />
      </div>
    </div>
  );
};
