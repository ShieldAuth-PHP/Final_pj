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
  console.log("📩 메시지 수신:", message);

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

      let activeTab = tabs[0];

      // 🚨 activeTab.url이 undefined인 경우 대비
      if (!activeTab.url) {
        console.warn("⚠️ 활성 탭의 URL을 가져올 수 없습니다.");
        return;
      }

      // ❌ chrome:// 페이지에서는 실행하지 않도록 예외 처리
      if (activeTab.url.startsWith("chrome://")) {
        console.warn(
          "⚠️ chrome:// 페이지에서는 스크립트를 실행할 수 없습니다."
        );
        return;
      }

      try {
        chrome.scripting
          .executeScript({
            target: { tabId: activeTab.id },
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
  } else if (message.action === "malware_detected") {
    console.log("⚠️ 악성 코드 탐지됨.");
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/alert.png",
      title: "⚠️ 악성 코드 감지",
      message: "웹페이지에서 악성 코드가 탐지되었습니다!",
    });
  }

  return true; // sendResponse를 비동기적으로 사용할 수 있도록 처리
});
