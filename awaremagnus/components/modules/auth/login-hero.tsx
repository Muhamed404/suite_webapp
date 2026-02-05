import Image from "next/image";

export const LoginHero = () => {
  return (
    <div className="w-full h-full flex justify-center items-center rounded-3xl bg-[#E7F4FF] overflow-hidden">
      <div className="w-full h-full flex items-center justify-center p-8">
        <Image
          priority
          alt="Login Illustration"
          className="w-1/2 h-auto object-contain"
          height={600}
          src="/images/login-vector.png"
          width={600}
        />
      </div>
    </div>
  );
};
