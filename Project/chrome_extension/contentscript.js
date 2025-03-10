console.log("Security Caution Popup!");

const scanWorker = new Worker('worker.js');

scanWorker.onmessage = function(e) {
    if (e.data.success) {
        try {
            const data = JSON.parse(e.data.data);
            if (data.result === "malicious") {
                chrome.runtime.sendMessage({
                    type: 'SHOW_NOTIFICATION',
                    content: {
                        title: "위험한 웹페이지 감지",
                        message: "현재 페이지에서 잠재적인 위험이 감지되었습니다!"
                    }
                });
            }
        } catch (error) {
            console.error("JSON 파싱 에러:", error);
        }
    } else {
        console.error("스캔 작업 실패:", e.data.error);
    }
};

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

    // 웹 워커에 스캔 작업 위임
    scanWorker.postMessage({
        url: window.location.href,
        html: htmlContent,
        scripts: scriptUrls
    });
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
