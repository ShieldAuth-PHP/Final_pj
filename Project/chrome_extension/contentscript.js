function checkForMaliciousScripts() {
  document.querySelectorAll("script").forEach((script) => {
    let scriptContent = script.innerText || script.textContent;

    if (!scriptContent) return;

    // 🚀 Flask 서버로 스크립트 내용 전송하여 AI 기반 분석
    fetch("http://localhost:5000/scan_script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: scriptContent }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.prediction === "malicious") {
          console.warn("🚨 악성 스크립트 탐지:", scriptContent);
          chrome.runtime.sendMessage({ action: "malicious_script_detected" });
          script.remove();
        }
      })
      .catch((err) => console.error("스크립트 스캔 오류:", err));
  });
}

// ✅ 2초마다 반복적으로 검사 실행
setInterval(checkForMaliciousScripts, 2000);
