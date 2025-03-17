document.getElementById("scan").addEventListener("click", function () {
  try {
    chrome.runtime.sendMessage({ action: "manual_scan" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("❌ 메시지 전송 오류:", chrome.runtime.lastError.message);
        console.warn("⚠️ 확장 프로그램을 다시 로드해보세요.");
        return;
      }
      console.log("🔍 검사 요청 전송됨:", response);
    });
  } catch (error) {
    console.error("🚨 메시지 전송 중 오류 발생:", error);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  console.log("📩 popup.js에서 메시지 수신:", message);

  if (message.action === "malware_detected") {
    document.getElementById("status").textContent = "⚠️ Malware Detected!";
    document.getElementById("status").style.color = "red";
    alert("🚨 악성 코드가 탐지되었습니다!");
  } else if (message.action === "scan_complete") {
    document.getElementById("status").textContent = "✅ No Threats Detected";
    document.getElementById("status").style.color = "green";
    alert("✅ 클린 상태: 악성코드가 탐지되지 않았습니다.");
  }
});
