import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - AwareMagnus",
  description: "Sign in to your AwareMagnus account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

