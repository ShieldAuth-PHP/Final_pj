document.getElementById("scan").addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "manual_scan" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ 메시지 전송 오류:", chrome.runtime.lastError.message);
      return;
    }
    console.log("🔍 검사 요청 전송됨:", response);
  });
});

chrome.runtime.onMessage.addListener((message) => {
  console.log("📩 popup.js에서 메시지 수신:", message);

  if (message.action === "malware_detected") {
    document.getElementById("status").textContent = "⚠️ Malware Detected!";
    document.getElementById("status").style.color = "red";
  } else if (message.action === "scan_complete") {
    alert("🔍 정밀 검사가 완료되었습니다. 악성코드가 없습니다.");
    document.getElementById("status").textContent = "✅ No Threats Detected";
    document.getElementById("status").style.color = "green";
  }
});
