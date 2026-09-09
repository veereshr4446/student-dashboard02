// ============================================================
//  APP.JS — All interactive behavior for the demo dashboard.
// ============================================================

const LS_PREFIX = 'demoDash_';
function lsGet(key, fallback) {
    try { const v = localStorage.getItem(LS_PREFIX + key); return v !== null ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
}
function lsSet(key, val) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch (e) { /* ignore */ }
}

// ============================================================
//  LOGIN / LOGOUT
// ============================================================
function handleLogin() {
    document.getElementById('loginOverlay').classList.add('hidden');
    showToast('👋 Welcome to your dashboard!');
}

function handleLogout() {
    document.getElementById('loginOverlay').classList.remove('hidden');
    showToast('👋 Logged out!');
}

// ============================================================
//  SIDEBAR
// ============================================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
    document.body.style.overflow = document.getElementById('sidebar').classList.contains('open') ? 'hidden' : '';
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================
//  PAGE NAVIGATION
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar-nav li a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.bottom-nav button[data-page]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    initProgressBars();

    // Lazy-init charts the first time their page is shown
    if (pageId === 'dashboard') setTimeout(initDashboardCharts, 100);
    if (pageId === 'analytics') setTimeout(initAnalyticsCharts, 100);
    if (pageId === 'social') renderClassmates();
    if (pageId === 'planner') updatePlannerProgress();
    if (pageId === 'attendance') {
        setTimeout(() => { const el = document.getElementById('attendanceUSN'); if (el) el.focus(); }, 300);
    }
}

function scrollToSection(id) {
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// ============================================================
//  THEME
// ============================================================
function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('themeIcon').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    lsSet('theme', newTheme);
    updateChartColors();
    showToast('🌓 Theme toggled!');
}
function loadTheme() {
    const saved = lsGet('theme', 'light');
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeIcon').className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ============================================================
//  HEADER SEARCH (students)
// ============================================================
function toggleSearch() {
    const bar = document.getElementById('searchBar');
    const isOpen = bar.classList.contains('open');
    bar.classList.toggle('open', !isOpen);
    if (!isOpen) {
        setTimeout(() => document.getElementById('searchInput').focus(), 100);
        performHeaderSearch('');
    }
}
function closeSearch() {
    document.getElementById('searchBar').classList.remove('open');
    document.getElementById('searchInput').value = '';
}
function performHeaderSearch(query) {
    const results = document.getElementById('searchResults');
    query = (query || '').toLowerCase().trim();
    const starred = lsGet('starredUsns', []);
    const list = !query ? classmatesData : classmatesData.filter(s =>
        s.name.toLowerCase().includes(query) || s.usn.toLowerCase().includes(query) || s.branch.toLowerCase().includes(query)
    );
    if (list.length === 0) {
        results.innerHTML = `<div style="padding:14px; text-align:center; color:var(--text-secondary);">No students found</div>`;
        return;
    }
    results.innerHTML = list.map(s => {
        const isStar = starred.includes(s.usn);
        return `<div class="search-item">
            <div><strong>${s.name}</strong> <span style="font-size:11px; color:var(--text-secondary);">${s.usn} · ${s.branch}</span></div>
            <button class="star-btn ${isStar ? 'active' : ''}" onclick="toggleStarFriend('${s.usn}')">${isStar ? '⭐' : '☆'}</button>
        </div>`;
    }).join('');
}
function toggleStarFriend(usn) {
    let starred = lsGet('starredUsns', []);
    starred = starred.includes(usn) ? starred.filter(u => u !== usn) : [...starred, usn];
    lsSet('starredUsns', starred);
    performHeaderSearch(document.getElementById('searchInput').value);
    renderClassmates();
}

// ============================================================
//  SOCIAL HUB — classmate list (separate from header search)
// ============================================================
function renderClassmates() {
    const container = document.getElementById('classmateList');
    if (!container) return;
    const input = document.getElementById('socialSearchInput');
    const query = (input ? input.value : '').toLowerCase().trim();
    const starred = lsGet('starredUsns', []);
    const list = !query ? classmatesData : classmatesData.filter(s =>
        s.name.toLowerCase().includes(query) || s.usn.toLowerCase().includes(query) || s.branch.toLowerCase().includes(query)
    );
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-secondary);">No matches.</div>`;
        return;
    }
    container.innerHTML = list.map(s => {
        const isStar = starred.includes(s.usn);
        return `<div class="search-item">
            <div><strong>${s.name}</strong> <span style="font-size:11px; color:var(--text-secondary);">${s.usn} · ${s.branch} · ${s.attendance}%</span></div>
            <button class="star-btn ${isStar ? 'active' : ''}" onclick="toggleStarFriend('${s.usn}'); renderClassmates();">${isStar ? '⭐' : '☆'}</button>
        </div>`;
    }).join('');
}

