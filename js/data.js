// ============================================================
//  DATA.JS — Mock/demo data only.
//  Nothing here is fetched from or sent to any real system.
//  Student names below are fictional, used only for the
//  Social Hub (search / leaderboard) demo.
// ============================================================

// ----- SUBJECTS (matches what's hardcoded in the dashboard HTML) -----
const subjectsData = [
    { code: '1BMATS201', name: 'Applied Mathematics-II', faculty: 'Mrs. Gangamma G', attendance: 84, cie: [25, 10, 15] },
    { code: '1BCHES202', name: 'Applied Chemistry', faculty: 'Dr. N M Kottureshwara', attendance: 90, cie: [24, 23, 22] },
    { code: '1BAIA203', name: 'Introduction to AI', faculty: 'Dr. Puneeth GJ', attendance: 88, cie: [23, 25, 24] },
    { code: '1BESC204B', name: 'Intro to Electrical Engg', faculty: 'Mrs. Meenakshi', attendance: 85, cie: [20, 22, 21] },
    { code: '1BPLC205B', name: 'Python Programming', faculty: 'Dr. Pampapathi BM', attendance: 82, cie: [22, 24, 23] },
    { code: '1BENG206', name: 'Communication Skills', faculty: 'Mr. Rajishekar D', attendance: 83, cie: [21, 23, 22] },
    { code: '1BICO207', name: 'Indian Constitution & Ethics', faculty: 'Mr. Manohar P', attendance: 78, cie: [18, 20, 19] },
    { code: '1BPRJ258', name: 'Interdisciplinary Project', faculty: 'Dr. Puneeth GJ', attendance: 92, cie: [24, 25, 25] }
];

// ----- FACULTY (matches the Faculty page) -----
const facultyData = [
    { name: 'Mrs. Gangamma G', subject: 'Applied Mathematics-II', dept: 'Mathematics', photo: '👩‍🏫' },
    { name: 'Dr. N M Kottureshwara', subject: 'Applied Chemistry', dept: 'Chemistry', photo: '👨‍🏫' },
    { name: 'Dr. Puneeth GJ', subject: 'Introduction to AI', dept: 'CSE', photo: '👨‍🏫' },
    { name: 'Mrs. Meenakshi', subject: 'Intro to Electrical Engg', dept: 'EEE', photo: '👩‍🏫' },
    { name: 'Dr. Pampapathi BM', subject: 'Python Programming', dept: 'CSE', photo: '👨‍🏫' },
    { name: 'Mr. Rajishekar D', subject: 'Communication Skills', dept: 'English', photo: '👨‍🏫' },
    { name: 'Mr. Manohar P', subject: 'Indian Constitution & Ethics', dept: 'Social Science', photo: '👨‍🏫' }
];

// ----- FICTIONAL CLASSMATES (Social Hub — search & leaderboard) -----
const classmatesData = [
    { name: 'Ananya Rao', usn: '3VC25CS101', branch: 'CSE A', attendance: 88 },
    { name: 'Rohan Kulkarni', usn: '3VC25CS103', branch: 'CSE A', attendance: 85 },
    { name: 'Sneha Iyer', usn: '3VC25CS104', branch: 'CSE A', attendance: 82 },
    { name: 'Kiran Patel', usn: '3VC25CS105', branch: 'CSE B', attendance: 79 },
    { name: 'Anjali Rao', usn: '3VC25CS106', branch: 'CSE B', attendance: 91 },
    { name: 'Vikram Naidu', usn: '3VC25CS108', branch: 'CSE B', attendance: 74 },
    { name: 'Meera Reddy', usn: '3VC25CS109', branch: 'ECE', attendance: 86 },
    { name: 'Deepika Joshi', usn: '3VC25EC101', branch: 'ECE', attendance: 83 },
    { name: 'Nikhil Sharma', usn: '3VC25ME101', branch: 'ME', attendance: 77 }
];

// ----- STUDY GROUPS -----
const groupsData = [
    { name: 'AI Study Circle', subject: 'Introduction to AI', members: 24, icon: '🤖', colorClass: 'group-icon-blue', joined: true },
    { name: 'Python Coders Club', subject: 'Python Programming', members: 31, icon: '🐍', colorClass: 'group-icon-green', joined: false },
    { name: 'Maths Doubt Solvers', subject: 'Applied Mathematics', members: 18, icon: '📐', colorClass: 'group-icon-amber', joined: true },
    { name: 'Chem Lab Prep Squad', subject: 'Applied Chemistry', members: 15, icon: '🧪', colorClass: 'group-icon-violet', joined: false }
];

// ----- EXAM DATES (used by Notifications + Countdown tool) -----
const examDates = [
    { name: 'CIE-1', date: '2026-09-15' },
    { name: 'CIE-2', date: '2026-10-05' },
    { name: 'CIE-3', date: '2026-11-02' },
    { name: 'Practical Exam', date: '2026-11-20' },
    { name: 'Theory Exam', date: '2026-11-28' }
];

// ----- GRADE POINTS (GPA calculator) -----
const gradePoints = {
    'S (10)': 10, 'A (9)': 9, 'B (8)': 8, 'C (7)': 7, 'D (6)': 6, 'E (5)': 5
};

// ============================================================
//  HELPER FUNCTIONS (pure calculations — no DOM, no storage)
// ============================================================

function getStatus(att) {
    if (att >= 85) return 'good';
    if (att >= 70) return 'warning';
    return 'danger';
}

function getAvgCIE(sub) {
    return (sub.cie[0] + sub.cie[1] + sub.cie[2]) / 3;
}

function getBestTwo(sub) {
    const sorted = [...sub.cie].sort((a, b) => b - a);
    return sorted[0] + sorted[1];
}

function getOverallAttendance() {
    const total = subjectsData.reduce((sum, s) => sum + s.attendance, 0);
    return total / subjectsData.length;
}

function getOverallCIE() {
    const total = subjectsData.reduce((sum, s) => sum + getAvgCIE(s), 0);
    return total / subjectsData.length;
}

function getBelow85() {
    return subjectsData.filter(s => s.attendance < 85);
}

function getSubjectRanking() {
    return [...subjectsData].sort((a, b) => b.attendance - a.attendance);
}

function getFacultyList() {
    return [...new Set(subjectsData.map(s => s.faculty))];
}

// ============================================================
//  EXPOSE GLOBALLY (so charts.js and app.js can use these)
// ============================================================

window.subjectsData = subjectsData;
window.facultyData = facultyData;
window.classmatesData = classmatesData;
window.groupsData = groupsData;
window.examDates = examDates;
window.gradePoints = gradePoints;

window.getStatus = getStatus;
window.getAvgCIE = getAvgCIE;
window.getBestTwo = getBestTwo;
window.getOverallAttendance = getOverallAttendance;
window.getOverallCIE = getOverallCIE;
window.getBelow85 = getBelow85;
window.getSubjectRanking = getSubjectRanking;
window.getFacultyList = getFacultyList;

console.log('📊 data.js loaded — demo data ready.');
