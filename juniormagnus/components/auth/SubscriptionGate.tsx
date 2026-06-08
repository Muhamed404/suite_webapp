"use client";

// import { usePathname } from "next/navigation";
// import { useAuthStore } from "@/hooks/useAuthStore";
// import { useLicenseInfo } from "@/hooks/useSuiteAwm";
// import { isOrgAdmin } from "@/utils/roles";
// import { Button } from "@heroui/button";
// import { useLogout } from "@/services/authHooks";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

// const PUBLIC_PATHS = ["/login"];

export const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  // TODO: Re-enable license check once JuniorMagnus is registered in Service Suite subscriptions.
  return <>{children}</>;

  /*
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = isOrgAdmin(user?.role_id);
  const { data: licenseData, isFetched } = useLicenseInfo(isAdmin);
  const logoutMutation = useLogout();

  const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

  if (isPublic) {
    return <>{children}</>;
  }

  // Avoid false "no license" UI while license query is still loading.
  if (isAdmin && !isFetched) {
    return <>{children}</>;
  }

  const licenseInfo =
    licenseData?.JuniorMagnus?.Subscription ||
    licenseData?.juniormagnus?.Subscription ||
    licenseData?.All?.Subscription;
  const totalLicenses = licenseInfo?.TotalUserLicense ?? 0;
  const hasActiveSubscription = Boolean(licenseInfo) && totalLicenses > 0;

  if (isAdmin && !hasActiveSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">License Not Available</h2>
          <p className="text-gray-600 mb-6">
            Your Junior Magnus license is not available. Please contact your administrator.
          </p>
          <Button
            color="primary"
            onClick={() => logoutMutation.mutate()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
  */
};
