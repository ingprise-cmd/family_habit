/**
 * Habit Tracker App Logic
 * Supports Multi-User: Sua, Han
 * Supports Parent Admin View
 */

// --- Constants ---
const USERS = {
    sua: { name: '수아', key: 'habit_score_sua' },
    han: { name: '한', key: 'habit_score_han' }
};

let currentActiveUser = null;

// --- Custom Modal Logic ---
/* 
    Injected HTML Structure:
    <div id="custom-modal-overlay" class="custom-modal-overlay">
        <div class="custom-modal-content">
            <h3 id="custom-modal-title" class="custom-modal-title">알림</h3>
            <p id="custom-modal-message" class="custom-modal-message"></p>
            <div id="custom-modal-buttons" class="custom-modal-buttons"></div>
        </div>
    </div>
*/

document.addEventListener('DOMContentLoaded', () => {
    initModal();
});

function initModal() {
    if (document.getElementById('custom-modal-overlay')) return;

    const modalHTML = `
        <div id="custom-modal-overlay" class="custom-modal-overlay">
            <div class="custom-modal-content">
                <h3 id="custom-modal-title" class="custom-modal-title">알림</h3>
                <p id="custom-modal-message" class="custom-modal-message"></p>
                <div id="custom-modal-buttons" class="custom-modal-buttons"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showAlert(message, callback) {
    const overlay = document.getElementById('custom-modal-overlay');
    const titleEl = document.getElementById('custom-modal-title');
    const msgEl = document.getElementById('custom-modal-message');
    const btnContainer = document.getElementById('custom-modal-buttons');

    if (!overlay) return;

    titleEl.textContent = '알림';
    msgEl.textContent = message;
    btnContainer.innerHTML = '';

    const okBtn = document.createElement('button');
    okBtn.className = 'custom-modal-btn custom-modal-btn-primary';
    okBtn.textContent = '확인';
    okBtn.onclick = () => {
        closeCustomModal();
        if (callback) callback();
    };

    btnContainer.appendChild(okBtn);
    openCustomModal();
}

function showConfirm(message, onConfirm, onCancel) {
    const overlay = document.getElementById('custom-modal-overlay');
    const titleEl = document.getElementById('custom-modal-title');
    const msgEl = document.getElementById('custom-modal-message');
    const btnContainer = document.getElementById('custom-modal-buttons');

    if (!overlay) return;

    titleEl.textContent = '확인';
    msgEl.textContent = message;
    btnContainer.innerHTML = '';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'custom-modal-btn custom-modal-btn-cancel';
    cancelBtn.textContent = '취소';
    cancelBtn.onclick = () => {
        closeCustomModal();
        if (onCancel) onCancel();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'custom-modal-btn custom-modal-btn-primary';
    confirmBtn.textContent = '확인';
    confirmBtn.onclick = () => {
        closeCustomModal();
        if (onConfirm) onConfirm();
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    openCustomModal();
}

function openCustomModal() {
    const overlay = document.getElementById('custom-modal-overlay');
    overlay.classList.add('active');
}

function closeCustomModal() {
    const overlay = document.getElementById('custom-modal-overlay');
    overlay.classList.remove('active');
}

// --- Child Page Logic ---
function initChildPage(targetUser) {
    let userId = targetUser;

    // If not provided, try to get from URL (legacy support)
    if (!userId) {
        const params = new URLSearchParams(window.location.search);
        userId = params.get('user');
    }

    if (!userId || !USERS[userId]) {
        showAlert('잘못된 접근입니다.', () => {
            window.location.href = 'index.html';
        });
        return;
    }

    currentActiveUser = userId;
    const userData = USERS[userId];
    document.getElementById('user-name').textContent = userData.name;

    // Render Dynamic Habits
    renderHabitsForChild(userId);

    // Load Score
    updateScoreDisplay(userId);

    // Setup main button (first one)
    const mainBtn = document.getElementById('complete-btn');
    if (mainBtn) {
        // mainBtn.onclick = () => addPoints(5, mainBtn); // Removed as per instruction
    }
}

// --- Score Logic ---
// Previously stored in 'habit_score_userId', now calculated dynamically.

function updateScoreDisplay(userId) {
    const totalScore = getTotalScore(userId);

    // Child page
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = totalScore;

    // Parent page
    const parentScoreEl = document.getElementById(`score-${userId}`);
    if (parentScoreEl) parentScoreEl.textContent = totalScore;
}

// NOTE: addPoints is deprecated in favor of completeHabit + incrementHabitCount

// --- Parent Page Logic ---
function initParentPage() {
    // Check Auth (Simple Session Check or revert to index)
    if (sessionStorage.getItem('parent_auth') !== 'true') {
        showAlert('비밀번호 확인이 필요합니다.', () => {
            window.location.href = 'index.html';
        });
        return;
    }

    // Load Data
    renderParentDashboard();
}

function renderParentDashboard() {
    // Sua
    updateScoreDisplay('sua');

    // Han
    updateScoreDisplay('han');

    // Render Habit Management Lists
    renderParentHabitManagement('sua');
    renderParentHabitManagement('han');
}

// --- Habit Management Functions ---

function renderParentHabitManagement(userId) {
    const listContainer = document.getElementById(`habit-list-${userId}`);
    if (!listContainer) return;

    const habits = getHabits(userId);
    listContainer.innerHTML = '';

    habits.forEach(habit => {
        const item = document.createElement('div');
        item.className = 'admin-habit-item';
        item.id = `habit-row-${habit.id}`;

        // View mode HTML
        item.innerHTML = `
            <div class="habit-view-mode">
                <span>${habit.icon} ${habit.title} (${habit.points}점)</span>
                <div class="habit-actions">
                    <button class="edit-btn" style="margin-right: 5px; background: #FFB74D; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Jua', sans-serif;" onclick="toggleHabitEditMode('${userId}', '${habit.id}')">수정</button>
                    <button class="delete-btn" onclick="removeHabit('${userId}', '${habit.id}')">삭제</button>
                </div>
            </div>
            <div class="habit-edit-mode" style="display: none;">
                <input type="text" id="edit-title-${habit.id}" value="${habit.title}" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px; font-family: 'Jua', sans-serif;">
                <select id="edit-icon-${habit.id}" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; font-family: 'Jua', sans-serif;">
                    <option value="📚" ${habit.icon === '📚' ? 'selected' : ''}>📚 독서</option>
                    <option value="✏️" ${habit.icon === '✏️' ? 'selected' : ''}>✏️ 공부</option>
                    <option value="🎨" ${habit.icon === '🎨' ? 'selected' : ''}>🎨 미술</option>
                    <option value="🎵" ${habit.icon === '🎵' ? 'selected' : ''}>🎵 음악</option>
                    <option value="⚽️" ${habit.icon === '⚽️' ? 'selected' : ''}>⚽️ 운동</option>
                    <option value="🧹" ${habit.icon === '🧹' ? 'selected' : ''}>🧹 정리</option>
                    <option value="⭐️" ${habit.icon === '⭐️' ? 'selected' : ''}>⭐️ 기타</option>
                </select>
                <select id="edit-points-${habit.id}" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; font-family: 'Jua', sans-serif;">
                    <option value="-5" ${habit.points === -5 ? 'selected' : ''}>-5점 (벌점)</option>
                    <option value="5" ${habit.points === 5 ? 'selected' : ''}>5점</option>
                    <option value="10" ${habit.points === 10 ? 'selected' : ''}>10점</option>
                </select>
                <div class="habit-actions">
                    <button class="save-btn" style="margin-right: 5px; background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Jua', sans-serif;" onclick="saveInlineHabitEdit('${userId}', '${habit.id}')">저장</button>
                    <button class="cancel-btn" style="background: #9E9E9E; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Jua', sans-serif;" onclick="cancelInlineHabitEdit('${userId}', '${habit.id}')">취소</button>
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function toggleHabitEditMode(userId, habitId) {
    const row = document.getElementById(`habit-row-${habitId}`);
    if (!row) return;

    const viewMode = row.querySelector('.habit-view-mode');
    const editMode = row.querySelector('.habit-edit-mode');

    // Hide view, show edit
    viewMode.style.display = 'none';
    editMode.style.display = 'flex';
}

function cancelInlineHabitEdit(userId, habitId) {
    const row = document.getElementById(`habit-row-${habitId}`);
    if (!row) return;

    const viewMode = row.querySelector('.habit-view-mode');
    const editMode = row.querySelector('.habit-edit-mode');

    // Show view, hide edit
    viewMode.style.display = 'flex';
    editMode.style.display = 'none';
}

function saveInlineHabitEdit(userId, habitId) {
    const title = document.getElementById(`edit-title-${habitId}`).value;
    const icon = document.getElementById(`edit-icon-${habitId}`).value;
    const points = parseInt(document.getElementById(`edit-points-${habitId}`).value);

    if (!title) {
        showAlert('습관 이름을 입력해주세요!');
        return;
    }

    const payload = {
        id: habitId,
        title: title,
        desc: `${points}점 획득!`,
        points: points,
        icon: icon
    };

    saveHabit(userId, payload);
    showAlert('습관이 수정되었습니다!');

    // Refresh the list
    renderParentHabitManagement(userId);
}

function handleAddHabit(userId) {
    const titleInput = document.getElementById(`new-habit-title-${userId}`);
    const pointsInput = document.getElementById(`new-habit-points-${userId}`);
    const iconInput = document.getElementById(`new-habit-icon-${userId}`);

    const title = titleInput.value;
    const points = parseInt(pointsInput.value);
    const icon = iconInput.value || '⭐️';

    if (!title) {
        showAlert('습관 이름을 입력해주세요!');
        return;
    }

    const payload = {
        title: title,
        desc: `${points}점 획득!`,
        points: points,
        icon: icon
    };

    saveHabit(userId, payload);
    showAlert('습관이 추가되었습니다!');

    // Clear form
    titleInput.value = '';
    pointsInput.value = 5;
    iconInput.value = '⭐️';

    // Refresh List
    renderParentHabitManagement(userId);
}

function removeHabit(userId, habitId) {
    showConfirm('정말 이 습관을 삭제하시겠습니까?', () => {
        deleteHabit(userId, habitId);
        renderParentHabitManagement(userId);
    });
}

function resetUserScore(userId) {
    showConfirm(`${USERS[userId].name}의 점수를 0점으로 초기화할까요?`, () => {
        const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
        if (data[userId]) {
            data[userId].forEach(h => h.count = 0);
            localStorage.setItem(HABIT_KEY, JSON.stringify(data));
        }
        renderParentDashboard();
    });
}

// --- Landing Page Logic (Password) ---
const PASSWORD_KEY = 'parent_password';

function checkParentPassword() {
    const modal = document.getElementById('password-modal');
    modal.classList.remove('hidden');
    document.getElementById('password-input').focus();

    // Enter key support
    document.getElementById('password-input').onkeypress = function (e) {
        if (!e) e = window.event;
        var keyCode = e.code || e.key;
        if (keyCode == 'Enter') {
            verifyPassword();
            return false;
        }
    }
}

function closeModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('password-input').value = '';
}

