// function createPhishmagnusDashboardSemiDonutChart(el, sentValue, openedValue, adminValue, color1, color2, color3) {
//   var options = {
//     series: [sentValue, openedValue, adminValue], // ✅ now 3 values
//     chart: {
//       type: 'donut',
//       height: 320,
//       offsetY: -10
//     },
//     plotOptions: {
//       pie: {
//         startAngle: -90,
//         endAngle: 90,
//         donut: {
//           size: '70%',
//           labels: {
//             show: true,
//             name: {
//               offsetY: 20,
//               fontSize: '16px',
//               color: '#000',
//               formatter: () => 'Opened'
//             },
//             value: {
//               offsetY: -20,
//               fontSize: '28px',
//               fontWeight: 'medium',
//               color: '#000',
//               show: true
//             },
//             total: {
//               show: true,
//               label: 'Remaining',
//               fontSize: '14px',
//               fontWeight: 'light',
//               color: '#000',
//               formatter: function (w) {
//                 let sent = w.globals.series[0];   // sent
//                 let opened = w.globals.series[1]; // opened
//                 return opened;             // ✅ still subtraction
//               }
//             }
//           }
//         }
//       }
//     },
//     colors: [color1, color2, color3], // ✅ 3 colors
//     labels: ['Sent', 'Opened', 'Reported To Admin'], // ✅ changed from "Other" → "Admin"
//     legend: {
//       show: true,
//       fontSize: '14px',
//       position: 'bottom',
//       horizontalAlign: 'center',
//       offsetY: -70,
//       itemMargin: {
//         horizontal: 8,
//         vertical: 2
//       },
//       formatter: function (val, opts) {
//         return val + "  " + opts.w.globals.series[opts.seriesIndex];
//       }
//     },
//     dataLabels: {
//       enabled: false
//     },
//     stroke: {
//       width: 2,
//       lineCap: 'round'
//     }
//   };

//   var chart = new ApexCharts(el, options);
//   chart.render();
// }

function createPhishmagnusDashboardSemiDonutChart(el, values, labels, formatter, color1, color2, color3) {
  var options = {
    series: values, // ✅ now 3 values
    chart: {
      type: 'donut',
      height: 320,
      offsetY: -10
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              offsetY: 20,
              fontSize: '16px',
              color: '#000',
              formatter: () => formatter
            },
            value: {
              offsetY: -20,
              fontSize: '28px',
              fontWeight: 'medium',
              color: '#000',
              show: true
            },
            total: {
              show: true,
              label: 'Remaining',
              fontSize: '14px',
              fontWeight: 'light',
              color: '#000',
              formatter: function (w) {
                let sent = w.globals.series[0];   // sent
                let opened = w.globals.series[1]; // opened
                return opened;             // ✅ still subtraction
              }
            }
          }
        }
      }
    },
    colors: [color1, color2, color3], // ✅ 3 colors
    labels: labels,
    legend: {
      show: true,
      fontSize: '14px',
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: -70,
      itemMargin: {
        horizontal: 8,
        vertical: 2
      },
      formatter: function (val, opts) {
        return val + "  " + opts.w.globals.series[opts.seriesIndex];
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2,
      lineCap: 'round'
    }
  };

  var chart = new ApexCharts(el, options);
  chart.render();
}



function createEmailCampaignSemiDonutChart(el, uniqueClick, repeatedClicks, noClicks, uniqueColor, repeatedClicksColor, noClicksColor, labels, formatter = 'Repeated Clicks') {
  var options = {
    series: [uniqueClick, repeatedClicks, noClicks], // ✅ now 3 values
    chart: {
      type: 'donut',
      height: 320,
      offsetY: -10
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              offsetY: 20,
              fontSize: '16px',
              color: '#000',
              formatter: () => formatter
            },
            value: {
              offsetY: -20,
              fontSize: '28px',
              fontWeight: 'medium',
              color: '#000',
              show: true
            },
            total: {
              show: true,
              label: 'Remaining',
              fontSize: '14px',
              fontWeight: 'light',
              color: '#000',
              formatter: function (w) {
                let sent = w.globals.series[0];   // sent
                let opened = w.globals.series[1]; // opened
                return opened;             // ✅ still subtraction
              }
            }
          }
        }
      }
    },
    colors: [uniqueColor, repeatedClicksColor, noClicksColor], // ✅ 3 colors
    labels: labels,
    legend: {
      show: true,
      fontSize: '14px',
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: -70,
      itemMargin: {
        horizontal: 8,
        vertical: 2
      },
      formatter: function (val, opts) {
        return val + "  " + opts.w.globals.series[opts.seriesIndex];
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2,
      lineCap: 'round'
    }
  };

  var chart = new ApexCharts(el, options);
  chart.render();
}

