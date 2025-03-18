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

// 다운로드한 파일 스캔 함수 - 수정
function scanDownloadedFile(downloadItem) {
  console.log("📥 새 파일 다운로드 감지:", downloadItem.filename);
  
  // 다운로드가 완료될 때까지 대기
  if (downloadItem.state !== 'complete') {
    return;
  }
  
  console.log("✅ 다운로드 완료, 스캔 시작:", downloadItem.filename);
  
  // 로컬 파일에 접근할 수 없으므로 파일 경로를 서버로 전송
  // Chrome 확장 프로그램은 보안상의 이유로 로컬 파일 시스템에 직접 접근할 수 없음
  fetch("http://localhost:5000/scan", {
    method: "POST",
    body: JSON.stringify({
      action: "scan_file",
      filepath: downloadItem.filename,
      downloadId: downloadItem.id
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then(response => response.json())
  .then(data => {
    console.log("🔍 스캔 결과:", data);
    
    if (data.prediction === "malicious") {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/alert.png",
        title: "악성코드 감지!",
        message: `파일 '${downloadItem.filename}'에서 악성코드가 발견되었습니다.`,
      });
      
      // 이벤트 페이지나 팝업이 열려있을 때만 메시지 수신 가능
      try {
        chrome.runtime.sendMessage({ action: "malware_detected" });
      } catch (error) {
        console.log("메시지 전송 실패 (수신자 없음)");
      }
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/vaccine.png",
        title: "파일 스캔 완료",
        message: `파일 '${downloadItem.filename}'은 안전합니다.`,
      });
      
      try {
        chrome.runtime.sendMessage({ action: "scan_complete" });
      } catch (error) {
        console.log("메시지 전송 실패 (수신자 없음)");
      }
    }
  })
  .catch(err => {
    console.error("파일 스캔 오류:", err);
    try {
      chrome.runtime.sendMessage({ action: "scan_error" });
    } catch (error) {
      console.log("메시지 전송 실패 (수신자 없음)");
    }
  });
}

// 파일 스캔 요청 처리 (수동 검사용)
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
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/vaccine.png",
          title: "스캔 완료",
          message: "검사한 모든 파일이 안전합니다.",
        });
        
        chrome.runtime.sendMessage({ action: "scan_complete" });
      }
    })
    .catch((err) => {
      console.error("스캔 요청 오류:", err);
      chrome.runtime.sendMessage({ action: "scan_error" });
    });
}

// 메시지 리스너 등록 - 수정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 background.js에서 메시지 수신:", message);

  if (message.action === "manual_scan") {
    console.log("🔍 수동 스캔 요청 수신");
    scanFiles();
    sendResponse({ status: "scanning" });
    return true; // 비동기 응답을 위해 true 반환
  }
  
  if (message.action === "malicious_script_detected") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/alert.png",
      title: "악성 스크립트 감지!",
      message: "웹페이지에서 악성 스크립트가 감지되었습니다.",
    });
    sendResponse({ status: "notification_created" }); // 응답 추가
    return true;
  }

  // 알 수 없는 메시지에 대한 기본 응답 추가
  sendResponse({ status: "unknown_action" });
  return true;
});

// 확장 프로그램이 설치되면 Python 모니터링 스크립트 실행
chrome.runtime.onInstalled.addListener(() => {
  console.log("🚀 확장 프로그램이 설치됨");
  startMonitorScript();
  
  // 다운로드 이벤트 리스너 등록
  chrome.downloads.onCreated.addListener(downloadItem => {
    console.log("📥 다운로드 시작됨:", downloadItem.filename);
  });
  
  // 다운로드 완료 시 스캔 실행
  chrome.downloads.onChanged.addListener(downloadDelta => {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
      chrome.downloads.search({id: downloadDelta.id}, results => {
        if (results && results.length > 0) {
          scanDownloadedFile(results[0]);
        }
      });
    }
  });
  
  // 차단 규칙 로드 - 기존 규칙 제거 후 새 규칙 추가
  fetch("rules.json")
    .then((response) => response.json())
    .then((rules) => {
      chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        let existingRuleIds = existingRules.map(rule => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
          addRules: rules
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("규칙 업데이트 오류:", chrome.runtime.lastError.message);
          } else {
            console.log("규칙 업데이트 완료");
          }
        });
      });
    })
    .catch((error) => {
      console.error("규칙 로드 오류:", error);
    });
});