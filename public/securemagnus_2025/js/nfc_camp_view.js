
const campMetricsData = window.CampaignMetrics || {};
const reportToAdminSegments = window.ReportToAdminSegments || {};


var barOptions = {
  series: [{
    data: [campMetricsData.totalNFCDevices, campMetricsData.totalScans, campMetricsData.totalNotScans, campMetricsData.openedLink,
    campMetricsData.interactForm, campMetricsData.submitForm,
    campMetricsData.attachmentDownloaded]
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
      localizedLabels.devicesSent,
      localizedLabels.totalScans,
      localizedLabels.notScanned,
      localizedLabels.openedLink,
      localizedLabels.interactForm,
      localizedLabels.submitForm,
      localizedLabels.downloaded
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
  colors: ['#7CC5FA', '#FB5050', '#3ACE89', '#FBBF24', '#00CCC4', '#8B5CF6', '#FF8F5E'],
  tooltip: {
    theme: 'light'
  }
};

var barChartEl = document.querySelector("#barChart");
if (barChartEl) {
  new ApexCharts(barChartEl, barOptions).render();
}

// Data
const openLink = campMetricsData.openedLink || 0;
const formInteractions = campMetricsData.interactForm || 0;
const attachmentDownloaded = campMetricsData.attachmentDownloaded || 0;
const targetCompromised = campMetricsData.totalNFCDevices - campMetricsData.totalNotScans || 0;
const totalNotScans = campMetricsData?.totalNotScans || 0

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) {
    el.innerText = value;
  }
}

setText('scanText', `${openLink} ${localizedLabels.people}`);
setText('notScanText', `${totalNotScans} ${localizedLabels.people}`);
setText('formInteractionText', `${formInteractions} ${localizedLabels.people}`);
setText('targetCompromisedText', `${targetCompromised} ${localizedLabels.people}`);
setText('attachmentDownloadedText', `${attachmentDownloaded} ${localizedLabels.people}`);
// ApexCharts Configuration
var successOptions = {
  series: [openLink, formInteractions, attachmentDownloaded, targetCompromised,totalNotScans],
  chart: {
    type: 'donut',
    height: '100%'
  },
  labels: [localizedLabels.nfcScan, localizedLabels.interaction, localizedLabels.download, localizedLabels.compromised, localizedLabels.notScanned],
  colors: ['#3b82f6', '#fb923c', '#34d399', '#ef4444', '#9ca3af'],

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
            formatter: () => successRate 
          },
          total: {
            show: true,
            label: 'Success Rate',
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
        return val + ' ' + localizedLabels.people;
      }
    }
  }
};

var successChartEl = document.querySelector("#successChart");
if (successChartEl) {
  new ApexCharts(successChartEl, successOptions).render();
}




// Employees Phishing Segments
var segmentsOptions = {
  series: [campMetricsData.totalNFCDevices || 0, campMetricsData.totalNotScans || 0,
  campMetricsData.totalScans || 0,
  campMetricsData.interactForm || 0,
  campMetricsData.attachmentDownloaded || 0],
  chart: {
    type: 'donut',
    height: 300
  },
  labels: [
    localizedLabels.totalDevices,
    localizedLabels.totalNotScanned,
    localizedLabels.totalScanned,
    localizedLabels.totalInteractions,
    localizedLabels.totalAttachmentDownloaded
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
        return val + " " + localizedLabels.people;
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

var segmentsChartEl = document.querySelector("#segmentsChart");
if (segmentsChartEl) {
  new ApexCharts(segmentsChartEl, segmentsOptions).render();
}


// Reported To Admin
var reportOptions = {
  series: [1, 1, 1],
  // series: [40, 30, 30],
  chart: { type: 'pie', height: 300 },
  labels: [localizedLabels.openNotReported, localizedLabels.openedReported, localizedLabels.notOpenedReported],

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
var adminReportChartEl = document.querySelector("#adminReportChart");
if (adminReportChartEl) {
  new ApexCharts(adminReportChartEl, reportOptions).render();
}
