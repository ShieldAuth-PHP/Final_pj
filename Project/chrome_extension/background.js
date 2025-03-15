const MALICIOUS_DOMAINS = [
  "emotet-malware.com",
  "socgholish-infection.net",
  "icedid-trojan.org",
];

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === "complete") {
    chrome.downloads.search({ id: delta.id }, (results) => {
      if (!results || !results.length) return;
      let item = results[0];
      let fileUrl = item.finalUrl || item.url;
      let filename = item.filename.split(/[/\\]/).pop();

      // 파일을 fetch로 불러와 Blob으로 변환 후 서버로 전송
      fetch(fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
          let formData = new FormData();
          formData.append("file", blob, filename);

          return fetch("http://localhost:5000/scan", {
            method: "POST",
            body: formData,
          });
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.result === "malicious") {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/alert.png",
              title: "⚠️ 악성 파일 감지",
              message: `${filename}에서 악성 코드가 탐지되었습니다! 삭제 중...`,
            });

            chrome.downloads.erase({ id: delta.id }, () => {
              console.log("🛑 악성 파일 삭제 완료:", filename);
            });

            chrome.runtime.sendMessage({ action: "malware_detected" });

            setTimeout(() => {
              closeBrowser();
            }, 3000);
          }
        })
        .catch((err) => console.error("파일 스캔 오류:", err));
    });
  }
});

// 악성 웹사이트 탐지 및 차단
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    let url = new URL(details.url);
    if (MALICIOUS_DOMAINS.some((domain) => url.hostname.includes(domain))) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/alert.png",
        title: "⚠️ 위험한 사이트 감지",
        message: `악성 사이트 (${url.hostname})가 차단되었습니다.`,
      });
      chrome.tabs.remove(details.tabId);
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "manual_scan") {
    console.log("🔍 정밀 검사 실행 중...");

    if (!chrome.scripting || !chrome.scripting.executeScript) {
      console.error(
        "❌ chrome.scripting.executeScript is undefined. Check permissions."
      );
      return;
    }

    // 현재 활성화된 탭 가져오기
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) {
        console.error("🚨 실행할 유효한 탭이 없습니다.");
        return;
      }

      let activeTabId = tabs[0].id;

      try {
        chrome.scripting
          .executeScript({
            target: { tabId: activeTabId },
            function: checkForMaliciousScripts,
          })
          .catch((err) => console.error("🚨 스크립트 실행 오류:", err));
      } catch (error) {
        console.error("🚨 실행 중 오류 발생:", error);
      }
    });

    sendResponse({ status: "scan_started" });

    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "scan_complete" });
    }, 3000);
  }
});

// Service Worker 종료 방지
setInterval(() => {
  console.log("🔄 Service Worker 유지 중...");
}, 25000);

function checkForMaliciousScripts() {
  const maliciousKeywords = [
    "atob(",
    "eval(",
    "document.write(",
    "window.location=",
  ];

  document.querySelectorAll("script").forEach((script) => {
    let scriptContent = script.innerText || script.textContent;

    if (
      scriptContent &&
      maliciousKeywords.some((keyword) => scriptContent.includes(keyword))
    ) {
      console.warn("🚨 악성 코드 탐지:", scriptContent);
      chrome.runtime.sendMessage({ action: "malicious_script_detected" });
      script.remove();
    }
  });
}

function closeBrowser() {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.remove(tab.id);
    }
  });
  chrome.runtime.reload();
}