// ============================================================
//  TOAST
// ============================================================
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
//  GENERIC DETAIL MODAL
// ============================================================
function openModal(title, subtitle, contentHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSubtitle').textContent = subtitle;
    document.getElementById('modalContent').innerHTML = contentHtml;
    document.getElementById('detailModal').classList.add('active');
}
function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ----- Stat card click handlers -----
function showAllSubjects() {
    const html = subjectsData.map((s, i) => `<div class="modal-item"><span>${i + 1}. ${s.code}</span><span>${s.name}</span></div>`).join('');
    openModal('📚 All Subjects', `Total: ${subjectsData.length} subjects`, html);
}
function showAttendanceDetails() {
    const html = subjectsData.map(s => {
        const status = getStatus(s.attendance);
        const emoji = status === 'good' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        return `<div class="modal-item"><span>${emoji} ${s.code}</span><span class="attendance ${status}">${s.attendance}%</span></div>`;
    }).join('');
    openModal('📊 Attendance Details', `Overall: ${getOverallAttendance().toFixed(1)}%`, html);
}
function showCIEDetails() {
    const html = subjectsData.map(s => `<div class="modal-item"><span>${s.code}</span><span>CIE: ${s.cie.join(' / ')} · Best 2: ${getBestTwo(s)}/50</span></div>`).join('');
    openModal('📝 CIE Marks', 'Best 2 of 3 exams are considered', html);
}
function showBelow85() {
    const below = getBelow85();
    if (below.length === 0) {
        openModal('🎉 Great Job!', 'All subjects above 85%', '<p style="text-align:center; padding:20px;">Keep it up! 💪</p>');
        return;
    }
    const html = below.map(s => `<div class="modal-item"><span>${s.code}</span><span class="attendance danger">${s.attendance}%</span></div>`).join('');
    openModal('⚠️ Below 85%', `${below.length} subject(s) need attention`, html);
}
function showCollegeEvents() {
    openModal('📅 College Events', 'Coming soon', `
        <div style="text-align:center; padding:20px;">
            <div style="font-size:48px; margin-bottom:12px;">🚀</div>
            <p style="color:var(--text-secondary);">Workshops, competitions, and guest lectures will show up here once added.</p>
        </div>`);
}

// ============================================================
//  FACULTY RATINGS
// ============================================================
let currentHomeFaculty = '';
let homeRatingStar = 0;
let currentDetailFaculty = '';
let detailRatingStar = 0;

function getRatings() { return lsGet('facultyRatings', {}); }
function saveRatings(r) { lsSet('facultyRatings', r); }

function openRatingModal(facultyName) {
    currentHomeFaculty = facultyName;
    homeRatingStar = getRatings()[facultyName] || 0;
    document.getElementById('homeModalFacultyName').textContent = facultyName;
    paintStars('starContainer', homeRatingStar);
    document.getElementById('ratingModal').classList.add('active');
}
function closeRatingModal() { document.getElementById('ratingModal').classList.remove('active'); }
function submitRating() {
    if (homeRatingStar === 0) { showToast('⚠️ Please select a rating'); return; }
    const ratings = getRatings();
    ratings[currentHomeFaculty] = homeRatingStar;
    saveRatings(ratings);
    closeRatingModal();
    showToast(`⭐ Rated ${currentHomeFaculty} with ${homeRatingStar} stars!`);
}

function openFacultyDetail(facultyName) {
    const faculty = facultyData.find(f => f.name === facultyName);
    if (!faculty) return;
    currentDetailFaculty = facultyName;
    detailRatingStar = getRatings()[facultyName] || 0;
    document.getElementById('modalFacultyName').textContent = facultyName;
    document.getElementById('modalFacultySubject').textContent = faculty.subject;
    document.getElementById('modalFacultyDept').textContent = faculty.dept;
    document.getElementById('modalFacultyPhoto').textContent = faculty.photo;
    paintStars('starContainer2', detailRatingStar);
    document.getElementById('facultyDetailModal').classList.add('active');
}
function closeFacultyDetail() { document.getElementById('facultyDetailModal').classList.remove('active'); }
function submitFacultyRating() {
    if (detailRatingStar === 0) { showToast('⚠️ Please select a rating'); return; }
    const ratings = getRatings();
    ratings[currentDetailFaculty] = detailRatingStar;
    saveRatings(ratings);
    closeFacultyDetail();
    showToast(`⭐ Rated ${currentDetailFaculty} with ${detailRatingStar} stars!`);
}

