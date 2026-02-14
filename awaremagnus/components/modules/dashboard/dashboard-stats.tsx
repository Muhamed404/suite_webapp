import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";

import { getContentAssetUrl } from "@/utils/contentAssetUrl";

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-12 grid-rows-20 gap-2">
      {/* Total User Licenses */}
      <div className="col-span-4 row-span-2">
        <Card className="bg-[linear-gradient(305deg,#4BABDC_0%,#5DB1FC_94.2%)] text-white">
          <CardBody className="p-3 flex gap-2 items-start">
            <Image
              alt=""
              className="w-10 h-10"
              height={40}
              src={getContentAssetUrl("/images/img/users-profile.svg")}
              width={40}
            />
            <div className="flex flex-col">
              <h3 className="text-sm font-medium">Total User Licenses</h3>
              <p className="text-base font-semibold">100</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Consumed Licenses */}
      <div className="col-span-4 row-span-2 col-start-5">
        <Card>
          <CardBody className="p-3 flex gap-2 items-start">
            <Image
              alt=""
              className="w-10 h-10"
              height={40}
              src={getContentAssetUrl("/images/img/users-licanse.svg")}
              width={40}
            />
            <div className="flex flex-col">
              <h3 className="text-sm font-medium">Total Consumed Licenses</h3>
              <p className="text-base font-semibold">78</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Security Posture */}
      <div className="col-span-8 col-start-1 row-start-3">
        <Card>
          <CardBody className="p-3 flex items-center gap-4 w-full">
            <div className="relative flex gap-2 items-center">
              <Image
                alt=""
                className="w-3 h-3"
                height={12}
                src={getContentAssetUrl("/images/shield-check.svg")}
                width={12}
              />
              <h3 className="text-sm font-medium whitespace-nowrap">Security Posture</h3>

              <Popover placement="bottom">
                <PopoverTrigger>
                  <Button
                    isIconOnly
                    aria-label="Info"
                    className="min-w-3 w-3 h-3 p-0"
                    variant="light"
                  >
                    <Image
                      alt=""
                      className="w-3 h-3 cursor-pointer"
                      height={12}
                      src={getContentAssetUrl("/images/info-information.svg")}
                      width={12}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="p-4 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl w-72">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">This is an info alert</h3>
                    </div>
                    <div className="mb-4 leading-relaxed">
                      More info about this info alert goes here. This example text is longer to show
                      spacing inside content.
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <div className="flex overflow-hidden rounded-lg w-full" data-level="7" id="segBar">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="h-3 w-full bg-[#9EC232] opacity-0 transition-all duration-300"
                    style={{
                      backgroundColor: i === 7 ? "#D1132A" : i === 6 ? "#E4590F" : "#9EC232",
                      opacity: i === 7 ? 1 : 0,
                    }}
                  />
                ))}
              </div>
            </div>

            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
              In Risk
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Organization Score */}
      <div className="col-span-4 row-span-4 col-start-9 row-start-1">
        <Card>
          <CardBody className="p-4 space-y-2">
            <h2 className="text-base font-semibold text-gray-900">Organization Score</h2>
            <h2 className="text-xs text-gray-900">Total Compliance Score</h2>

            <div className="flex w-full items-center">
              <div className="text-5xl text-gray-900 mr-3">05</div>
              <div className="mt-1 flex-1">
                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                  <div className="h-1.5 bg-green-500 rounded-full" style={{ width: "70%" }} />
                </div>
                <div className="text-right text-xs text-gray-500 font-medium mt-1">70%</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Image
                  alt=""
                  className="w-5 h-5"
                  height={20}
                  src={getContentAssetUrl("/images/img/score.svg")}
                  width={20}
                />
                <div>
                  <div className="text-lg font-semibold text-gray-900">32%</div>
                  <p className="text-gray-500 text-xs">Global Progress</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Image
                  alt=""
                  className="w-5 h-5"
                  height={20}
                  src={getContentAssetUrl("/images/img/score.svg")}
                  width={20}
                />
                <div>
                  <div className="text-lg font-semibold text-gray-900">43</div>
                  <p className="text-gray-500 text-xs">Total XP Tokens</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-orange-400 rounded-full" />
                <p className="text-gray-600 text-xs leading-tight">
                  Total Awareness
                  <br />
                  Campaigns conducted
                </p>
              </div>
              <div className="text-lg font-semibold text-gray-900">44</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Security Awareness Campaign Chart */}
      <div className="col-span-8 row-span-5 col-start-1 row-start-4">
        <Card>
          <CardBody className="p-4 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold text-gray-800">Security Awareness Campaign</h3>
              <button
                className="text-blue-600 text-xs font-medium bg-transparent border-0 cursor-pointer p-0 underline hover:text-blue-800"
                type="button"
              >
                View All
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">Last Campaign Date: 1/23/05</p>
            <div className="flex-1 min-h-[200px]" id="areaChart">
              {/* Chart placeholder - will be implemented with a chart library */}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Weekly Progress & Quiz Accuracy */}
      <div className="col-span-4 row-span-3 col-start-9 row-start-5">
        <div className="grid grid-cols-4 p-2 rounded-xl bg-white gap-2 h-full">
          <div className="bg-[#F1F5F8] rounded-xl p-3 flex flex-col items-center justify-between col-span-2 h-full">
            <h3 className="text-xs font-semibold mb-1">Weekly Progress</h3>
            <div className="leadchart h-32 w-32" color="#00CCC4" data-value="85" />
          </div>

          <div className="bg-[#F1F5F8] rounded-xl p-3 flex flex-col items-center justify-between col-span-2 h-full">
            <h3 className="text-xs font-semibold mb-1">Quiz Accuracy</h3>
            <div className="leadchart h-32 w-32" color="#7CC5FA" data-value="94" />
          </div>
        </div>
      </div>
    </div>
  );
};
