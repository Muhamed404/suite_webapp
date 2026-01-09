 
const campMetricsData = window.CampaignMetrics || {};
// alert(JSON.stringify(campMetricsData,null,2));



var barOptions = {
  series: [{
    data: [campMetricsData.totalQRImages, campMetricsData.totalScans, campMetricsData.openedLink, campMetricsData.interactForm, campMetricsData.submitForm,
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
      'QR Codes',
      'Total Scans',
      'Opened Link',
      'Interact Form',
      'Submit Form',
      'Attachment Downloaded'
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
// Data
const openLink =  campMetricsData.openedLink || 0;
const targetCompromised = campMetricsData.totalQRImages - campMetricsData.totalNotScans || 0;
const reportedToAdmin = campMetricsData?.reportedToAdmin || 0


// Update left labels dynamically
document.getElementById('scanText').innerText = `${campMetricsData.openedLink} People`;
document.getElementById('notScanText').innerText = `${campMetricsData.totalNotScans} People`;
document.getElementById('formInteractionText').innerText = `${campMetricsData.interactForm} People`;
document.getElementById('targetCompromisedText').innerText = `${targetCompromised} People`;
document.getElementById('attachmentDownloadedText').innerText = `${campMetricsData.attachmentDownloaded} People`;

// ApexCharts Configuration
var successOptions = {
  series: [campMetricsData.openedLink, campMetricsData.interactForm, campMetricsData.attachmentDownloaded, targetCompromised,campMetricsData.totalNotScans],
  chart: {
    type: 'donut',
    height: '100%'
  },
  labels: ['Scanned',  'Interaction', 'File Downloaded', 'Target Compromised', 'Not Scanned'],
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
        return val + ' People';
      }
    }
  }
};

new ApexCharts(document.querySelector("#successChart"), successOptions).render();




// Employees Phishing Segments
var segmentsOptions = {
  series: [campMetricsData.totalQRImages || 0, campMetricsData.totalNotScans || 0, campMetricsData.interactForm || 0,
  campMetricsData.submitForm || 0, campMetricsData.attachmentDownloaded || 0],
  chart: {
    type: 'donut',
    height: 300
  },
  labels: [
    'QR Codes Sent',
    'QR Codes Not Scanned',
    'QR Code Scanned',
    'QR Code Submit Data',
    'QR Code Attachment Opened'
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
        return val + " People";
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

