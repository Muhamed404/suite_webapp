import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import Link from "next/link";

import { getContentAssetUrl } from "@/utils/contentAssetUrl";

export const DashboardCharts = () => {
  return (
    <div className="grid grid-cols-12 gap-2">
      {/* Employee Risk States */}
      <div className="col-span-4 row-span-3 row-start-9 bg-white rounded-xl p-4 flex flex-col items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-800 mb-2">Employee Risk States</h3>
        <div className="semichart w-72 h-72" data-admin="30" data-opened="90" data-sent="120" />
      </div>

      {/* Employee Certification */}
      <div className="col-span-4 col-start-5 row-start-9 bg-white rounded-xl p-4 flex flex-col items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-800 mb-2">Employee Certification</h3>
        <div
          className="leadchart w-60 h-60"
          data-text-size="28px"
          data-value="50"
          style={
            {
              "--color": "#3ACE89",
              "--color2": "#FB5050",
            } as React.CSSProperties
          }
        />

        <div className="flex justify-center gap-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Certified: 16
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            Not Certified: 18
          </span>
        </div>
      </div>

      {/* Security Awareness Score */}
      <div className="col-span-4 col-start-9 row-start-8">
        <Card>
          <CardBody className="p-4 flex flex-col h-full justify-center">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Image
                  alt=""
                  className="w-10 h-10"
                  height={40}
                  src={getContentAssetUrl("/images/icons/shield.svg")}
                  width={40}
                />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Security Awareness Score</h3>
                  <div className="flex items-center gap-1">
                    <p className="text-lg text-gray-800">50</p>
                    <p className="text-gray-400 text-xs font-medium">/100</p>
                  </div>
                </div>
              </div>

              <span className="bg-[#00CCC4] text-white text-sm font-medium px-2 py-0.5 rounded-full">
                Good
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top 3 Struggling Topics */}
      <div className="col-span-4 col-start-9 row-start-9">
        <Card>
          <CardBody className="p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-gray-800">Top 3 Struggling Topics</h3>
              <Link className="text-blue-600 text-xs font-medium" href="#">
                View All
              </Link>
            </div>

            <div className="space-y-1.5">
              {[
                {
                  icon: getContentAssetUrl("/images/icons/wifi.svg"),
                  label: "WIFI Security",
                  color: "bg-[#C9F1E2]",
                  iconColor: "text-[#0D9488]",
                },
                {
                  icon: getContentAssetUrl("/images/icons/physical.svg"),
                  label: "Physical Security",
                  color: "bg-[#DCE9FF]",
                  iconColor: "text-[#2563EB]",
                },
                {
                  icon: getContentAssetUrl("/images/icons/phishing.svg"),
                  label: "Phishing Security",
                  color: "bg-[#FEE2E2]",
                  iconColor: "text-[#DC2626]",
                },
              ].map((topic, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-[#F0F7F9] rounded-lg py-1.5 px-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full ${topic.color} flex items-center justify-center ${topic.iconColor}`}
                    >
                      <Image alt="" className="w-3 h-3" height={12} src={topic.icon} width={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-800">{topic.label}</span>
                  </div>
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-red-600 mt-2 flex items-center gap-1">
              <Image
                alt=""
                className="w-3 h-3"
                height={12}
                src={getContentAssetUrl("/images/icons/alert.svg")}
                width={12}
              />
              Your employees need attention on these topics
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Active Learners */}
      <div className="col-span-4 col-start-9 row-start-10">
        <Card className="bg-[#10B981] text-white">
          <CardBody className="p-4 flex justify-between items-center h-full">
            <div>
              <h3 className="text-xs font-medium opacity-90">Active Learners This Month</h3>
              <p className="text-lg">12</p>
            </div>
            <div className="w-12 h-12">
              <Image
                alt=""
                className="w-12 h-12"
                height={48}
                src={getContentAssetUrl("/images/check-fr.svg")}
                width={48}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Training Completion Rate */}
      <div className="col-span-4 col-start-9 row-start-11">
        <Card className="bg-[#A78BFA] text-white">
          <CardBody className="p-4 flex justify-between items-center h-full">
            <div>
              <h3 className="text-xs font-medium opacity-90">Training Completion Rate</h3>
              <p className="text-lg">76%</p>
            </div>

            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
              <div className="absolute inset-0 border-2 border-white rounded-full border-t-transparent rotate-45" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
