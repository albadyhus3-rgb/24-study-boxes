// ============================= 
// Data Storage Manager
// ============================= 

class StorageManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        const existingData = localStorage.getItem('studyBoxesData');
        if (!existingData) {
            const initialData = {
                theme: 'light',
                days: {},
                todayDate: this.getTodayDate()
            };
            localStorage.setItem('studyBoxesData', JSON.stringify(initialData));
        }
    }

    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    getData() {
        const data = localStorage.getItem('studyBoxesData');
        return data ? JSON.parse(data) : { theme: 'light', days: {} };
    }

    saveData(data) {
        localStorage.setItem('studyBoxesData', JSON.stringify(data));
    }

    getTodayBoxes() {
        const data = this.getData();
        const today = this.getTodayDate();
        if (!data.days[today]) {
            data.days[today] = this.createEmptyDay();
            this.saveData(data);
        }
        return data.days[today];
    }

    createEmptyDay() {
        const boxes = {};
        for (let i = 0; i < 24; i++) {
            boxes[i] = {
                status: 'empty',
                activity: null,
                subject: '',
                notes: ''
            };
        }
        return boxes;
    }

    updateBox(boxIndex, status, activity, subject, notes) {
        const data = this.getData();
        const today = this.getTodayDate();
        if (!data.days[today]) {
            data.days[today] = this.createEmptyDay();
        }
        data.days[today][boxIndex] = { status, activity, subject, notes };
        this.saveData(data);
    }

    resetToday() {
        const data = this.getData();
        const today = this.getTodayDate();
        data.days[today] = this.createEmptyDay();
        this.saveData(data);
    }

    setTheme(theme) {
        const data = this.getData();
        data.theme = theme;
        this.saveData(data);
    }

    getTheme() {
        const data = this.getData();
        return data.theme || 'light';
    }

    getAllDays() {
        const data = this.getData();
        return data.days || {};
    }
}

// ============================= 
// Study Boxes Application
// ============================= 

class StudyBoxesApp {
    constructor() {
        this.storage = new StorageManager();
        this.currentBoxIndex = null;
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadTheme();
        this.updateDate();
        this.renderBoxes();
        this.updateStats();
    }

