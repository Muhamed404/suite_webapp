
    document.addEventListener('DOMContentLoaded', () => {
        // Campaign Metrics Bar Chart
        const metricsChart = new ApexCharts(document.getElementById('campaignMetricsChart'), {
            series: [{
                name:window.I18N.count || 'Count',
                data: [
                    window.CampaignData.link_clicked,
                    window.CampaignData.page_visited,
                    window.CampaignData.form_interacted,
                    window.CampaignData.form_submitted,
                    window.CampaignData.file_downloaded
                ]
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: { columnWidth: '55%', borderRadius: 4, dataLabels: { position: 'top' } }
            },
            dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '12px', colors: ['#304758'] } },
            xaxis: {
                categories: [
                    window.I18N.linkClicked || "Link Clicked",
                    window.I18N.pageVisited || "Page Visited",
                    window.I18N.formInteracted || "Form Interacted",
                    window.I18N.formSubmitted || "Form Submitted",
                    window.I18N.fileDownloaded || "File Downloaded"
                ],
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            colors: ['#3b82f6'] // Tailwind blue-500, matches the SMS Sent card
        });
        metricsChart.render();

        // Interaction Summary Donut Chart
        const summaryChart = new ApexCharts(document.getElementById('interactionSummaryChart'), {
            series: [
                window.CampaignData.totalSMSSent - window.CampaignData.totalInviteeReportCount,
                window.CampaignData.totalInviteeReportCount
            ],
            chart: { type: 'donut', height: 350 },
            labels: [
                window.I18N.noInteraction || "No Interaction",
                window.I18N.interacted || "Interacted"
            ],
            colors: ['#10b981', '#ef4444'],  // Changed: Green for No Interaction, Red for Interacted
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            name: { show: true },
                            value: { show: true }
                        }
                    }
                }
            }
        });
        summaryChart.render();

        // Link Interaction Radial Chart
        const linkChart = new ApexCharts(document.getElementById('linkInteractionChart'), {
            series: [Math.round((window.CampaignData.totalUniqueClickCount / window.CampaignData.total_sms) * 100) || 0],
            chart: { type: 'radialBar', height: 200 },
            plotOptions: {
                radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    hollow: { size: '70%' },
                    dataLabels: { name: { show: false }, value: { show: true, fontSize: '18px', fontWeight: 'bold' } }
                }
            },
            colors: ['#a855f7'],
            labels: ['%']
        });
        linkChart.render();

        // Form Interaction Radial Chart
        const formChart = new ApexCharts(document.getElementById('formInteractionChart'), {
            series: [Math.round((window.CampaignData.totalUniqueFormInteractionCount / window.CampaignData.total_sms) * 100) || 0],
            chart: { type: 'radialBar', height: 200 },
            plotOptions: {
                radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    hollow: { size: '70%' },
                    dataLabels: { name: { show: false }, value: { show: true, fontSize: '18px', fontWeight: 'bold' } }
                }
            },
            colors: ['#14b8a6'],
            labels: ['%']
        });
        formChart.render();

        // Page Visit Radial Chart
        const pageChart = new ApexCharts(document.getElementById('pageVisitChart'), {
            series: [Math.round((window.CampaignData.totalUniqePageClickCount / window.CampaignData.total_sms) * 100) || 0],
            chart: { type: 'radialBar', height: 200 },
            plotOptions: {
                radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    hollow: { size: '70%' },
                    dataLabels: { name: { show: false }, value: { show: true, fontSize: '18px', fontWeight: 'bold' } }
                }
            },
            colors: ['#f97316'],
            labels: ['%']
        });
        pageChart.render();

        // File Download Radial Chart
        const fileChart = new ApexCharts(document.getElementById('fileDownloadChart'), {
            series: [Math.round((window.CampaignData.totalUniqueDownloadCount / window.CampaignData.total_sms) * 100) || 0],
            chart: { type: 'radialBar', height: 200 },
            plotOptions: {
                radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    hollow: { size: '70%' },
                    dataLabels: { name: { show: false }, value: { show: true, fontSize: '18px', fontWeight: 'bold' } }
                }
            },
            colors: ['#ef4444'],
            labels: ['%']
        });
        fileChart.render();

        // Search functionality
        document.getElementById('responseSearchInput')?.addEventListener('keyup', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('table tbody tr');

            rows.forEach(row => {
                const name = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
                if (name.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

 