// ===============================
// Get server data (passed from EJS)
// ===============================
const serverTimelineData = window.userInteractionTimeline || [];
const campaignStatsData = window.campaignStats || {};

// Transform server data or use default if no data
const events = serverTimelineData.length > 0
  ? serverTimelineData.filter((event) => event.time !== null) // Filter out events without timestamps
  : [];

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

  var chartEl = document.querySelector("#chart");
  if (chartEl) {
    var chart = new ApexCharts(chartEl, options);
    chart.render();
  }
} else {
  // Handle case when no timeline data is available
  var chartEl = document.querySelector("#chart");
  if (chartEl) {
    chartEl.innerHTML = `
    <div class="flex items-center justify-center h-96 text-gray-500">
      <div class="text-center">
        <h3 class="text-lg font-medium mb-2">No Timeline Data</h3>
        <p>No user interactions recorded for this campaign yet.</p>
      </div>
    </div>
  `;
  }
}

// ===============================
// Update Charts with Real Data
// ===============================
const interactionStats = campaignStatsData.campaignInteractionStats || {};

// Extract real data from server
const emailOpened = interactionStats.is_phish_msg_opened || 0;
const linksClicked = interactionStats.is_phish_msg_link_opened || 0;
const formInteracted = interactionStats.is_phish_msg_data_entered_in_form || 0;
const formSubmitted = interactionStats.is_phish_msg_data_entered_submited_in_form || 0;
const attachmentDownloaded = interactionStats.is_phish_msg_file_downloaded || 0;
const reportedToAdmin = interactionStats.is_phish_msg_reported_to_admin || 0;
const repliedText = interactionStats.is_phish_msg_replied_text_only || 0;
const repliedFile = interactionStats.is_phish_msg_replied_with_file || 0;

// Update success chart with real data
const emailViewed = emailOpened;
const targetCompromised = emailOpened + linksClicked + formInteracted + formSubmitted + attachmentDownloaded + repliedText + repliedFile;
const total = emailViewed + linksClicked + targetCompromised;

// Update DOM elements with real data
document.getElementById('emailViewedText').innerText = `${emailViewed} Times`;
document.getElementById('linksClickedText').innerText = `${linksClicked} Times`;
document.getElementById('targetCompromisedText').innerText = `${targetCompromised} Times`;

// Success Chart with real data
var successOptions = {
  series: [emailViewed, linksClicked, targetCompromised],
  chart: {
    type: 'donut',
    height: '100%'
  },
  labels: ['Email Viewed', 'Links Clicked', 'Target Compromised'],
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
            label: 'Total Actions',
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
        return val + ' Times';
      }
    }
  }
};

var successChartEl = document.querySelector("#successChart");
if (successChartEl) {
  new ApexCharts(successChartEl, successOptions).render();
}

// Employees Phishing Segments with real data
var segmentsOptions = {
  series: [
    emailOpened,
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
    'Email Opened',
    'Email Not Opened',
    'Interact Form',
    'Submit Data',
    'Attachment Opened'
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
        return val + " Times";
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

var segmentsChartEl = document.querySelector("#userPhishingSegmentsChart");
if (segmentsChartEl) {
  new ApexCharts(segmentsChartEl, segmentsOptions).render();
}

// Reported To Admin chart with real data
var reportOptions = {
  series: [
    emailOpened - reportedToAdmin, // Opened but not reported
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
        return val + ' Times';
      }
    }
  }
};
var reportChartEl = document.querySelector("#reportChart");
if (reportChartEl) {
  new ApexCharts(reportChartEl, reportOptions).render();
}

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

  var semiDonutEl = document.querySelector(selector);
  if (semiDonutEl) {
    new ApexCharts(semiDonutEl, options).render();
  }
}

if (document.querySelector("#linksChart")) createSemiDonut("#linksChart", ['#ef4444', '#22c55e'], '50');
if (document.querySelector("#formChart")) createSemiDonut("#formChart", ['#fbbf24', '#22c55e'], '50');
if (document.querySelector("#submitChart")) createSemiDonut("#submitChart", ['#a78bfa', '#22c55e'], '50');
if (document.querySelector("#attachChart")) createSemiDonut("#attachChart", ['#3b82f6', '#22c55e'], '50');










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
              show: true
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
                return sent + opened;
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