    setupEventListeners() {
        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Stats Button
        document.getElementById('statsBtn').addEventListener('click', () => this.openStatsModal());

        // Box Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeBoxModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeBoxModal());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveBoxData());

        // Action Buttons
        document.getElementById('completeBtn').addEventListener('click', () => this.openCompleteDayModal());
        document.getElementById('resetBtn').addEventListener('click', () => this.openConfirmModal());

        // Complete Day Modal
        document.getElementById('closeCompleteBtn').addEventListener('click', () => this.closeCompleteDayModal());

        // Confirm Modal
        document.getElementById('confirmCancel').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmOk').addEventListener('click', () => this.confirmReset());

        // Stats Modal
        document.getElementById('closeStatsModal').addEventListener('click', () => this.closeStatsModal());
        document.getElementById('closeStatsBtn').addEventListener('click', () => this.closeStatsModal());

        // Overlay
        document.getElementById('modalOverlay').addEventListener('click', () => this.closeAllModals());

        // Activity and Status Buttons in Modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-btn')) {
                document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
            if (e.target.classList.contains('activity-btn')) {
                document.querySelectorAll('.activity-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // ============================= 
    // Theme Management
    // ============================= 

    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark-mode');
        
        if (isDark) {
            html.classList.remove('dark-mode');
            this.storage.setTheme('light');
            document.getElementById('themeToggle').textContent = '🌙';
        } else {
            html.classList.add('dark-mode');
            this.storage.setTheme('dark');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }

    loadTheme() {
        const theme = this.storage.getTheme();
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️';
        } else {
            html.classList.remove('dark-mode');
            document.getElementById('themeToggle').textContent = '🌙';
        }
    }

    // ============================= 
    // Date Display
    // ============================= 

    updateDate() {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateStr = today.toLocaleDateString('ar-SA', options);
        document.getElementById('currentDate').textContent = dateStr;
    }

    getTimeForBox(boxIndex) {
        const start = boxIndex.toString().padStart(2, '0');
        const end = ((boxIndex + 1) % 24).toString().padStart(2, '0');
        return `${start}:00 - ${end}:00`;
    }

    // ============================= 
    // Boxes Rendering
    // ============================= 

    renderBoxes() {
        const grid = document.getElementById('boxesGrid');
        grid.innerHTML = '';
        const boxes = this.storage.getTodayBoxes();

        for (let i = 0; i < 24; i++) {
            const box = document.createElement('div');
            box.className = `box ${boxes[i].status}`;
            
            const emoji = this.getStatusEmoji(boxes[i].status);
            const timeStr = this.getTimeForBox(i);
            
            let content = `<div class="box-emoji">${emoji}</div>`;
            if (boxes[i].subject) {
                content += `<div class="box-subject">${boxes[i].subject}</div>`;
            }
            content += `<div class="box-time">${i}</div>`;
            
            box.innerHTML = content;
            box.addEventListener('click', () => this.openBoxModal(i));
            grid.appendChild(box);
        }
    }

    getStatusEmoji(status) {
        const emojis = {
            'empty': '⬜',
            'studied': '🟩',
            'reviewed': '🟦',
            'mcq': '🟪',
            'partial': '🟨'
        };
        return emojis[status] || '⬜';
    }

    // ============================= 
    // Box Modal Management
    // ============================= 

    openBoxModal(boxIndex) {
        this.currentBoxIndex = boxIndex;
        const boxes = this.storage.getTodayBoxes();
        const boxData = boxes[boxIndex];
        
        // Update modal title and time
        document.getElementById('boxTitle').textContent = `المربع رقم ${boxIndex + 1}`;
        document.getElementById('timeDisplay').textContent = this.getTimeForBox(boxIndex);
        
        // Clear previous selections
        document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.activity-btn').forEach(btn => btn.classList.remove('active'));
        
        // Set current values
        document.querySelectorAll('.status-btn').forEach(btn => {
            if (btn.dataset.status === boxData.status) {
                btn.classList.add('active');
            }
        });

        if (boxData.activity) {
            document.querySelectorAll('.activity-btn').forEach(btn => {
                if (btn.dataset.activity === boxData.activity) {
                    btn.classList.add('active');
                }
            });
        }

        document.getElementById('subjectInput').value = boxData.subject || '';
        document.getElementById('notesInput').value = boxData.notes || '';
        
        this.openModal('boxModal');
    }

    saveBoxData() {
        const status = document.querySelector('.status-btn.active')?.dataset.status || 'empty';
        const activity = document.querySelector('.activity-btn.active')?.dataset.activity || null;
        const subject = document.getElementById('subjectInput').value;
        const notes = document.getElementById('notesInput').value;
        
        this.storage.updateBox(this.currentBoxIndex, status, activity, subject, notes);
        this.closeBoxModal();
        this.renderBoxes();
        this.updateStats();
    }

    closeBoxModal() {
        this.closeModal('boxModal');
    }

    // ============================= 
    // Statistics Management
    // ============================= 

    calculateStats() {
        const boxes = this.storage.getTodayBoxes();
        let completed = 0;
        
        for (let i = 0; i < 24; i++) {
            if (boxes[i].status === 'studied') {
                completed++;
            }
        }
        
        const score = (completed / 24) * 100;
        return {
            completed,
            score: parseFloat(score.toFixed(2)),
            percentage: Math.round(score)
        };
    }

    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('scoreDisplay').textContent = stats.score;
        document.getElementById('percentageDisplay').textContent = stats.percentage;
        document.getElementById('progressText').textContent = `${stats.completed} / 24 ساعة`;
        
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${stats.percentage}%`;
    }

    // ============================= 
    // Complete Day Modal
    // ============================= 

    openCompleteDayModal() {
        const stats = this.calculateStats();
        
        document.getElementById('completeDayBoxes').textContent = stats.completed;
        document.getElementById('completeDayScore').textContent = stats.score;
        document.getElementById('completeDayHours').textContent = stats.completed;
        
        const progressFill = document.getElementById('completeDayProgressFill');
        progressFill.style.width = `${stats.percentage}%`;
        
        if (stats.completed === 24) {
            document.getElementById('completionMessage').textContent = '🎉 أكملت جميع مربعات اليوم! 🏆';
            document.getElementById('completionMessage').style.color = 'var(--success-color)';
        } else if (stats.completed >= 18) {
            document.getElementById('completionMessage').textContent = '💪 إنجاز رائع! استمر في المجهود';
        } else if (stats.completed >= 12) {
            document.getElementById('completionMessage').textContent = '⚡ تقدم جيد! استمر';
        } else {
            document.getElementById('completionMessage').textContent = '🔥 استمر!';
            document.getElementById('completionMessage').style.color = 'var(--warning-color)';
        }
        
        this.openModal('completeDayModal');
    }

    closeCompleteDayModal() {
        this.closeModal('completeDayModal');
    }

    // ============================= 
    // Confirmation Modal
    // ============================= 

    openConfirmModal() {
        document.getElementById('confirmMessage').textContent = 'هل أنت متأكد؟ سيتم مسح إنجازات اليوم فقط.';
        this.openModal('confirmModal');
    }

    closeConfirmModal() {
        this.closeModal('confirmModal');
    }

    confirmReset() {
        this.storage.resetToday();
        this.closeConfirmModal();
        this.renderBoxes();
        this.updateStats();
    }

    // ============================= 
    // Statistics Modal
    // ============================= 

    openStatsModal() {
        this.updateGeneralStats();
        this.updateHistoryList();
        this.openModal('statsModal');
    }

    closeStatsModal() {
        this.closeModal('statsModal');
    }

    updateGeneralStats() {
        const allDays = this.storage.getAllDays();
        const dates = Object.keys(allDays).sort();
        
        let totalBoxes = 0;
        let totalHours = 0;
        let bestDayValue = 0;
        let bestDayDate = 'لا توجد بيانات';
        let streak = 0;
        let currentStreak = 0;

        dates.forEach((date, index) => {
            const boxes = allDays[date];
            let completed = 0;
            
            for (let i = 0; i < 24; i++) {
                if (boxes[i].status === 'studied') {
                    completed++;
                }
            }
            
            totalBoxes += completed;
            totalHours += completed;
            
            if (completed > 0) {
                currentStreak++;
                streak = Math.max(streak, currentStreak);
            } else {
                currentStreak = 0;
            }
            
            if (completed > bestDayValue) {
                bestDayValue = completed;
                const d = new Date(date);
                bestDayDate = d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
            }
        });

        const avgDaily = dates.length > 0 ? ((totalBoxes / (dates.length * 24)) * 100).toFixed(1) : 0;

        document.getElementById('totalBoxes').textContent = totalBoxes;
        document.getElementById('totalHours').textContent = totalHours;
        document.getElementById('bestDay').textContent = bestDayValue > 0 ? `${bestDayValue} (${bestDayDate})` : 'لا توجد';
        document.getElementById('avgDaily').textContent = avgDaily + '%';
        document.getElementById('streak').textContent = streak;
        document.getElementById('totalDays').textContent = dates.length;
    }

    updateHistoryList() {
        const allDays = this.storage.getAllDays();
        const dates = Object.keys(allDays).sort().reverse();
        const historyList = document.getElementById('historyList');
        
        if (dates.length === 0) {
            historyList.innerHTML = '<p class="empty-history">لا توجد بيانات بعد</p>';
            return;
        }

        historyList.innerHTML = '';
        
        dates.forEach(date => {
            const boxes = allDays[date];
            let completed = 0;
            
            for (let i = 0; i < 24; i++) {
                if (boxes[i].status === 'studied') {
                    completed++;
                }
            }
            
            const score = (completed / 24) * 100;
            const d = new Date(date);
            const dateStr = d.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' });
            
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-date">${dateStr}</span>
                <div class="history-stats">
                    <span class="history-boxes">${completed} / 24</span>
                    <span class="history-score">${score.toFixed(2)} / 100</span>
                </div>
            `;
            historyList.appendChild(item);
        });
    }

    // ============================= 
    // Modal Control
    // ============================= 

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        modal.classList.add('active');
        overlay.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        this.checkIfAnyModalOpen();
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('modalOverlay').classList.remove('active');
    }

    checkIfAnyModalOpen() {
        const openModals = document.querySelectorAll('.modal.active');
        if (openModals.length === 0) {
            document.getElementById('modalOverlay').classList.remove('active');
        }
    }
}

// ============================= 
// Initialize App
// ============================= 

document.addEventListener('DOMContentLoaded', () => {
    new StudyBoxesApp();
});