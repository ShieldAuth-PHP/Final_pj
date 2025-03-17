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

// 확장 프로그램이 설치되면 Python 모니터링 스크립트 실행
chrome.runtime.onInstalled.addListener(() => {
  console.log("🚀 확장 프로그램이 설치됨");
  startMonitorScript();
});
