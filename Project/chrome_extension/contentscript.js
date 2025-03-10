console.log("Security Caution Popup!");

function sendScanMessage(newElements = null) {
    let htmlContent, scriptUrls;
    if (Array.isArray(newElements) && newElements.length > 0) {
        // 신규 태그만 스캔: 각 요소의 outerHTML 취합
        htmlContent = newElements.map(el => el.outerHTML).join('');
        // 신규 요소 내에 존재하는 스크립트 태그의 src 수집
        scriptUrls = [];
        newElements.forEach(el => {
            if (el.querySelectorAll) {
                el.querySelectorAll('script').forEach(script => {
                    if (script.src) scriptUrls.push(script.src);
                });
            }
        });
    } else {
        // 전체 DOM 스캔
        htmlContent = document.documentElement.outerHTML;
        scriptUrls = Array.from(document.querySelectorAll('script')).map(script => script.src);
    }
    const message = {
        type: 'SCAN_PAGE',
        content: {
            url: window.location.href,
            html: htmlContent,
            scripts: scriptUrls
        }
    };
    try {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("sendScanMessage error:", chrome.runtime.lastError.message);
                    return;
                }
                // ... 응답 처리 ...
            });
        } else {
            console.warn("chrome.runtime.sendMessage is not available.");
        }
    } catch (error) {
        console.error("sendScanMessage exception:", error);
    }
}

if (document.readyState === 'complete') {
    // 문서가 완전히 로드된 경우 전체 스캔 시작
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => sendScanMessage());
    } else {
        setTimeout(() => sendScanMessage(), 2000);
    }
} else {
    window.addEventListener('load', () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => sendScanMessage());
        } else {
            setTimeout(() => sendScanMessage(), 2000);
        }
    });
}

let debounceTimer; // 디바운스 타이머 변수

// 동적 콘텐츠 변경 감지: 등록된 변경 중 신규 태그만 선택하여 스캔
const observer = new MutationObserver((mutations) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const addedElements = [];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    addedElements.push(node);
                }
            });
        });
        if (addedElements.length > 0) {
            sendScanMessage(addedElements);
        }
    }, 500);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
