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
    try {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("sendScanMessage error:", chrome.runtime.lastError.message);
                    return;
                }
                // ... handle response if needed ...
            });
        } else {
            console.warn("chrome.runtime.sendMessage is not available.");
        }
    } catch (error) {
        console.error("sendScanMessage exception:", error);
    }
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

let debounceTimer; // 디바운스 타이머 변수 추가

// 동적 콘텐츠 변경 감지
const observer = new MutationObserver(() => {
    // 디바운스 적용: 마지막 변경 후 500ms 이후에 sendScanMessage 실행
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        sendScanMessage();
    }, 500);
});

// 동적 변경 감지 시작
observer.observe(document.body, {
    childList: true,
    subtree: true
});
