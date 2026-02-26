const campEmpPhishingSegmentData = window.EmployeePhishingSegments || {};
const campMetricsData = window.CampaignMetrics || {};
const reportToAdminSegments = window.ReportToAdminSegments || {};
const data = window.phishingSuccessRate || {};


var barOptions = {
  series: [{
    data: [campMetricsData.sent, campMetricsData.open, campMetricsData.clickLinkOpen, campMetricsData.interactForm, campMetricsData.formSubmit,
    campMetricsData.attachmentDownload]
  }],
  chart: {
    type: 'bar',
    height: 340,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: '45%',
      distributed: true
    }
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    categories: [
      window.translations?.campaign?.email_campaign_detail?.labelSent || 'Email Sent',
      window.translations?.campaign?.email_campaign_detail?.labelEmailOpen || 'Email Open',
      window.translations?.campaign?.email_campaign_detail?.labelClickedLink || 'Clicked Linked',
      window.translations?.campaign?.email_campaign_detail?.labelInteractForm || 'Interact Form',
      window.translations?.campaign?.email_campaign_detail?.labelFormSubmit || 'Form Submit',
      window.translations?.campaign?.email_campaign_detail?.labelAttachmentOpened || 'Attachment Opened'
    ],
    labels: {
      style: {
        colors: '#6b7280',
        fontSize: '14px',
        fontWeight: 500
      }
    },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#9ca3af',
        fontSize: '12px'
      }
    }
  },
  grid: {
    borderColor: '#f3f4f6',
    strokeDashArray: 4,
    xaxis: {
      lines: { show: false }
    }
  },
  colors: ['#38bdf8', '#a3e635', '#f87171', '#fbbf24', '#a78bfa', '#6366f1'],
  tooltip: {
    theme: 'light'
  }
};

new ApexCharts(document.querySelector("#barChart"), barOptions).render();


// Sucess chart 
const phishingSuccessRateData = [
  data?.view || 0,
  data?.linkClicks || 0,
  data?.targetCompromised || 0,
  data?.reportedToAdmin || 0
];

// Data
const emailViewed = phishingSuccessRateData[0];
const linksClicked = phishingSuccessRateData[1];
const targetCompromised = phishingSuccessRateData[2];
const reportedToAdmin = phishingSuccessRateData[3];

// Calculate success rate using new formula:
// (Email Viewed + Target Compromised) - Links Clicked
const total = emailViewed + linksClicked + targetCompromised;
const successFormula = (emailViewed + targetCompromised) - linksClicked;
const successRate = Math.max(0, Math.round((successFormula / total) * 100)); // Prevent negative %

// Update left labels dynamically
document.getElementById('emailViewedText').innerText = `${emailViewed} ${window.translations?.campaign?.email_campaign_detail?.labelPeople || 'People'}`;
document.getElementById('linksClickedText').innerText = `${linksClicked} ${window.translations?.campaign?.email_campaign_detail?.labelPeople || 'People'}`;
document.getElementById('targetCompromisedText').innerText = `${targetCompromised} ${window.translations?.campaign?.email_campaign_detail?.labelTimes || 'Times'}`;

// ApexCharts Configuration
var successOptions = {
  series: [emailViewed, linksClicked, targetCompromised, reportedToAdmin],
  chart: {
    type: 'donut',
    height: '100%'
  },
  labels: [
    window.translations?.campaign?.email_campaign_detail?.labelEmailViews || 'Email Viewed',
    window.translations?.campaign?.email_campaign_detail?.labelLinksClicked || 'Links Clicked',
    window.translations?.campaign?.email_campaign_detail?.labelTargetCompromised || 'Target Compromised',
    window.translations?.campaign?.email_campaign_detail?.labelReportToAdmin || 'Reported To Admin'
  ],
  colors: ['#fbbf24', '#f87171', '#34d399', '#38bdf8'],

  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '80%',
        labels: {
          show: true,
          name: { show: false },
          value: {
            show: true,
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            formatter: () => successRate + '%'
          },
          total: {
            show: true,
            label: window.translations?.campaign?.email_campaign_detail?.labelPhishingSuccess || 'Success Rate',
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: 'normal',
            formatter: () => '' // Only show label above percentage
          }
        }
      }
    }
  },
  legend: { show: false },
  stroke: { width: 0 },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val) {
        return val + ' ' + (window.translations?.campaign?.email_campaign_detail?.labelPeople || 'People');
      }
    }
  }
};

new ApexCharts(document.querySelector("#successChart"), successOptions).render();




