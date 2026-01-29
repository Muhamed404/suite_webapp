import Image from "next/image";

export const LoginHero = () => {
  return (
    <div className="w-full h-full flex justify-center items-center rounded-3xl bg-[#E7F4FF] overflow-hidden">
      <div className="w-full h-full flex items-center justify-center p-8">
        <Image
          src="/images/login-vector.png"
          alt="Login Illustration"
          width={600}
          height={600}
          className="w-1/2 h-auto object-contain"
          priority
        />
      </div>
    </div>
  );
};

