document.getElementById("scan").addEventListener("click", async function () {
  try {
    // 현재 활성 탭의 정보를 가져옴
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    // active 탭에 스크립트 주입하여 페이지 정보를 추출
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const html = document.documentElement.outerHTML;
        const url = window.location.href;
        const scripts = Array.from(document.getElementsByTagName("script"))
          .map(script => script.src)
          .filter(src => src);
        return { html, url, scripts };
      }
    });

    // 서버의 /scan-page API 호출 (formData 사용)
    const formData = new FormData();
    formData.append("url", result.url);
    formData.append("html", result.html);
    formData.append("scripts", JSON.stringify(result.scripts));

    const response = await fetch("http://localhost:5000/scan-page", {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    
    // YARA 룰과 연동되어 악성이 감지될 때만 alert 발생, 아니면 안전함을 알림
    if (data.result === "malicious") {
      alert(`경고: 악성 패턴 감지됨!\n룰: ${data.matches.join(", ")}`);
    } else {
      alert("정상: 악성 코드 감지 없음. 안전한 상태입니다!");
    }
    
  } catch (err) {
    console.error("스캔 중 오류 발생:", err);
    alert("스캔 중 오류가 발생했습니다.");
  }
});

// 파일 드래그 앤 드랍 이벤트 추가
const dropZone = document.getElementById("drop-zone");

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.backgroundColor = "#eef";
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dropZone.style.backgroundColor = "";
});

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropZone.style.backgroundColor = "";
  const files = e.dataTransfer.files;
  if (!files.length) return alert("파일이 감지되지 않았습니다.");
  
  const file = files[0];
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    const response = await fetch("http://localhost:5000/scan", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.result === "malicious") {
      alert(`경고: ${file.name} 에서 악성 코드 감지됨!\n룰: ${data.matches.join(", ")}`);
    } else {
      alert(`${file.name} 은(는) 안전합니다.`);
    }
  } catch (err) {
    console.error("파일 스캔 오류:", err);
    alert("파일 스캔 중 오류가 발생했습니다.");
  }
});