// Auto-generate charts from attributes
document.addEventListener("DOMContentLoaded", function () {
  // document.querySelectorAll('.semichart').forEach((el) => {
  //   const sent = parseInt(el.getAttribute('sent'), 10) || 0;
  //   const opened = parseInt(el.getAttribute('opened'), 10) || 0;
  //   const admin = parseInt(el.getAttribute('admin'), 10) || 0; // ✅ renamed attribute
  //   const color1 = el.getAttribute('color1') || '#CFE2FF';
  //   const color2 = el.getAttribute('color2') || '#4BA6FF';
  //   const color3 = el.getAttribute('color3') || '#FFB84B';

  //   createPhishmagnusDashboardSemiDonutChart(el, sent, opened, admin, color1, color2, color3);
  // });

  // below for NFC Dashboard Semi Donut Chart
  document.querySelectorAll('.dashboardNFCSemiChart').forEach((el) => {
    const totalNFCCodes = parseInt(el.getAttribute('totalNFCCodes'), 10) || 0;
    const totalScannedNFCCodes = parseInt(el.getAttribute('totalScannedNFCCodes'), 10) || 0;
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#4BA6FF';

    createPhishmagnusDashboardSemiDonutChart(el, [totalNFCCodes, totalScannedNFCCodes], [window.chartTranslations?.totalNFCCodes || 'Total NFC Codes', window.chartTranslations?.totalScanned || 'Total Scanned'], window.chartTranslations?.scanned || 'Scanned', color1, color2);
  });


  document.querySelectorAll('.dashboardWhatsappSemiChart').forEach((el) => {
    const sent = parseInt(el.getAttribute('sent'), 10) || 0;
    const opened = parseInt(el.getAttribute('opened'), 10) || 0;
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#4BA6FF';

    createPhishmagnusDashboardSemiDonutChart(el, [sent, opened], [window.chartTranslations?.sent || 'Sent', window.chartTranslations?.opened || 'Opened'], window.chartTranslations?.opened || 'Opened', color1, color2);
  });

  document.querySelectorAll('.dashboardEmailSemiChart').forEach((el) => {
    const sent = parseInt(el.getAttribute('sent'), 10) || 0;
    const opened = parseInt(el.getAttribute('opened'), 10) || 0;
    const admin = parseInt(el.getAttribute('admin'), 10) || 0; // ✅ renamed attribute
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#4BA6FF';
    const color3 = el.getAttribute('color3') || '#FFB84B';

    createPhishmagnusDashboardSemiDonutChart(el, [sent, opened, admin], [window.chartTranslations?.sent || 'Sent', window.chartTranslations?.opened || 'Opened', window.chartTranslations?.reportedToAdmin || 'Reported To Admin'], window.chartTranslations?.opened || 'Opened', color1, color2, color3);
  });

  document.querySelectorAll('.dashboardUsbSemiChart').forEach((el) => {
    const created = parseInt(el.getAttribute('created'), 10) || 0;
    const plugged = parseInt(el.getAttribute('plugged'), 10) || 0;
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#4BA6FF';
    createPhishmagnusDashboardSemiDonutChart(el, [created, plugged], [window.chartTranslations?.created || 'Created', window.chartTranslations?.plugged || 'Plugged'], window.chartTranslations?.plugged || 'Plugged', color1, color2);
  });



  document.querySelectorAll('.dashboardSmsSemiChart').forEach((el) => {
    const sent = parseInt(el.getAttribute('sent'), 10) || 0;
    const Unsent = parseInt(el.getAttribute('unsent'), 10) || 0;
    const admin = parseInt(el.getAttribute('open'), 10) || 0; // ✅ renamed attribute
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#ff4b4eff';
    const color3 = el.getAttribute('color3') || '#FFB84B';

    createPhishmagnusDashboardSemiDonutChart(el, [sent, Unsent, admin], [window.chartTranslations?.sent || 'Sent', window.chartTranslations?.unsent || 'Unsent', window.chartTranslations?.reportedToAdmin || 'Open'], window.chartTranslations?.unsent || 'Unsent', color1, color2, color3);
  });

  document.querySelectorAll('.dashboardQRSemiChart').forEach((el) => {
    const totalQRCodes = parseInt(el.getAttribute('totalQRCodes'), 10) || 0;
    const totalScannedQRCodes = parseInt(el.getAttribute('totalScannedQRCodes'), 10) || 0;
    // const admin = parseInt(el.getAttribute('admin'), 10) || 0; // ✅ renamed attribute
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#4BA6FF';
    // const color3 = el.getAttribute('color3') || '#FFB84B';

    createPhishmagnusDashboardSemiDonutChart(el, [totalQRCodes, totalScannedQRCodes], [window.chartTranslations?.totalQRImages || 'Total QR Images', window.chartTranslations?.totalScanned || 'Total Scanned'], window.chartTranslations?.scanned || 'Scanned', color1, color2);
  });

  document.querySelectorAll('.semichartLinksInteraction').forEach((el) => {
    const uniqueClick = parseInt(el.getAttribute('uniqueClick'), 10) || 0;
    const repeatedClicks = parseInt(el.getAttribute('repeatedClicks'), 10) || 0;
    const noClicks = parseInt(el.getAttribute('noClicks'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedClicksColor = el.getAttribute('color2') || '#FF4B4B';
    const noClicksColor = el.getAttribute('color3') || '#3ACE89';
    const labels = [
      window.translations?.campaign?.email_campaign_detail?.labelUnique || 'Unique',
      window.translations?.campaign?.email_campaign_detail?.labelRepeated || 'Repeated', 
      window.translations?.campaign?.email_campaign_detail?.labelNoInteraction || 'No Interaction'
    ];
    createEmailCampaignSemiDonutChart(el, uniqueClick, repeatedClicks, noClicks, uniqueColor, repeatedClicksColor, noClicksColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks');
  });


  document.querySelectorAll('.semichartInteractForm').forEach((el) => {
    const uniqueClick = parseInt(el.getAttribute('uniqueClick'), 10) || 0;
    const repeatedClicks = parseInt(el.getAttribute('repeatedClicks'), 10) || 0;
    const noClicks = parseInt(el.getAttribute('noClicks'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedClicksColor = el.getAttribute('color2') || '#FF4B4B';
    const noClicksColor = el.getAttribute('color3') || '#3ACE89';
    const labels = [
      window.translations?.campaign?.email_campaign_detail?.labelUniqueClicks || 'Unique Clicks',
      window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks',
      window.translations?.campaign?.email_campaign_detail?.labelNoClicks || 'No Clicks'
    ];
    createEmailCampaignSemiDonutChart(el, uniqueClick, repeatedClicks, noClicks, uniqueColor, repeatedClicksColor, noClicksColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks');
  });


  document.querySelectorAll('.semichartFormSubmitted').forEach((el) => {
    const uniqueClick = parseInt(el.getAttribute('uniqueClick'), 10) || 0;
    const repeatedClicks = parseInt(el.getAttribute('repeatedClicks'), 10) || 0;
    const noClicks = parseInt(el.getAttribute('noClicks'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedClicksColor = el.getAttribute('color2') || '#FF4B4B';
    const noClicksColor = el.getAttribute('color3') || '#3ACE89';
    const labels = [
      window.translations?.campaign?.email_campaign_detail?.labelUniqueClicks || 'Unique Clicks',
      window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks',
      window.translations?.campaign?.email_campaign_detail?.labelNoClicks || 'No Clicks'
    ];
    createEmailCampaignSemiDonutChart(el, uniqueClick, repeatedClicks, noClicks, uniqueColor, repeatedClicksColor, noClicksColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks');
  });


  document.querySelectorAll('.semichartAttachmentOpened').forEach((el) => {
    const uniqueClick = parseInt(el.getAttribute('uniqueClick'), 10) || 0;
    const repeatedClicks = parseInt(el.getAttribute('repeatedClicks'), 10) || 0;
    const noClicks = parseInt(el.getAttribute('noClicks'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedClicksColor = el.getAttribute('color2') || '#FF4B4B';
    const noClicksColor = el.getAttribute('color3') || '#3ACE89';
    const labels = [
      window.translations?.campaign?.email_campaign_detail?.labelUniqueClicks || 'Unique Clicks',
      window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks',
      window.translations?.campaign?.email_campaign_detail?.labelNoClicks || 'No Clicks'
    ];
    createEmailCampaignSemiDonutChart(el, uniqueClick, repeatedClicks, noClicks, uniqueColor, repeatedClicksColor, noClicksColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedClicks || 'Repeated Clicks');
  });

  // Below semi chart is for QR Campaign Details Page
  document.querySelectorAll('.qrSemiChartLink').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const repeatedScan = parseInt(el.getAttribute('repeatedScan'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Scans', 'Repeated Scans', 'No Scans'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, repeatedScan, noScan, uniqueColor, repeatedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedScans || 'Repeated Scans');
  });

  document.querySelectorAll('.qrSemiChartInteract').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const repeatedScan = parseInt(el.getAttribute('repeatedScan'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Scans', 'Repeated Scans', 'No Scans'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, repeatedScan, noScan, uniqueColor, repeatedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedInteractions || 'Repeated Interactions');
  });

  document.querySelectorAll('.qrSemiChartSubmitted').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const repeatedScan = parseInt(el.getAttribute('repeatedScan'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Scans', 'Repeated Scans', 'No Scans'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, repeatedScan, noScan, uniqueColor, repeatedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedSubmitted || 'Repeated Submitted');
  });


  document.querySelectorAll('.qrSemiChartDownload').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const repeatedScan = parseInt(el.getAttribute('repeatedScan'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Scans', 'Repeated Scans', 'No Scans'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, repeatedScan, noScan, uniqueColor, repeatedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedDownloads || 'Repeated Downloads');
  });


  // Below are the NFC Campaign Details Page Semi Donut Charts
  document.querySelectorAll('.nfcSemiChartLink').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const repeatedScan = parseInt(el.getAttribute('totalScan'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Scans', 'Repeated Scans', 'No Scans'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, repeatedScan, noScan, uniqueColor, repeatedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelTotalScans || 'Total Scans');
  });

  document.querySelectorAll('.nfcSemiChartInteract').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const totalInteractions = parseInt(el.getAttribute('totalInteractions'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const totalScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Interactions', 'Repeated Interactions', 'No Interactions'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, totalInteractions, noScan, uniqueColor, totalScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelTotalInteractions || 'Total Interactions');
  });

  document.querySelectorAll('.nfcSemiChartSubmitted').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const totalSubmitted = parseInt(el.getAttribute('totalSubmitted'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const totalSubmittedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Submitted', 'Repeated Submitted', 'No Submitted'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, totalSubmitted, noScan, uniqueColor, totalSubmittedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelTotalSubmitted || 'Total Submitted');
  });


  document.querySelectorAll('.nfcSemiChartDownload').forEach((el) => {
    const uniqueScan = parseInt(el.getAttribute('uniqueScan'), 10) || 0;
    const repeatedScan = parseInt(el.getAttribute('repeatedScan'), 10) || 0;
    const noScan = parseInt(el.getAttribute('noScan'), 10) || 0; // ✅ renamed attribute
    const uniqueColor = el.getAttribute('color1') || '#FFB84B';
    const repeatedScanColor = el.getAttribute('color2') || '#FF4B4B';
    const noScanColor = el.getAttribute('color3') || '#3ACE89';
    const labels = ['Unique Scans', 'Repeated Scans', 'No Scans'];
    createEmailCampaignSemiDonutChart(el, uniqueScan, repeatedScan, noScan, uniqueColor, repeatedScanColor, noScanColor, labels, window.translations?.campaign?.email_campaign_detail?.labelRepeatedDownloads || 'Repeated Downloads');
  });

  // document.querySelectorAll('.semichartFormSubmitted').forEach((el) => {
  //   const sent = parseInt(el.getAttribute('sent'), 10) || 0;
  //   const opened = parseInt(el.getAttribute('opened'), 10) || 0;
  //   const admin = parseInt(el.getAttribute('admin'), 10) || 0; // ✅ renamed attribute
  //   const color1 = el.getAttribute('color1') || '#CFE2FF';
  //   const color2 = el.getAttribute('color2') || '#4BA6FF';
  //   const color3 = el.getAttribute('color3') || '#FFB84B';

  //   createEmailCampaignSemiDonutChart(el, sent, opened, admin, color1, color2, color3);
  // });



  // document.querySelectorAll('.semichartAttachmentOpened').forEach((el) => {
  //   const sent = parseInt(el.getAttribute('sent'), 10) || 0;
  //   const opened = parseInt(el.getAttribute('opened'), 10) || 0;
  //   const admin = parseInt(el.getAttribute('admin'), 10) || 0; // ✅ renamed attribute
  //   const color1 = el.getAttribute('color1') || '#CFE2FF';
  //   const color2 = el.getAttribute('color2') || '#4BA6FF';
  //   const color3 = el.getAttribute('color3') || '#FFB84B';

  //   createEmailCampaignSemiDonutChart(el, sent, opened, admin, color1, color2, color3);
  // });
});