function verifyPassword() {
    const input = document.getElementById('password-input').value;
    const storedPassword = localStorage.getItem(PASSWORD_KEY) || '1234';

    if (input === storedPassword) {
        sessionStorage.setItem('parent_auth', 'true');
        window.location.href = 'parent.html';
    } else {
        alert('비밀번호가 틀렸습니다!');
        document.getElementById('password-input').value = '';
    }
}

function changePassword() {
    const currentPw = document.getElementById('current-password').value;
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('confirm-password').value;

    const storedPassword = localStorage.getItem(PASSWORD_KEY) || '1234';

    if (currentPw !== storedPassword) {
        alert('현재 비밀번호가 일치하지 않습니다.');
        return;
    }

    if (newPw.length < 4) {
        alert('비밀번호는 4자리 이상이어야 합니다.');
        return;
    }

    if (newPw !== confirmPw) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }

    localStorage.setItem(PASSWORD_KEY, newPw);
    alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
    sessionStorage.removeItem('parent_auth');
    window.location.href = 'index.html';
}


// --- Habit Data Logic ---
const HABIT_KEY = 'habit_tracker_data';
const DEFAULT_HABITS = [
    { id: 'h1', title: '치카치카 양치하기', desc: '깨끗한 이를 위해 3분 동안!', points: 5, icon: '🦷', count: 0 },
    { id: 'h2', title: '책 읽기', desc: '재미있는 책 1권 읽기', points: 5, icon: '📚', count: 0 }
];

