document.addEventListener('DOMContentLoaded', function() {
    const logContent = document.getElementById('logContent');
    
    // Chrome storage에서 로그 데이터 불러오기
    chrome.storage.local.get(['scanLogs'], function(result) {
        if (result.scanLogs && result.scanLogs.length > 0) {
            logContent.innerHTML = result.scanLogs
                .map(log => `<div class="log-entry ${getLogClass(log)}">${log}</div>`)
                .join('');
        } else {
            logContent.innerHTML = '<div class="log-entry">저장된 로그가 없습니다.</div>';
        }
    });
});

function getLogClass(log) {
    if (log.includes('[ERROR]')) return 'log-error';
    if (log.includes('[INFO]')) return 'log-info';
    if (log.includes('[DEBUG]')) return 'log-debug';
    return '';
}