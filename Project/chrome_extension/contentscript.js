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
  });
}

// 페이지 로드 완료 시 스캔 실행
scanPage();
