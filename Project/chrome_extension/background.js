// 백그라운드에서 Python 스크립트 실행
function startMonitorScript() {
  chrome.runtime.sendNativeMessage(
    "com.example.monitor",
    { action: "start" },
    function (response) {
      if (chrome.runtime.lastError) {
        console.error(
          "❌ Native 메시지 전송 오류:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("✅ Python 스크립트 실행됨:", response);
      }
    }
  );
}

// 파일 스캔 요청 처리
function scanFiles() {
  fetch("http://localhost:5000/scan", {
    method: "POST",
    body: JSON.stringify({ action: "scan_recent_downloads" }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("🔍 스캔 결과:", data);
      
      if (data.prediction === "malicious") {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/alert.png",
          title: "악성코드 감지!",
          message: "파일에서 악성코드가 발견되었습니다.",
        });
        
        chrome.runtime.sendMessage({ action: "malware_detected" });
      } else {
        chrome.runtime.sendMessage({ action: "scan_complete" });
      }
    })
    .catch((err) => {
      console.error("스캔 요청 오류:", err);
      chrome.runtime.sendMessage({ action: "scan_error" });
    });
}

// 메시지 리스너 등록
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 background.js에서 메시지 수신:", message);

  if (message.action === "manual_scan") {
    console.log("🔍 수동 스캔 요청 수신");
    scanFiles();
    sendResponse({ status: "scanning" });
    return true;
  }
  
  if (message.action === "malicious_script_detected") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/alert.png",
      title: "악성 스크립트 감지!",
      message: "웹페이지에서 악성 스크립트가 감지되었습니다.",
    });
  }
});

// 확장 프로그램이 설치되면 Python 모니터링 스크립트 실행
chrome.runtime.onInstalled.addListener(() => {
  console.log("🚀 확장 프로그램이 설치됨");
  startMonitorScript();
  
  // 차단 규칙 로드 - 현재 비활성화
  /*
  fetch("rules.json")
    .then((response) => response.json())
    .then((rules) => {
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
      });
    })
    .catch((error) => {
      console.error("규칙 로드 오류:", error);
    });
    */
});