// Edit State
let editingHabitId = null;

function getHabits(userId) {
    const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
    let needsSave = false;

    if (!data[userId]) {
        // Initialize default habits for new usage
        data[userId] = JSON.parse(JSON.stringify(DEFAULT_HABITS));
        needsSave = true;
    } else {
        // Migrate/Ensure count exists
        data[userId].forEach(h => {
            if (typeof h.count !== 'number') {
                h.count = 0;
                needsSave = true;
            }
        });
    }

    if (needsSave) {
        localStorage.setItem(HABIT_KEY, JSON.stringify(data));
    }
    return data[userId];
}

function saveHabit(userId, newHabit) {
    const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
    if (!data[userId]) data[userId] = [];

    if (newHabit.id) {
        // Update existing
        const index = data[userId].findIndex(h => h.id === newHabit.id);
        if (index !== -1) {
            // Preserve count
            newHabit.count = data[userId][index].count || 0;
            data[userId][index] = newHabit;
        } else {
            // Treat as new if not found? unlikely
            newHabit.count = 0;
            data[userId].push(newHabit);
        }
    } else {
        // Create new
        newHabit.id = 'h_' + Date.now();
        newHabit.count = 0;
        data[userId].push(newHabit);
    }

    localStorage.setItem(HABIT_KEY, JSON.stringify(data));
    return newHabit;
}