function paintStars(containerId, value) {
    document.querySelectorAll('#' + containerId + ' .star').forEach(s => {
        const val = parseInt(s.dataset.value);
        s.classList.toggle('active', val <= value);
        s.textContent = val <= value ? '⭐' : '☆';
    });
}

document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('star')) return;
    const container = e.target.closest('.stars');
    if (!container) return;
    const value = parseInt(e.target.dataset.value);
    paintStars(container.id, value);
    if (container.id === 'starContainer') homeRatingStar = value;
    else if (container.id === 'starContainer2') detailRatingStar = value;
});

// ============================================================
//  ABOUT DEVELOPER MODAL
// ============================================================
function showAboutDeveloper() {
    document.getElementById('aboutModal').classList.add('active');
}
function closeAboutModal() {
    document.getElementById('aboutModal').classList.remove('active');
}

// ============================================================
//  TIMETABLE
// ============================================================
function showTimetable(branch, btn) {
    document.querySelectorAll('.timetable-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('timetableContainer').innerHTML = `
        <div class="placeholder-text">
            <i class="fas fa-image"></i>
            <p>📸 Timetable for <strong>${branch.toUpperCase()}</strong></p>
            <p class="sub">Add ${branch}_timetable.jpg to /images/</p>
        </div>`;
}

// ============================================================
//  ATTENDANCE / CONNECT PAGE (demo only — no real network call)
// ============================================================
function fetchAttendance() {
    const usn = document.getElementById('attendanceUSN').value.trim();
    const dob = document.getElementById('attendanceDOB').value.trim();
    const statusEl = document.getElementById('attendanceStatus');
    if (!usn || !dob) {
        statusEl.textContent = '⚠️ Please fill in both fields';
        statusEl.style.color = 'var(--danger-color)';
        return;
    }
    statusEl.textContent = '🔄 Connecting...';
    statusEl.style.color = 'var(--text-secondary)';
    setTimeout(() => {
        statusEl.textContent = '✅ Demo: data fetched successfully!';
        statusEl.style.color = 'var(--success-color)';
        showToast('📊 Demo data loaded.');
        setTimeout(() => showPage('dashboard'), 1200);
    }, 1200);
}

// ============================================================
//  GOAL SETTING
// ============================================================
function setGoal(subjectCode, target) {
    lsSet('goal_' + subjectCode, target);
    showToast(`🎯 Goal set for ${subjectCode}: ${target}%`);
}

// ============================================================
//  PROFILE
// ============================================================
function editProfile() {
    const current = document.querySelector('.profile-bio')?.textContent || '';
    const updated = prompt('Update your bio:', current);
    if (updated !== null && document.querySelector('.profile-bio')) {
        document.querySelector('.profile-bio').textContent = updated;
        showToast('✅ Profile updated');
    }
}

// ============================================================
//  TABS (Social Hub) / TOOL TABS (Academic Tools)
// ============================================================
function switchTab(panelId, btn) {
    const parent = btn.closest('.page-section');
    parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    btn.classList.add('active');
}
function switchTool(panelId, btn) { switchTab(panelId, btn); }

// ============================================================
//  STUDY GROUPS
// ============================================================
function toggleGroup(btn) {
    const joined = btn.classList.contains('btn-secondary');
    btn.classList.toggle('btn-secondary', !joined);
    btn.classList.toggle('btn-primary', joined);
    btn.textContent = joined ? 'Join' : '✓ Joined';
    showToast(joined ? '👋 Left the group' : '🎉 Joined the group!');
}

// ============================================================
//  PLANNER / TASKS
// ============================================================
function addTask() {
    const title = document.getElementById('taskTitleInput').value.trim();
    if (!title) { showToast('⚠️ Enter a task title first'); return; }
    const subject = document.getElementById('taskSubjectInput').value;
    const priority = document.getElementById('taskPriorityInput').value;
    const date = document.getElementById('taskDateInput').value || 'No date';

    const list = document.getElementById('taskList');
    const priorityClass = priority.toLowerCase();
    const item = document.createElement('div');
    item.className = 'task-item';
    item.dataset.done = 'false';
    item.innerHTML = `
        <div class="task-check" onclick="toggleTask(this)"></div>
        <div class="task-body">
            <div class="task-title">${title}</div>
            <div class="task-meta"><span class="task-pill ${priorityClass}">${priority.toUpperCase()}</span><span>${subject}</span><span>${date}</span></div>
        </div>
        <button class="task-del" onclick="deleteTask(this)"><i class="fas fa-trash"></i></button>`;
    list.prepend(item);

    document.getElementById('taskTitleInput').value = '';
    updatePlannerProgress();
    showToast('✅ Task added');
}
function toggleTask(checkEl) {
    const item = checkEl.closest('.task-item');
    const done = item.dataset.done === 'true';
    item.dataset.done = (!done).toString();
    checkEl.classList.toggle('done', !done);
    checkEl.textContent = !done ? '✓' : '';
    item.querySelector('.task-title').classList.toggle('done', !done);
    updatePlannerProgress();
}
function deleteTask(btnEl) {
    btnEl.closest('.task-item').remove();
    updatePlannerProgress();
    showToast('🗑️ Task removed');
}
function setTaskFilter(filter, btn) {
    document.querySelectorAll('#page-planner .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#taskList .task-item').forEach(item => {
        const done = item.dataset.done === 'true';
        const show = filter === 'all' || (filter === 'done' && done) || (filter === 'pending' && !done);
        item.style.display = show ? 'flex' : 'none';
    });
}
function updatePlannerProgress() {
    const items = document.querySelectorAll('#taskList .task-item');
    const total = items.length;
    const done = document.querySelectorAll('#taskList .task-item[data-done="true"]').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const fill = document.getElementById('plannerProgressFill');
    if (fill) fill.style.width = pct + '%';
    const label = document.getElementById('taskProgressLabel');
    if (label) label.textContent = `${done} / ${total} done`;
}

// ============================================================
//  ACADEMIC TOOLS — GPA CALCULATOR
// ============================================================
function addGpaRow() {
    const wrap = document.getElementById('gpaRows');
    const row = document.createElement('div');
    row.className = 'gpa-row';
    const options = Object.keys(gradePoints).map(g => `<option>${g}</option>`).join('');
    row.innerHTML = `
        <input type="text" placeholder="Subject">
        <input type="number" value="4" min="1" max="6">
        <select>${options}</select>
        <button class="gpa-del" onclick="removeGpaRow(this)"><i class="fas fa-times"></i></button>`;
    wrap.appendChild(row);
    calcGpa();
}
function removeGpaRow(btn) {
    btn.closest('.gpa-row').remove();
    calcGpa();
}
function calcGpa() {
    const rows = document.querySelectorAll('#gpaRows .gpa-row');
    let totalCredits = 0, totalPoints = 0;
    rows.forEach(row => {
        const credit = parseFloat(row.querySelectorAll('input')[1]?.value) || 0;
        const grade = row.querySelector('select')?.value;
        const gp = gradePoints[grade] || 0;
        totalCredits += credit;
        totalPoints += credit * gp;
    });
    const sgpa = totalCredits ? (totalPoints / totalCredits).toFixed(2) : '--';
    const resultEl = document.getElementById('gpaResult');
    if (resultEl) resultEl.textContent = sgpa;
}
document.addEventListener('input', function (e) {
    if (e.target.closest('#gpaRows')) calcGpa();
});
document.addEventListener('change', function (e) {
    if (e.target.closest('#gpaRows')) calcGpa();
});

// ============================================================
//  ACADEMIC TOOLS — ATTENDANCE WHAT-IF
// ============================================================
function calcWhatIf() {
    const conducted = parseFloat(document.getElementById('wiConducted').value) || 0;
    const attended = parseFloat(document.getElementById('wiAttended').value) || 0;
    const target = parseFloat(document.getElementById('wiTarget').value) || 85;
    const future = parseFloat(document.getElementById('wiFuture').value) || 0;

    const totalFuture = conducted + future;
    const needed = Math.ceil((target / 100) * totalFuture - attended);
    const box = document.getElementById('whatifResultBox');
    const currentPct = conducted ? (attended / conducted * 100).toFixed(1) : '0.0';

    if (needed <= 0) {
        const bunkable = Math.max(Math.floor(attended - (target / 100) * totalFuture), 0);
        box.innerHTML = `<div class="result-number">${bunkable}</div><div class="result-label">You can skip up to ${bunkable} of the next ${future} classes and stay at ${target}%+ (currently ${currentPct}%)</div>`;
    } else if (needed > future) {
        box.innerHTML = `<div class="result-number">⚠️</div><div class="result-label">Even attending all ${future} remaining classes won't reach ${target}% this term (currently ${currentPct}%)</div>`;
    } else {
        box.innerHTML = `<div class="result-number">${needed}</div><div class="result-label">Attend at least ${needed} of the next ${future} classes to reach ${target}% (currently ${currentPct}%)</div>`;
    }
}