// Employees Phishing Segments
var segmentsOptions = {
  series: [campEmpPhishingSegmentData.sent || 0, campEmpPhishingSegmentData.notOpen || 0, campEmpPhishingSegmentData.interactForm || 0,
  campEmpPhishingSegmentData.formSubmit || 0, campEmpPhishingSegmentData.attachmentDownload || 0],
  chart: {
    type: 'donut',
    height: 300
  },
  labels: [
    window.translations?.campaign?.email_campaign_detail?.labelSent || 'Sent Email',
    window.translations?.campaign?.email_campaign_detail?.labelEmailNotOpened || 'Email Not Opened',
    window.translations?.campaign?.email_campaign_detail?.labelInteractForm || 'Interact Form',
    window.translations?.campaign?.email_campaign_detail?.labelSubmitData || 'Submit Data',
    window.translations?.campaign?.email_campaign_detail?.labelAttachmentOpened || 'Attachment Opened'
  ],
  colors: ['#60a5fa', '#e5e7eb', '#fbbf24', '#a78bfa', '#4ade80'],
  legend: {
    position: 'bottom',
    fontSize: '14px',
    horizontalAlign: 'center',
    formatter: function (seriesName, opts) {
      return "&nbsp; " + seriesName + ":  " + opts.w.globals.series[opts.seriesIndex];
    },
  },
  dataLabels: {
    enabled: false
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val) {
        return val + " " + (window.translations?.campaign?.email_campaign_detail?.labelPeople || 'People');
      }
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '80%'
      }
    }
  }
};

new ApexCharts(document.querySelector("#segmentsChart"), segmentsOptions).render();


// Reported To Admin
var reportOptions = {
  series: [reportToAdminSegments.opened_not_reported, reportToAdminSegments.opened_and_reported, reportToAdminSegments.not_opened_but_reported],
  // series: [40, 30, 30],
  chart: { type: 'pie', height: 300 },
  labels: [
    window.translations?.campaign?.email_campaign_detail?.labelEmailOpenedNotReported || 'Email Opened Not Reported',
    window.translations?.campaign?.email_campaign_detail?.labelEmailOpenedAndReported || 'Email Opened & Reported',
    window.translations?.campaign?.email_campaign_detail?.labelEmailNotOpenedAndReported || 'Email Not Opened & Reported'
  ],

  colors: ['#f87171', '#60a5fa', '#4ade80'],
  legend: {
    position: 'bottom',
    fontSize: '14px',
    horizontalAlign: 'center',
    formatter: function (seriesName, opts) {
      return "&nbsp; " + seriesName + ":  " + opts.w.globals.series[opts.seriesIndex];
    },
  },
  dataLabels: { enabled: false },
  tooltip: { enabled: true }
};
new ApexCharts(document.querySelector("#reportChart"), reportOptions).render();

// Semi Donut Charts for bottom
function createSemiDonut(selector, colors, total) {
  var options = {
    series: [40, 32], // Example values
    chart: { type: 'donut', height: 180 },
    colors: colors,
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        donut: {
          size: '90%',
          labels: {
            show: true,
            name: { show: false },
            value: { show: false },
            total: {
              show: true,
              label: total,
              fontSize: '22px',
              fontWeight: 600,
              color: '#333'
            }
          }
        }
      }
    },
    tooltip: { enabled: true }
  };

  new ApexCharts(document.querySelector(selector), options).render();
}

createSemiDonut("#linksChart", ['#ef4444', '#22c55e'], '50');
createSemiDonut("#formChart", ['#fbbf24', '#22c55e'], '50');
createSemiDonut("#submitChart", ['#a78bfa', '#22c55e'], '50');
createSemiDonut("#attachChart", ['#3b82f6', '#22c55e'], '50');


function createSemiDonutChart(el, sentValue, openedValue, label1, label2, color1, color2) {
  var options = {
    series: [sentValue, openedValue],
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
              formatter: () => label1 // Use custom label for main name
            },
            value: {
              offsetY: -20,
              fontSize: '28px',
              fontWeight: 'medium',
              color: '#000',
              show: true,
              formatter: function (val) {
                const localeEl = document.getElementById("locale-data");
                const locale = localeEl ? localeEl.dataset.locale : 'en';
                return locale === 'ar' ? val.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : val;
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 'light',
              color: '#000',
              formatter: function (w) {
                let sent = w.globals.series[0];
                let opened = w.globals.series[1];
                const total = sent + opened;
                const localeEl = document.getElementById("locale-data");
                const locale = localeEl ? localeEl.dataset.locale : 'en';
                return locale === 'ar' ? total.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : total;
              }
            }
          }
        }
      }
    },
    colors: [color1, color2],
    labels: [label1, label2], // Custom labels for legend
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
        const localeEl = document.getElementById("locale-data");
        const locale = localeEl ? localeEl.dataset.locale : 'en';
        const num = opts.w.globals.series[opts.seriesIndex];
        const formattedNum = locale === 'ar' ? num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : num;
        return val + "  " + formattedNum;
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