function deleteHabit(userId, habitId) {
    const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
    if (!data[userId]) return;

    data[userId] = data[userId].filter(h => h.id !== habitId);
    localStorage.setItem(HABIT_KEY, JSON.stringify(data));
}

function incrementHabitCount(userId, habitId) {
    const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
    if (!data[userId]) return;

    const habit = data[userId].find(h => h.id == habitId);
    if (habit) {
        habit.count = (habit.count || 0) + 1;
        localStorage.setItem(HABIT_KEY, JSON.stringify(data));
    }
}

function getTotalScore(userId) {
    const habits = getHabits(userId);
    return habits.reduce((sum, h) => sum + (h.points * (h.count || 0)), 0);
}

// --- Child Page Styling & Rendering ---
function renderHabitsForChild(userId) {
    const habits = getHabits(userId);
    const container = document.getElementById('habit-list-container');
    if (!container) return; // specific to child page

    container.innerHTML = ''; // Clear

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.style.marginTop = '15px'; // Spacing utility

        card.innerHTML = `
            <div class="habit-icon">${habit.icon || '⭐️'}</div>
            <div class="habit-info">
                <h2>${habit.title}</h2>
                <p>${habit.desc}</p>
            </div>
            <button class="action-btn" onclick="completeHabit('${userId}', '${habit.id}', ${habit.points}, this)">완료했어요! (+${habit.points}점)</button>
        `;
        container.appendChild(card);
    });
}

function completeHabit(userId, habitId, points, btnElement) {
    incrementHabitCount(userId, habitId);

    // Update Score UI
    updateScoreDisplay(userId);

    // Effect
    triggerConfetti();

    // Button Feedback
    if (btnElement) {
        const originalText = btnElement.textContent;

        // Different feedback for positive vs negative points
        if (points < 0) {
            btnElement.textContent = '벌점이 기록되었어요 😢';
            btnElement.style.backgroundColor = '#FF8A65';
        } else {
            btnElement.textContent = '참 잘했어요! 👍';
            btnElement.style.backgroundColor = '#FFB74D';
        }

        setTimeout(() => {
            btnElement.textContent = originalText;
            btnElement.style.backgroundColor = '';
        }, 1500);
    }
}

// --- Utility: Confetti ---
function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// --- Data Import/Export Functions ---

/**
 * Export habit data to CSV format (Google Sheets compatible)
 * CSV Structure: 날짜,사용자,습관명,아이콘,포인트,완료횟수
 */
