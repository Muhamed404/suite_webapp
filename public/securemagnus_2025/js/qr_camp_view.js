 
const campMetricsData = window.CampaignMetrics || {};
// alert(JSON.stringify(campMetricsData,null,2));



var barOptions = {
  series: [{
    data: [campMetricsData.totalQRImages, campMetricsData.totalScans, campMetricsData.interactForm, campMetricsData.submitForm,
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
      localizedLabels.qrCodes,
      localizedLabels.totalScans,
      localizedLabels.interactForm,
      localizedLabels.submitForm,
      localizedLabels.attachmentDownloaded
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
  colors: ['#38bdf8', '#a3e635', '#fbbf24', '#a78bfa', '#6366f1'],
  tooltip: {
    theme: 'light'
  }
};

new ApexCharts(document.querySelector("#barChart"), barOptions).render();

// Success chart
const total = campMetricsData.totalQRImages || 1;

var successOptions = {
  series: [{
    data: [
      campMetricsData.totalQRImages,
      campMetricsData.uniqueScans,
      campMetricsData.uniqueInteractedCount,
      campMetricsData.uniqueFormSubmittedCount,
      campMetricsData.uniqueDownloadedCount
    ]

    
  }],
  chart: {
    type: 'bar',
    height: 300,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      horizontal: true,
      distributed: true,
      barHeight: '60%'
    }
  },
  dataLabels: {
    enabled: true,
    formatter: function (val) {
      return Math.round((val / total) * 100) + '%';
    },
    style: { fontSize: '12px', colors: ['#fff'] }
  },
  xaxis: {
    categories: [
      localizedLabels.qrCodes,
      localizedLabels.totalScans,
      localizedLabels.interactForm,
      localizedLabels.submitForm,
      localizedLabels.attachmentDownloaded
    ],
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      style: { colors: '#6b7280', fontSize: '13px', fontWeight: 500 }
    }
  },
  colors: ['#38bdf8', '#a3e635', '#fbbf24', '#a78bfa', '#6366f1'],
  legend: { show: false },
  grid: {
    borderColor: '#f3f4f6',
    xaxis: { lines: { show: false } }
  },
  tooltip: {
    theme: 'light',
    y: {
      formatter: function (val) {
        return val + ' ' + localizedLabels.people + ' (' + Math.round((val / total) * 100) + '%)';
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
    localizedLabels.qrCodesSent,
    localizedLabels.qrCodesNotScanned,
    localizedLabels.qrCodeScanned,
    localizedLabels.qrCodeSubmitData,
    localizedLabels.qrCodeAttachmentOpened
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

new ApexCharts(document.querySelector("#segmentsChart"), segmentsOptions).render();

