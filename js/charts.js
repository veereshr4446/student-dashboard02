// ============================================================
//  CHARTS.JS — Chart.js setup for dashboard + analytics.
// ============================================================

let attendanceChartInstance = null;
let cieChartInstance = null;
let semesterTrendChartInstance = null;

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#94a3b8' : '#6b7a8f',
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
    };
}

// ----- DASHBOARD: Attendance Trend + CIE Performance -----
function initDashboardCharts() {
    const canvas1 = document.getElementById('attendanceChart');
    const canvas2 = document.getElementById('cieChart');
    if (!canvas1 || !canvas2) return;

    const colors = getChartColors();
    const labels = subjectsData.map(s => s.code);

    if (attendanceChartInstance) attendanceChartInstance.destroy();
    if (cieChartInstance) cieChartInstance.destroy();

    attendanceChartInstance = new Chart(canvas1.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: subjectsData.map(s => s.attendance),
                borderColor: '#4f7df3',
                backgroundColor: 'rgba(79,125,243,0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4f7df3',
                pointRadius: 3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ctx.parsed.y + '%' } }
            },
            scales: {
                y: { min: 50, max: 100, ticks: { font: { size: 8 }, color: colors.text, callback: (v) => v + '%' }, grid: { color: colors.grid } },
                x: { ticks: { font: { size: 7 }, maxRotation: 45, minRotation: 45, color: colors.text }, grid: { display: false } }
            }
        }
    });

    cieChartInstance = new Chart(canvas2.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'CIE-1', data: subjectsData.map(s => s.cie[0]), backgroundColor: 'rgba(79,125,243,0.55)', borderColor: '#4f7df3', borderWidth: 1, borderRadius: 3 },
                { label: 'CIE-2', data: subjectsData.map(s => s.cie[1]), backgroundColor: 'rgba(108,99,255,0.55)', borderColor: '#6c63ff', borderWidth: 1, borderRadius: 3 },
                { label: 'CIE-3', data: subjectsData.map(s => s.cie[2]), backgroundColor: 'rgba(16,185,129,0.55)', borderColor: '#10b981', borderWidth: 1, borderRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.y + '/25' } }
            },
            scales: {
                y: { min: 0, max: 25, ticks: { font: { size: 8 }, color: colors.text, stepSize: 5 }, grid: { color: colors.grid } },
                x: { ticks: { font: { size: 7 }, maxRotation: 45, minRotation: 45, color: colors.text }, grid: { display: false } }
            }
        }
    });
}

// ----- ANALYTICS: Semester Trend -----
// Demo trend: previous semester estimated a bit lower than current,
// just for illustration since there's no real semester history yet.
function initAnalyticsCharts() {
    const canvas = document.getElementById('semesterTrendChart');
    if (!canvas) return;

    if (semesterTrendChartInstance) semesterTrendChartInstance.destroy();

    const currentAtt = Math.round(getOverallAttendance() * 10) / 10;
    const currentCie = Math.round(getOverallCIE() * 10) / 10;

    semesterTrendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Sem I', 'Sem II (Now)'],
            datasets: [
                { label: 'Attendance %', data: [Math.max(currentAtt - 6.5, 0), currentAtt], borderColor: '#4f7df3', backgroundColor: 'rgba(79,125,243,0.12)', fill: true, tension: 0.35 },
                { label: 'CIE Avg (/25)', data: [Math.max(currentCie - 2.2, 0), currentCie], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', fill: true, tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { size: 10 } } } }
        }
    });
}

// ----- Called when the theme toggles, so chart text/grid recolor -----
function updateChartColors() {
    const colors = getChartColors();
    [attendanceChartInstance, cieChartInstance].forEach(chart => {
        if (!chart) return;
        chart.options.scales.y.ticks.color = colors.text;
        chart.options.scales.x.ticks.color = colors.text;
        chart.options.scales.y.grid.color = colors.grid;
        chart.update();
    });
}

window.initDashboardCharts = initDashboardCharts;
window.initAnalyticsCharts = initAnalyticsCharts;
window.updateChartColors = updateChartColors;

console.log('📈 charts.js loaded.');