function exportToCSV() {
    const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
    const currentDate = new Date().toISOString().split('T')[0];

    // CSV Header
    let csv = '날짜,사용자,습관명,아이콘,포인트,완료횟수\n';

    // Add data for each user
    Object.keys(USERS).forEach(userId => {
        const userName = USERS[userId].name;
        const habits = data[userId] || [];

        habits.forEach(habit => {
            const row = [
                currentDate,
                userName,
                `"${habit.title}"`, // Quote to handle commas in title
                habit.icon || '⭐️',
                habit.points,
                habit.count || 0
            ].join(',');
            csv += row + '\n';
        });
    });

    // Download CSV file
    downloadFile(csv, `습관트래커_${currentDate}.csv`, 'text/csv;charset=utf-8;');
    showAlert('CSV 파일이 다운로드되었습니다!');
}

/**
 * Import habit data from CSV file
 */
function importFromCSV(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');

            // Skip header
            const dataLines = lines.slice(1).filter(line => line.trim());

            const data = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');

            // Parse CSV data
            dataLines.forEach(line => {
                const parts = line.split(',');
                if (parts.length < 6) return;

                const [date, userName, title, icon, points, count] = parts;

                // Find userId by userName
                const userId = Object.keys(USERS).find(id => USERS[id].name === userName.trim());
                if (!userId) return;

                // Clean title (remove quotes)
                const cleanTitle = title.replace(/^"|"$/g, '').trim();

                // Find or create habit
                if (!data[userId]) data[userId] = [];

                let habit = data[userId].find(h => h.title === cleanTitle);
                if (habit) {
                    // Update existing habit
                    habit.icon = icon.trim();
                    habit.points = parseInt(points);
                    habit.count = parseInt(count) || 0;
                } else {
                    // Create new habit
                    data[userId].push({
                        id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        title: cleanTitle,
                        desc: `${parseInt(points)}점 획득!`,
                        icon: icon.trim(),
                        points: parseInt(points),
                        count: parseInt(count) || 0
                    });
                }
            });

            localStorage.setItem(HABIT_KEY, JSON.stringify(data));
            showAlert('CSV 데이터를 성공적으로 불러왔습니다!', () => {
                renderParentDashboard();
            });

        } catch (error) {
            showAlert('CSV 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
        }
    };

    reader.readAsText(file, 'UTF-8');
}

/**
 * Export all data to JSON format (full backup)
 */
function exportToJSON() {
    const habitData = localStorage.getItem(HABIT_KEY) || '{}';
    const password = localStorage.getItem(PASSWORD_KEY) || '1234';
    const currentDate = new Date().toISOString().split('T')[0];

    const backup = {
        exportDate: currentDate,
        version: '1.0',
        habitData: JSON.parse(habitData),
        password: password
    };

    const json = JSON.stringify(backup, null, 2);
    downloadFile(json, `습관트래커_백업_${currentDate}.json`, 'application/json');
    showAlert('JSON 백업 파일이 다운로드되었습니다!');
}

/**
 * Import data from JSON backup file
 */
function importFromJSON(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            // Validate backup structure
            if (!backup.habitData) {
                throw new Error('올바른 백업 파일이 아닙니다.');
            }

            showConfirm(
                '기존 데이터를 모두 덮어쓰시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                () => {
                    // Restore data
                    localStorage.setItem(HABIT_KEY, JSON.stringify(backup.habitData));

                    if (backup.password) {
                        localStorage.setItem(PASSWORD_KEY, backup.password);
                    }

                    showAlert('데이터를 성공적으로 복원했습니다!', () => {
                        renderParentDashboard();
                    });
                }
            );

        } catch (error) {
            showAlert('JSON 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
        }
    };

    reader.readAsText(file);
}

/**
 * Helper function to download files
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType }); // Add BOM for UTF-8
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Handle file input for CSV import
 */
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        showAlert('CSV 파일만 업로드할 수 있습니다.');
        return;
    }

    importFromCSV(file);
    event.target.value = ''; // Reset input
}

/**
 * Handle file input for JSON import
 */
function handleJSONImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        showAlert('JSON 파일만 업로드할 수 있습니다.');
        return;
    }

    importFromJSON(file);
    event.target.value = ''; // Reset input
}
