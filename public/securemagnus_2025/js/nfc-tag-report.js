// ===============================
// Get server data (passed from EJS)
// ===============================

const campaignStatsData = window.campaignStats || {};


// ===============================
// IP Interaction Timeline (rangeBar)
// ===============================
const qrTagReportDetails = window.qrTagReportDetails || [];

// Pre-compute open_date = scanned_date + 5 seconds for each row
qrTagReportDetails.forEach(row => {
  if (row.scanned_date) {
    row.open_date = new Date(new Date(row.scanned_date).getTime() + 5000).toISOString();
  }
});

const eventFields = [
  { key: 'scanned_date',          label: 'Scanned',          color: '#38bdf8' },
  { key: 'open_date',             label: 'Open',             color: '#FBBF24' },
  { key: 'form_interaction_date', label: 'Form Interaction',  color: '#fb923c' },
  { key: 'form_submitted_date',   label: 'Form Submitted',    color: '#a78bfa' },
  { key: 'file_download_date',    label: 'File Downloaded',   color: '#4ade80' },
];

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString([], {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

if (qrTagReportDetails.length > 0) {
  const ipColors = ['#38bdf8', '#f87171', '#a78bfa', '#4ade80', '#fbbf24', '#fb923c'];

  // One series per IP — points at each event category
  const timelineSeries = qrTagReportDetails.map((row) => ({
    name: row.ip_address || `User ${row.id}`,
    data: eventFields.map(({ key }) => {
      const iso = row[key];
      return iso ? new Date(iso).getTime() : null;
    })
  }));

  var timelineOptions = {
    series: timelineSeries,
    chart: {
      type: 'line',
      height: 320,
      toolbar: { show: false },
      fontFamily: 'inherit',
      zoom: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 6, strokeWidth: 2, strokeColors: '#fff', hover: { size: 8 } },
    colors: ipColors,
    xaxis: {
      categories: eventFields.map(f => f.label),
      labels: { style: { colors: '#6b7280', fontSize: '13px', fontWeight: 500 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' },
        formatter: val => val ? new Date(val).toLocaleString([], {
          month: 'short', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }) : ''
      }
    },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px' },
    grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
    tooltip: {
      shared: false,
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const val = w.globals.series[seriesIndex][dataPointIndex];
        const ip = w.config.series[seriesIndex].name;
        const eventLabel = eventFields[dataPointIndex].label;
        const color = ipColors[seriesIndex % ipColors.length];
        if (!val) return '';
        return `<div style="padding:10px 14px;font-size:13px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12)">
          <div style="font-weight:600;color:#111827;margin-bottom:4px">${eventLabel}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
            <span style="color:#374151">${ip}</span>
          </div>
          <div style="color:#6b7280;margin-top:4px">${new Date(val).toLocaleString([], { month:'short', day:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })}</div>
        </div>`;
      }
    }
  };

  new ApexCharts(document.querySelector('#timelineChart'), timelineOptions).render();

  // ---- Per-IP interaction cards (top 4 by total scans) ----
  const cardsContainer = document.querySelector('#timelineCards');
  const topRows = [...qrTagReportDetails]
    .sort((a, b) => (b.total_scanned ?? 0) - (a.total_scanned ?? 0))
    .slice(0, 4);
  topRows.forEach((row, _idx) => {
    const ip = row.ip_address || `User ${row.id}`;
    const events = eventFields
      .map(f => ({ label: f.label, color: f.color, date: fmtDate(row[f.key]) }))
      .filter(e => e.date);

    const steps = events.map((e, i) => `
      <div class="flex items-start gap-3 relative">
        ${i < events.length - 1 ? `<div class="absolute left-[9px] top-5 w-0.5 h-full" style="background:${e.color}22"></div>` : ''}
        <span class="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center" style="border-color:${e.color};background:${e.color}18">
          <span class="w-2 h-2 rounded-full" style="background:${e.color}"></span>
        </span>
        <div>
          <p class="text-xs font-semibold text-gray-700">${e.label}</p>
          <p class="text-xs text-gray-400">${e.date}</p>
        </div>
      </div>`).join('');

    // Parse user_data JSON
    let userDataHtml = '';
    if (row.user_data) {
      try {
        const parsed = JSON.parse(row.user_data);
        const entries = Object.entries(parsed);
        if (entries.length > 0) {
          const rows = entries.map(([k, v]) => `
            <div class="flex items-start gap-2 py-2 border-b border-dashed last:border-0" style="border-color:#f43f5e22">
              <span class="text-xs font-semibold capitalize min-w-[90px] flex-shrink-0" style="color:#e11d48">${k.replace(/_/g,' ')}</span>
              <span class="text-xs text-gray-700 break-all font-mono">${String(v)}</span>
            </div>`).join('');
          userDataHtml = `
            <div class="mt-3 rounded-lg overflow-hidden" style="border:1px solid #f43f5e33">
              <div class="flex items-center gap-1.5 px-3 py-2" style="background:#fff1f2">
                <svg class="w-3.5 h-3.5 flex-shrink-0" style="color:#e11d48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <span class="text-xs font-bold uppercase tracking-widest" style="color:#e11d48">Captured Data</span>
              </div>
              <div class="px-3 divide-y" style="background:#fff8f8">${rows}</div>
            </div>`;
        }
      } catch (_) { /* invalid JSON — skip */ }
    }

    // User identity
    const profile = row.user?.UserProfile;
    const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';
    const avatarInitials = fullName
      ? (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')
      : ip.slice(0, 2).toUpperCase();

    const nameLine = fullName
      ? `<p class="text-sm font-semibold text-gray-800">${fullName}</p>`
      : `<p class="text-sm font-semibold text-gray-800">${ip}</p>`;

    const subLine = fullName
      ? `<div class="flex items-center gap-1.5 flex-wrap">
           <span class="text-xs text-gray-400">${ip}</span>
           ${row.user_email ? `<span class="text-xs px-1.5 py-0.5 rounded font-medium" style="background:#f0fdf4;color:#16a34a">${row.user_email}</span>` : ''}
         </div>`
      : row.user_email
        ? `<span class="text-xs px-1.5 py-0.5 rounded font-medium" style="background:#f0fdf4;color:#16a34a">${row.user_email}</span>`
        : '';

    cardsContainer.innerHTML += `
      <div class="rounded-xl overflow-hidden" style="border:1px solid #e5e7eb">
        <!-- Card header -->
        <div class="flex items-center justify-between px-4 py-3" style="background:#f8fafc;border-bottom:1px solid #e5e7eb">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:linear-gradient(135deg,#38bdf8,#0284c7)">${avatarInitials}</span>
            <div>
              ${nameLine}
              ${subLine}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded-full font-medium" style="background:#eff6ff;color:#2563eb">${row.total_scanned ?? 0} scan${(row.total_scanned ?? 0) !== 1 ? 's' : ''}</span>
            <span class="text-xs px-2 py-1 rounded-full font-medium" style="background:#f5f3ff;color:#7c3aed">${events.length} event${events.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <!-- Card body -->
        <div class="p-4 bg-white">
          <div class="flex flex-col gap-3">${steps || '<p class="text-xs text-gray-400">No events recorded</p>'}</div>
          ${userDataHtml}
        </div>
      </div>`;
  });

} else {
  document.querySelector('#timelineChart').innerHTML = `
    <div class="flex items-center justify-center h-32 text-gray-400 text-sm">No interaction data available.</div>
  `;
}

// ===============================
// Timeline Chart Configuration (Updated)
// ===============================
const events = window.interactionTimeline || [];
const _chartEl = document.querySelector('#chart');
if (_chartEl && events.length > 0) {
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
} else if (_chartEl) {
  // Handle case when no timeline data is available
  _chartEl.innerHTML = `
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
const openValue = qrScanned + 5;
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

// Employee Response chart — NFC interaction breakdown
const reportedToAdmin = interactionStats.reportedToAdmin || 0;
const _reportEl = document.querySelector('#reportChart');
if (_reportEl) {
  var reportOptions = {
    series: [qrScanned, openValue, formInteracted, formSubmitted, attachmentDownloaded],
    chart: { type: 'donut', height: 300 },
    labels: [
      window.i18n?.qr_report?.qr_scanned || 'Scanned',
      window.i18n?.qr_report?.opened || 'Open',
      window.i18n?.qr_report?.interact_form || 'Form Interacted',
      window.i18n?.qr_report?.submit_data || 'Form Submitted',
      window.i18n?.qr_report?.attachment_opened || 'File Downloaded'
    ],
    colors: ['#38bdf8', '#FBBF24', '#fb923c', '#a78bfa', '#4ade80'],
    legend: { position: 'bottom', fontSize: '13px' },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '75%' } } },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val) {
          return val + ' ' + (window.i18n?.qr_report?.times || 'Times');
        }
      }
    }
  };
  new ApexCharts(_reportEl, reportOptions).render();
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

  var el = document.querySelector(selector);
  if (el) {
    new ApexCharts(el, options).render();
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