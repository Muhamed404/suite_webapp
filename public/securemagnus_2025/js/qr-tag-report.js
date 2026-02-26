// ===============================
// Get server data (passed from EJS)
// ===============================
const serverTimelineData = window.interactionTimeline || [];
const campaignStatsData = window.campaignStats || {};

// Transform server data or use default if no data
const events = serverTimelineData.length > 0 ? 
  serverTimelineData.filter(event => event.time !== null) : // Filter out events without timestamps
  [];

console.log('Events for chart:', events);

// ===============================
// Timeline Chart Configuration (Updated)
// ===============================
if (events.length > 0) {
  var options = {
    series: [{
      name: "User Journey",
      data: events.map(e => ({ x: e.name, y: new Date(e.time).getTime() }))
    }],
    chart: {
      type: "area",
      height: 400,
      toolbar: { show: false }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    markers: {
      size: 6,
      colors: ["#00CCC4"],
      strokeColors: "#fff",
      strokeWidth: 2
    },
    colors: ["#00CCC4"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        gradientToColors: ["#009688"],
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100]
      }
    },
    xaxis: {
      type: "category",
      categories: events.map(e => e.name),
      labels: {
        style: { fontSize: "14px" }
      }
    },
    yaxis: {
      min: events.length > 0 ? new Date(events[0].time).getTime() : new Date().getTime(),
      max: events.length > 0 ? new Date(events[events.length - 1].time).getTime() : new Date().getTime(),
      labels: {
        formatter: val => {
          const d = new Date(val);
          return d.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "2-digit"
          });
        }
      },
      title: { text: "Date" }
    },
    tooltip: {
      y: {
        formatter: val => {
          const d = new Date(val);
          return d.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: "2-digit",
            minute: "2-digit"
          });
        }
      }
    },
    grid: {
      borderColor: "#ccc",
      strokeDashArray: 4
    }
  };

  var chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
} else {
  // Handle case when no timeline data is available
  document.querySelector("#chart").innerHTML = `
    <div class="flex items-center justify-center h-96 text-gray-500">
      <div class="text-center">
        <h3 class="text-lg font-medium mb-2">${window.i18n?.qr_report?.no_timeline_data || 'No Timeline Data'}</h3>
        <p>${window.i18n?.qr_report?.no_user_interactions || 'No user interactions recorded for this campaign yet.'}</p>
      </div>
    </div>
  `;
}

// ===============================
// Update Charts with Real Data
// ===============================
const interactionStats = window.interactionStats || {};

// Extract real data from server
const qrScanned = interactionStats.is_opened || 0;
const formInteracted = interactionStats.is_interacted || 0;
const formSubmitted = interactionStats.is_submitted || 0;
const attachmentDownloaded = interactionStats.is_downloaded || 0;


// Update success chart with real data
const targetCompromised = qrScanned + formInteracted + formSubmitted + attachmentDownloaded;
const total = qrScanned + formInteracted + targetCompromised;

// Update DOM elements with real data
const timesText = window.i18n?.qr_report?.times || 'Times';
document.getElementById('qrScanned').innerText = `${qrScanned} ${timesText}`;
document.getElementById('formInteract').innerText = `${formInteracted} ${timesText}`;
document.getElementById('targetCompromisedText').innerText = `${targetCompromised} ${timesText}`;

// Success Chart with real data
var successOptions = {
  series: [qrScanned, formInteracted, targetCompromised],
  chart: {
    type: 'donut',
    height: '100%'
  },
  labels: [
    window.i18n?.qr_report?.qr_scanned || 'QR Scanned',
    window.i18n?.qr_report?.links_clicked || 'Links Clicked', 
    window.i18n?.qr_report?.target_compromised || 'Target Compromised'
  ],
  colors: ['#38bdf8', '#f87171', '#34d399'],
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
            formatter: () => total
          },
          total: {
            show: true,
            label: window.i18n?.qr_report?.total_actions || 'Total Actions',
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: 'normal',
            formatter: () => ''
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
        return val + ' ' + (window.i18n?.qr_report?.times || 'Times');
      }
    }
  }
};

new ApexCharts(document.querySelector("#successChart"), successOptions).render();

// Employees Phishing Segments with real data
var segmentsOptions = {
  series: [
    qrScanned,
    interactionStats.notOpenCount || 0,
    formInteracted,
    formSubmitted,
    attachmentDownloaded
  ],
  chart: {
    type: 'donut',
    height: 300
  },
  labels: [
    window.i18n?.qr_report?.qr_scanned || 'QR Scanned',
    window.i18n?.qr_report?.qr_not_scanned || 'QR Not Scanned',
    window.i18n?.qr_report?.interact_form || 'Interact Form',
    window.i18n?.qr_report?.submit_data || 'Submit Data',
    window.i18n?.qr_report?.attachment_opened || 'Attachment Opened'
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
  dataLabels: { enabled: false },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val) {
        return val + " " + (window.i18n?.qr_report?.times || 'Times');
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

new ApexCharts(document.querySelector("#userPhishingSegmentsChart"), segmentsOptions).render();

// Reported To Admin chart with real data
var reportOptions = {
  series: [
    qrScanned - reportedToAdmin, // Opened but not reported
    reportedToAdmin, // Reported
    0 // Not opened but reported (adjust based on your logic)
  ],
  chart: { type: 'pie', height: 300 },
  labels: ['Email Opened Not Reported', 'Email Opened & Reported', 'Email Not Opened & Reported'],
  colors: ['#f87171', '#60a5fa', '#4ade80'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: false },
  tooltip: { 
    enabled: true,
    y: {
      formatter: function (val) {
        return val + ' ' + (window.i18n?.qr_report?.times || 'Times');
      }
    }
  }
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

// Auto-generate charts from attributes
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('.semichart').forEach((el) => {
    const sent = parseInt(el.getAttribute('sent'), 10) || 0;
    const opened = parseInt(el.getAttribute('opened'), 10) || 0;
    const label1 = el.getAttribute('label1') || 'Sent';
    const label2 = el.getAttribute('label2') || 'Opened';
    const color1 = el.getAttribute('color1') || '#CFE2FF';
    const color2 = el.getAttribute('color2') || '#4BA6FF';

    createSemiDonutChart(el, sent, opened, label1, label2, color1, color2);
  });
});