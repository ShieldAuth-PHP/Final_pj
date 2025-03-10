console.log("Security Caution Popup!");

function sendScanMessage() {
    const message = {
        type: 'SCAN_PAGE',
        content: {
            url: window.location.href,
            html: document.documentElement.outerHTML,
            scripts: Array.from(document.querySelectorAll('script')).map(script => script.src)
        }
    };
    chrome.runtime.sendMessage(message);
}

if (document.readyState === 'complete') {
    // 문서가 완전히 로드된 경우
    if ('requestIdleCallback' in window) {
        requestIdleCallback(sendScanMessage);
    } else {
        setTimeout(sendScanMessage, 2000);
    }
} else {
    window.addEventListener('load', () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(sendScanMessage);
        } else {
            setTimeout(sendScanMessage, 2000);
        }
    });
}

// 동적 콘텐츠 변경 감지
const observer = new MutationObserver(() => {
    sendScanMessage(); // 페이지 내용이 변경될 때마다 재스캔
});

// 동적 변경 감지 시작
observer.observe(document.body, {
    childList: true,
    subtree: true
});
