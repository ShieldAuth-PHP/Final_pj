console.log("Security Caution Popup!");

function initializeWorker() {
    try {
        const worker = new Worker(chrome.runtime.getURL('worker.js'), { type: "module" });
        
        worker.onerror = function(error) {
            console.error("Worker 오류 발생:", error);
            // 오류 발생 시 Worker 재생성 시도
            setTimeout(() => {
                scanWorker = initializeWorker();
            }, 1000);
        };

        // Worker 상태 확인
        if (worker.state === 'terminated') {
            console.warn('Worker가 종료됨. 재생성 시도...');
            return initializeWorker();
        }

        return worker;
    } catch (error) {
        console.error("Worker 초기화 실패:", error);
        return null;
    }
}

let scanWorker = null;

function ensureWorkerIsActive() {
    if (!scanWorker || scanWorker.state === 'terminated') {
        scanWorker = initializeWorker();
        return true;
    }
    return false;
}

// SPA 환경 처리 개선
window.addEventListener('popstate', () => {
    if (scanWorker) {
        scanWorker.terminate();
        scanWorker = initializeWorker();
    }
});

// 페이지 언로드 처리 개선
window.addEventListener('beforeunload', () => {
    if (scanWorker) {
        scanWorker.terminate();
        scanWorker = null;
    }
});

// 스캔 메시지 전송 전 Worker 상태 확인
function sendScanMessage(newElements = null) {
    if (!ensureWorkerIsActive()) {
        console.warn('Worker가 활성화되지 않음');
        return;
    }
    
    let htmlContent, scriptUrls;
    if (Array.isArray(newElements) && newElements.length > 0) {
        htmlContent = newElements.map(el => el.outerHTML).join('');
        scriptUrls = [];
        newElements.forEach(el => {
            if (el.querySelectorAll) {
                el.querySelectorAll('script').forEach(script => {
                    if (script.src) scriptUrls.push(script.src);
                });
            }
        });
    } else {
        htmlContent = document.documentElement.outerHTML;
        scriptUrls = Array.from(document.querySelectorAll('script')).map(script => script.src);
    }
    
    scanWorker.postMessage({
        url: window.location.href,
        html: htmlContent,
        scripts: scriptUrls
    });
}

// 문서 로딩 완료 시 스캔 실행
if (document.readyState === 'complete') {
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

let debounceTimer;

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
