
const usbCampaignMetricsData = window.metrices || {};



var barOptions = {
  series: [{
    data: [usbCampaignMetricsData.totalDevices, usbCampaignMetricsData.totalPlugged, usbCampaignMetricsData.totalUnPlugged]
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
      'Total Devices',
      'Total Plugged',
      'Total Unplugged',
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
  colors: ['#38bdf8', '#f87171', '#a3e635'],
  tooltip: {
    theme: 'light'
  }
};

new ApexCharts(document.querySelector("#barChart"), barOptions).render();

 