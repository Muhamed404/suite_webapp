const baseOptions = {
  chart: {
    type: 'donut',
    width: '360px',
  },
  plotOptions: {
    pie: {
      startAngle: -90,
      endAngle: 270,
      donut: {
        size: '90%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '14px',
            offsetY: -10,
            formatter: function () {
              return translations.totalCampaigns || 'Total Campaigns';
            }
          },
          value: {
            show: true,
            fontSize: '20px',
            offsetY: 10,
            formatter: function () {
              return '100%';
            }
          },
          total: {
            show: true
          }
        }
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  fill: {
    type: 'solid'
  },
  legend: {
    position: 'right',
    formatter: function (val, opts) {
      let seriesValue = opts.w.globals.series[opts.seriesIndex];
      return `${val}: ${seriesValue}`;
    }
  },
  title: {
    text: ''
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 300
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
};

document.addEventListener("DOMContentLoaded", function () {
  const data = window.campaignChartData || {};
  const translations = window.chartTranslations || {};
  const campaignChartData = [
    data?.emailCount || 0,
    data?.smsCount || 0,
    data?.usbCount || 0,
    data?.nfcCount || 0,
    data?.qrCount || 0,
    0 // placeholder for WhatsApp
  ];
  // Check if all values are zero
  const allZero = campaignChartData.every(val => val === 0);

  let chartOptions;

  if (allZero) {
    chartOptions = {
      ...baseOptions,
      series: [1], // required to render the chart
      labels: ['No Data'],
      colors: ['#e0e0e0'],

      legend: { show: false },
      tooltip: { enabled: false },
      dataLabels: { enabled: false },

      title: {
        text: translations.noCampaignData || 'No Campaign Data',
        align: 'center'
      },

      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: { show: false },
              value: { show: false },
              total: {
                show: true,
                label: 'No Data',
                formatter: () => '' // prevents "1"
              }
            }
          }
        }
      }
    };
  } else {
    const total = campaignChartData.reduce((a, b) => a + b, 0);
    chartOptions = {
      ...baseOptions,
      series: campaignChartData,
      labels: [
        translations.email || 'Email',
        translations.sms || 'SMS',
        translations.usb || 'USB',
        translations.nfc || 'NFC',
        translations.qr || 'QR',
        translations.whatsapp || 'WhatsApp'
      ],
      colors: ['#57ABE6', '#FAA139', '#A3B5C3', '#45D8DD', '#AE62E9', '#47E7C5'],
      plotOptions: {
        ...baseOptions.plotOptions,
        pie: {
          ...baseOptions.plotOptions.pie,
          donut: {
            ...baseOptions.plotOptions.pie.donut,
            labels: {
              ...baseOptions.plotOptions.pie.donut.labels,
              name: {
                show: true,
                fontSize: '14px',
                offsetY: -10,
                formatter: function () {
                  return translations.totalCampaigns || 'Total Campaigns';
                }
              },
              value: {
                show: true,
                fontSize: '20px',
                offsetY: 10,
                formatter: function () {
                  return total.toString();
                }
              },
              total: {
                show: true
              }
            }
          }
        }
      }
    };
  }

  const productMgmtCampaignChart = new ApexCharts(
    document.querySelector("#campaignChart"),
    chartOptions
  );

  productMgmtCampaignChart.render();
});