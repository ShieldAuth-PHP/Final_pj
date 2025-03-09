console.log("Security Caution Popup!");

// 페이지의 HTML과 스크립트 내용을 수집
function scanPage() {
  const pageContent = {
    html: document.documentElement.outerHTML,
    url: window.location.href,
    scripts: Array.from(document.getElementsByTagName('script'))
      .map(script => script.src)
      .filter(src => src), // 외부 스크립트 URL만 수집
  };

  // background.js로 데이터 전송
  chrome.runtime.sendMessage({
    type: 'SCAN_PAGE',
    content: pageContent
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('메시지 전송 오류:', chrome.runtime.lastError);
    }
  });
}

// DOM이 완전히 로드된 후 스캔 실행
document.addEventListener('DOMContentLoaded', scanPage);

// 동적 콘텐츠 변경 감지
const observer = new MutationObserver(() => {
  scanPage(); // 페이지 내용이 변경될 때마다 재스캔
});

// 동적 변경 감지 시작
observer.observe(document.body, {
  childList: true,
  subtree: true
});
