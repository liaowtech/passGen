// 全局变量
let passwordHistory = [];
let batchPasswords = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    updateLengthDisplay();
    generatePassword();
});

function bindEvents() {
    // 导航切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // 长度滑块
    document.getElementById('password-length').addEventListener('input', updateLengthDisplay);
    
    // 生成按钮
    document.getElementById('generate-btn').addEventListener('click', generatePassword);
    document.getElementById('refresh-btn').addEventListener('click', generatePassword);
    
    // 复制按钮
    document.getElementById('copy-btn').addEventListener('click', copyPassword);
    
    // 强度检测
    document.getElementById('check-password').addEventListener('input', checkPasswordStrength);
    
    // 批量生成
    document.getElementById('batch-generate-btn').addEventListener('click', generateBatchPasswords);
    document.getElementById('export-btn').addEventListener('click', exportToCSV);
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function updateLengthDisplay() {
    const slider = document.getElementById('password-length');
    const value = document.getElementById('length-value');
    value.textContent = slider.value;
}

function generatePassword() {
    const length = parseInt(document.getElementById('password-length').value);
    const options = getPasswordOptions();
    
    if (!isValidOptions(options)) {
        showToast('请至少选择一种字符类型', 'error');
        return;
    }
    
    const password = generateRandomPassword(length, options);
    document.getElementById('password-output').value = password;
    
    updatePasswordStrength(password);
    addToHistory(password);
    showToast('密码生成成功', 'success');
}

function getPasswordOptions() {
    return {
        uppercase: document.getElementById('uppercase').checked,
        lowercase: document.getElementById('lowercase').checked,
        numbers: document.getElementById('numbers').checked,
        symbols: document.getElementById('symbols').checked,
        excludeSimilar: document.getElementById('exclude-similar').checked,
        excludeChars: document.getElementById('exclude-chars').value
    };
}

function isValidOptions(options) {
    return options.uppercase || options.lowercase || options.numbers || options.symbols;
}

function generateRandomPassword(length, options) {
    let charset = '';
    
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (options.excludeSimilar) {
        charset = charset.replace(/[0O1Il]/g, '');
    }
    
    if (options.excludeChars) {
        for (let char of options.excludeChars) {
            charset = charset.replace(new RegExp(char, 'g'), '');
        }
    }
    
    if (charset.length === 0) return '无法生成密码';
    
    let password = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    
    return password;
}

function updatePasswordStrength(password) {
    const strength = calculatePasswordStrength(password);
    
    document.getElementById('strength-score').textContent = strength.score;
    document.getElementById('strength-fill').style.width = strength.score + '%';
    document.getElementById('strength-text').textContent = strength.text;
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;
    
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 10;
    
    if (!/(.)\1{2,}/.test(password)) score += 10;
    
    let text = '';
    if (score >= 80) text = '极强';
    else if (score >= 60) text = '强';
    else if (score >= 40) text = '中等';
    else if (score >= 20) text = '弱';
    else text = '极弱';
    
    return { score, text };
}

function addToHistory(password) {
    if (passwordHistory.includes(password)) return;
    
    passwordHistory.unshift(password);
    if (passwordHistory.length > 10) {
        passwordHistory = passwordHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    
    if (passwordHistory.length === 0) {
        historyList.innerHTML = '<div class="empty">暂无历史记录</div>';
        return;
    }
    
    historyList.innerHTML = passwordHistory.map((password, index) => `
        <div class="history-item">
            <span class="history-password">${password}</span>
            <div class="history-actions">
                <button onclick="copyToClipboard('${password}')">复制</button>
                <button onclick="removeFromHistory(${index})">删除</button>
            </div>
        </div>
    `).join('');
}

function removeFromHistory(index) {
    passwordHistory.splice(index, 1);
    updateHistoryDisplay();
}

function copyPassword() {
    copyToClipboard(document.getElementById('password-output').value);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
}

function checkPasswordStrength() {
    const password = document.getElementById('check-password').value;
    
    if (!password) {
        resetCheckResults();
        return;
    }
    
    const strength = calculatePasswordStrength(password);
    const entropy = calculateEntropy(password);
    const crackTime = estimateCrackTime(password);
    
    document.getElementById('check-strength').textContent = strength.text;
    document.getElementById('check-score').textContent = strength.score;
    document.getElementById('check-entropy').textContent = entropy.toFixed(2);
    document.getElementById('check-crack-time').textContent = crackTime;
}

function resetCheckResults() {
    document.getElementById('check-strength').textContent = '-';
    document.getElementById('check-score').textContent = '-';
    document.getElementById('check-entropy').textContent = '-';
    document.getElementById('check-crack-time').textContent = '-';
}

function calculateEntropy(password) {
    const charset = new Set(password).size;
    return Math.log2(Math.pow(charset, password.length));
}

function estimateCrackTime(password) {
    const entropy = calculateEntropy(password);
    const attemptsPerSecond = 1e9;
    const seconds = Math.pow(2, entropy) / attemptsPerSecond;
    
    if (seconds < 1) return '瞬间';
    if (seconds < 60) return Math.round(seconds) + '秒';
    if (seconds < 3600) return Math.round(seconds / 60) + '分钟';
    if (seconds < 86400) return Math.round(seconds / 3600) + '小时';
    if (seconds < 31536000) return Math.round(seconds / 86400) + '天';
    return Math.round(seconds / 31536000) + '年';
}

function generateBatchPasswords() {
    const count = parseInt(document.getElementById('batch-count').value);
    const options = getPasswordOptions();
    
    if (!isValidOptions(options)) {
        showToast('请至少选择一种字符类型', 'error');
        return;
    }
    
    batchPasswords = [];
    const length = parseInt(document.getElementById('password-length').value);
    
    for (let i = 0; i < count; i++) {
        batchPasswords.push(generateRandomPassword(length, options));
    }
    
    updateBatchDisplay();
    showToast(`已生成 ${count} 个密码`, 'success');
}

function updateBatchDisplay() {
    const batchList = document.getElementById('batch-list');
    
    if (batchPasswords.length === 0) {
        batchList.innerHTML = '<div class="empty">点击生成按钮开始</div>';
        return;
    }
    
    batchList.innerHTML = batchPasswords.map((password, index) => `
        <div class="batch-item">
            <span class="batch-password">${password}</span>
            <div class="batch-actions">
                <button onclick="copyToClipboard('${password}')">复制</button>
            </div>
        </div>
    `).join('');
}

function exportToCSV() {
    if (batchPasswords.length === 0) {
        showToast('没有可导出的密码', 'error');
        return;
    }
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
        '序号,密码\n' +
        batchPasswords.map((password, index) => `${index + 1},${password}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'passwords.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV文件已下载', 'success');
}

/**
 * 显示提示消息（toast），3秒后自动消失
 * @param {string} message - 要显示的消息内容
 * @param {string} [type='info'] - 消息类型（如 'success', 'error', 'info'），用于样式区分
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`; 
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
} 
