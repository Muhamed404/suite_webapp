"use client";

import "@/services/authBootstrap";
import { AuthGate } from "@/components/auth/AuthGate";
import { TokenFromHashHandler } from "@/components/auth/TokenFromHashHandler";
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  return (
    <AuthGate>
      <TokenFromHashHandler />
      <SubscriptionGate>
        {children}
      </SubscriptionGate>
    </AuthGate>
  );
};