// ============================================================
//  ACADEMIC TOOLS — EXAM COUNTDOWN
// ============================================================
let countdownTargetDate = examDates[0].date;
let countdownInterval = null;

function setCountdownExam(name, dateStr, btn) {
    document.querySelectorAll('#toolExam .timetable-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    countdownTargetDate = dateStr;
    document.getElementById('countdownCaption').textContent = `⏳ Countdown to ${name}`;
    updateCountdown();
}
function updateCountdown() {
    const target = new Date(countdownTargetDate).getTime();
    const now = Date.now();
    let diff = Math.max(target - now, 0);
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000); diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, '0'); };
    set('cdDays', d); set('cdHours', h); set('cdMins', m); set('cdSecs', s);
}

// ============================================================
//  SETTINGS
// ============================================================
function setDefaultGoal(goal) {
    lsSet('defaultGoal', goal);
    showToast(`🎯 Default goal set to ${goal}%`);
}
function toggleNotifications() {
    const btn = document.getElementById('notifToggleBtn');
    const enabled = btn.textContent.trim() === 'Disable';
    btn.textContent = enabled ? 'Enable' : 'Disable';
    lsSet('notificationsEnabled', !enabled);
    showToast(`🔔 Notifications ${!enabled ? 'enabled' : 'disabled'}`);
}
function refreshData() {
    showToast('🔄 Refreshing...');
    setTimeout(() => showToast('✅ Data refreshed! (demo)'), 800);
}
function exportPDF() {
    showToast('📄 Generating report...');

    const name = 'Viresh Ranjanagi';
    const usn = '3VC25CS107';
    const branch = 'Computer Science & Engineering';
    const semester = 'II (2nd Semester)';
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const overallAtt = getOverallAttendance().toFixed(1);
    const avgCIE = getOverallCIE().toFixed(1);
    const below85 = getBelow85().length;
    const above85 = subjectsData.filter(s => s.attendance >= 85).length;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Academic Report - ${usn}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; color: #1a2332; }
            .header { text-align: center; border-bottom: 3px solid #4f7df3; padding-bottom: 20px; margin-bottom: 30px; }
            .header .title { font-size: 32px; font-weight: 800; letter-spacing: 1px; }
            .header .title span { color: #4f7df3; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 700; border-bottom: 2px solid #eaedf2; padding-bottom: 8px; margin-bottom: 16px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f5f7fa; padding: 16px 20px; border-radius: 12px; }
            .info-item { font-size: 14px; }
            .info-item .label { font-weight: 600; }
            .info-item .value { color: #4f7df3; font-weight: 600; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
            .stat-box { background: #f5f7fa; padding: 14px; border-radius: 10px; text-align: center; }
            .stat-box .number { font-size: 24px; font-weight: 800; }
            .stat-box .label { font-size: 12px; color: #6b7a8f; margin-top: 2px; }
            .stat-box.good .number { color: #10b981; }
            .stat-box.danger .number { color: #ef4444; }
            .stat-box.accent .number { color: #4f7df3; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            table th { background: #4f7df3; color: #fff; padding: 10px 12px; text-align: left; }
            table td { padding: 8px 12px; border-bottom: 1px solid #eaedf2; }
            table .att-good { color: #10b981; font-weight: 700; }
            table .att-warning { color: #f59e0b; font-weight: 700; }
            table .att-danger { color: #ef4444; font-weight: 700; }
            .footer { text-align: center; border-top: 2px solid #eaedf2; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b7a8f; }
            .footer .brand { color: #4f7df3; font-weight: 600; }
            @media print { body { padding: 20px; } }
        </style>
    </head>
    <body>
        <div class="header"><div class="title">📊 <span>Academic</span> Report</div></div>

        <div class="section">
            <div class="section-title">👤 Student Information</div>
            <div class="info-grid">
                <div class="info-item"><span class="label">Name:</span> <span class="value">${name}</span></div>
                <div class="info-item"><span class="label">USN:</span> <span class="value">${usn}</span></div>
                <div class="info-item"><span class="label">Branch:</span> <span class="value">${branch}</span></div>
                <div class="info-item"><span class="label">Semester:</span> <span class="value">${semester}</span></div>
                <div class="info-item"><span class="label">Report Date:</span> <span class="value">${date}</span></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📊 Performance Summary</div>
            <div class="stats-grid">
                <div class="stat-box accent"><div class="number">${overallAtt}%</div><div class="label">Overall Attendance</div></div>
                <div class="stat-box accent"><div class="number">${avgCIE}/25</div><div class="label">Avg CIE Marks</div></div>
                <div class="stat-box ${below85 > 0 ? 'danger' : 'good'}"><div class="number">${below85}</div><div class="label">Subjects Below 85%</div></div>
                <div class="stat-box good"><div class="number">${above85}</div><div class="label">Subjects Above 85%</div></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📚 Subject-Wise Report</div>
            <table>
                <thead><tr><th>#</th><th>Subject Code</th><th>Subject Name</th><th>Attendance</th><th>CIE (Best 2)</th></tr></thead>
                <tbody>
                    ${subjectsData.map((sub, i) => {
                        const status = getStatus(sub.attendance);
                        const cls = status === 'good' ? 'att-good' : status === 'warning' ? 'att-warning' : 'att-danger';
                        return `<tr><td>${i + 1}</td><td>${sub.code}</td><td>${sub.name}</td><td class="${cls}">${sub.attendance}%</td><td>${getBestTwo(sub)}/50</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">📝 CIE Marks Breakdown</div>
            <table>
                <thead><tr><th>Subject</th><th>CIE-1</th><th>CIE-2</th><th>CIE-3</th><th>Best 2</th></tr></thead>
                <tbody>
                    ${subjectsData.map(sub => `<tr><td>${sub.code}</td><td>${sub.cie[0]}/25</td><td>${sub.cie[1]}/25</td><td>${sub.cie[2]}/25</td><td><strong>${getBestTwo(sub)}/50</strong></td></tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">📌 Important Dates</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#f5f7fa; padding:16px 20px; border-radius:12px; font-size:14px;">
                <div>📝 CIE-1: 15-09-2026</div>
                <div>📝 CIE-2: 05-10-2026</div>
                <div>📝 CIE-3: 02-11-2026</div>
                <div>🔬 Practical Exam: 20-11-2026</div>
                <div>📖 Theory Exam: 28-11-2026</div>
                <div>🚀 85% attendance needed for eligibility</div>
            </div>
        </div>

        <div class="footer">
            <p>✨ Generated by <span class="brand">Student Dashboard</span></p>
            <p style="margin-top:4px;">© 2026 · Demo report · Built with ❤️ by Viresh</p>
        </div>
    </body>
    </html>`;

    const win = window.open('', '_blank');
    if (!win) {
        showToast('⚠️ Please allow popups to export the report');
        return;
    }
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); showToast('📄 Report ready!'); }, 400);
}

// ============================================================
//  POMODORO TIMER (own page, fully functional)
// ============================================================
const POMO_DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const POMO_CIRCUMFERENCE = 597;

let pomoState = {
    mode: 'focus', secondsLeft: 25 * 60, totalSeconds: 25 * 60,
    isRunning: false, isPaused: false, timerId: null,
    sessions: [], sessionsToday: 0, totalFocusMinutes: 0, streak: 0, lastDate: null
};

function pomoLoadState() {
    const saved = lsGet('pomodoroState', null);
    if (saved) pomoState = { ...pomoState, ...saved, timerId: null, isRunning: false };
}
function pomoSaveState() {
    const toSave = { ...pomoState };
    delete toSave.timerId;
    lsSet('pomodoroState', toSave);
}
function pomoSyncModeButtons() {
    document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === pomoState.mode));
}
function pomoSetMode(mode) {
    if (pomoState.isRunning) {
        if (!confirm('Timer is running. Reset and switch mode?')) return;
        pomoStop();
    }
    pomoState.mode = mode;
    pomoState.secondsLeft = POMO_DURATIONS[mode];
    pomoState.totalSeconds = POMO_DURATIONS[mode];
    pomoSyncModeButtons();
    pomoUpdateUI();
    pomoSaveState();
}
function pomoToggle() { pomoState.isRunning ? pomoPause() : pomoStart(); }
function pomoStart() {
    if (pomoState.secondsLeft <= 0) { pomoReset(); return; }
    pomoState.isRunning = true;
    pomoState.isPaused = false;
    document.getElementById('pomoStartBtn').innerHTML = '<i class="fas fa-pause"></i>';
    pomoState.timerId = setInterval(pomoTick, 1000);
    pomoUpdateUI();
}
function pomoPause() {
    pomoState.isRunning = false;
    pomoState.isPaused = true;
    clearInterval(pomoState.timerId);
    document.getElementById('pomoStartBtn').innerHTML = '<i class="fas fa-play"></i>';
    pomoUpdateUI();
}
function pomoStop() {
    pomoState.isRunning = false;
    pomoState.isPaused = false;
    clearInterval(pomoState.timerId);
    const btn = document.getElementById('pomoStartBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
}
function pomoReset() {
    pomoStop();
    pomoState.secondsLeft = POMO_DURATIONS[pomoState.mode];
    pomoState.totalSeconds = POMO_DURATIONS[pomoState.mode];
    pomoUpdateUI();
    pomoSaveState();
}
function pomoSkip() { pomoState.isRunning ? pomoCompleteSession() : pomoReset(); }
function pomoTick() {
    pomoState.secondsLeft--;
    pomoUpdateUI();
    if (pomoState.secondsLeft <= 0) pomoCompleteSession();
}
function pomoCompleteSession() {
    pomoStop();
    const modeLabel = pomoState.mode === 'focus' ? 'Focus' : pomoState.mode === 'short' ? 'Short Break' : 'Long Break';
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    pomoState.sessions.unshift({ type: pomoState.mode, label: modeLabel, time: timeStr, duration: POMO_DURATIONS[pomoState.mode] / 60 });
    if (pomoState.sessions.length > 50) pomoState.sessions.pop();

    if (pomoState.mode === 'focus') {
        pomoState.sessionsToday++;
        pomoState.totalFocusMinutes += POMO_DURATIONS.focus / 60;
        pomoUpdateStreak();
    }

    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = 'sine'; gain.gain.value = 0.15;
        osc.start(); setTimeout(() => osc.stop(), 300);
    } catch (e) { /* ignore */ }

    pomoState.mode = pomoState.mode === 'focus' ? 'short' : 'focus';
    pomoSyncModeButtons();
    pomoState.secondsLeft = POMO_DURATIONS[pomoState.mode];
    pomoState.totalSeconds = POMO_DURATIONS[pomoState.mode];

    pomoUpdateUI();
    pomoUpdateStats();
    pomoRenderHistory();
    pomoSaveState();

    showToast(pomoState.mode === 'short' ? '🎯 Focus session complete! Starting short break.' : '☕ Break over! Ready to focus again?');
}
function pomoUpdateStreak() {
    const today = new Date().toDateString();
    if (!pomoState.lastDate) pomoState.streak = 1;
    else if (pomoState.lastDate !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        pomoState.streak = (pomoState.lastDate === yesterday.toDateString()) ? pomoState.streak + 1 : 1;
    }
    pomoState.lastDate = today;
}
function pomoUpdateUI() {
    const timeEl = document.getElementById('pomoTimeDisplay');
    if (!timeEl) return;
    const mins = Math.floor(pomoState.secondsLeft / 60), secs = pomoState.secondsLeft % 60;
    timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const progress = 1 - (pomoState.secondsLeft / pomoState.totalSeconds);
    document.getElementById('pomoProgress').style.strokeDashoffset = POMO_CIRCUMFERENCE * progress;

    const labels = { focus: '🎯 Focus Time', short: '☕ Short Break', long: '🛋️ Long Break' };
    document.getElementById('pomoStatusLabel').textContent = labels[pomoState.mode];

    const badge = document.getElementById('pomoStatusBadge');
    const badgeLabels = { focus: 'Focus', short: 'Break', long: 'Long Break' };
    badge.textContent = badgeLabels[pomoState.mode];
    badge.className = 'pomo-status-badge ' + (pomoState.mode === 'focus' ? 'focus' : 'break');
    if (pomoState.isPaused) { badge.textContent = '⏸️ Paused'; badge.className = 'pomo-status-badge paused'; }

    document.getElementById('pomoProgress').style.stroke = pomoState.mode === 'focus' ? '#4f7df3' : '#10b981';
}
function pomoUpdateStats() {
    document.getElementById('pomoSessionsToday').textContent = pomoState.sessionsToday || 0;
    document.getElementById('pomoTotalFocus').textContent = (pomoState.totalFocusMinutes || 0) + 'm';
    document.getElementById('pomoStreak').textContent = pomoState.streak || 0;
}
function pomoRenderHistory() {
    const el = document.getElementById('pomoSessionList');
    if (!el) return;
    if (!pomoState.sessions.length) {
        el.innerHTML = '<div class="pomo-empty-sessions">No sessions yet. Start your first focus session! 🚀</div>';
        return;
    }
    el.innerHTML = pomoState.sessions.slice(0, 15).map(s => {
        const cls = s.type === 'focus' ? 'focus' : 'break';
        const icon = s.type === 'focus' ? '🎯' : '☕';
        return `<div class="pomo-session-item"><span class="session-type ${cls}">${icon} ${s.label}</span><span class="session-time">${s.time} · ${s.duration}m</span></div>`;
    }).join('');
}
function pomoClearHistory() {
    if (!pomoState.sessions.length) return;
    if (confirm('Clear all session history?')) {
        pomoState.sessions = [];
        pomoRenderHistory();
        pomoSaveState();
        showToast('🗑️ History cleared');
    }
}
document.addEventListener('keydown', function (e) {
    const page = document.getElementById('page-pomodoro');
    if (!page || !page.classList.contains('active')) return;
    if (e.key === ' ' || e.key === 'Space') { e.preventDefault(); pomoToggle(); }
    if (e.key === 'r') pomoReset();
});

// ============================================================
//  PROGRESS BAR WIDTHS
// ============================================================
function initProgressBars() {
    document.querySelectorAll('[data-target]').forEach(el => {
        const target = el.getAttribute('data-target');
        if (target !== null) {
            // slight delay so the width transition animates in, matching
            // the fill/goal-fill CSS transition already defined
            requestAnimationFrame(() => { el.style.width = target + '%'; });
        }
    });
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    loadTheme();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', (e) => performHeaderSearch(e.target.value));

    initProgressBars();
    updatePlannerProgress();
    calcGpa();
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    pomoLoadState();
    pomoSyncModeButtons();
    pomoUpdateUI();
    pomoUpdateStats();
    pomoRenderHistory();

    setTimeout(initDashboardCharts, 200);

    ['aboutModal', 'ratingModal', 'facultyDetailModal', 'detailModal'].forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
    });

    console.log('🚀 Student Dashboard demo ready — all local, no network calls.');
});

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.showPage = showPage;
window.scrollToSection = scrollToSection;
window.toggleTheme = toggleTheme;
window.toggleSearch = toggleSearch;
window.closeSearch = closeSearch;
window.toggleStarFriend = toggleStarFriend;
window.renderClassmates = renderClassmates;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.showAllSubjects = showAllSubjects;
window.showAttendanceDetails = showAttendanceDetails;
window.showCIEDetails = showCIEDetails;
window.showBelow85 = showBelow85;
window.showCollegeEvents = showCollegeEvents;
window.openRatingModal = openRatingModal;
window.closeRatingModal = closeRatingModal;
window.submitRating = submitRating;
window.openFacultyDetail = openFacultyDetail;
window.closeFacultyDetail = closeFacultyDetail;
window.submitFacultyRating = submitFacultyRating;
window.showAboutDeveloper = showAboutDeveloper;
window.closeAboutModal = closeAboutModal;
window.showTimetable = showTimetable;
window.fetchAttendance = fetchAttendance;
window.setGoal = setGoal;
window.editProfile = editProfile;
window.switchTab = switchTab;
window.switchTool = switchTool;
window.toggleGroup = toggleGroup;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.setTaskFilter = setTaskFilter;
window.addGpaRow = addGpaRow;
window.removeGpaRow = removeGpaRow;
window.calcGpa = calcGpa;
window.calcWhatIf = calcWhatIf;
window.setCountdownExam = setCountdownExam;
window.setDefaultGoal = setDefaultGoal;
window.toggleNotifications = toggleNotifications;
window.refreshData = refreshData;
window.exportPDF = exportPDF;
window.pomoSetMode = pomoSetMode;
window.pomoToggle = pomoToggle;
window.pomoReset = pomoReset;
window.pomoSkip = pomoSkip;
window.pomoClearHistory = pomoClearHistory;
