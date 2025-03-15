function checkForMaliciousScripts() {
  const maliciousKeywords = [
    "atob(",
    "eval(",
    "document.write(",
    "window.location=",
    "innerHTML=", // 추가적인 위험한 코드 패턴 감지
    "setTimeout(", // 실행 지연을 이용한 악성 코드 패턴 감지
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

setInterval(checkForMaliciousScripts, 2000);

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "malware_detected") {
    alert("⚠️ 악성 코드가 탐지되었습니다! 조치가 필요합니다.");
  }
});
