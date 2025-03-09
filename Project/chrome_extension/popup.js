document.addEventListener('DOMContentLoaded', function() {
  // 디버그 메시지 출력 헬퍼 함수
  function logDebug(message) {
      const debugElem = document.getElementById("debug-info");
      if(debugElem) {
          debugElem.textContent += message + "\n";
      }
  }

  // '현재 페이지 검사' 버튼 이벤트 등록
  const scanPageBtn = document.getElementById('scanPage');
  if (scanPageBtn) {
    scanPageBtn.addEventListener('click', async function () {
      try {
        logDebug('=== 웹 페이지 스캔 시작 ===');
        // 현재 활성 탭의 정보를 가져옴
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;
        logDebug('⚪ 활성 탭 ID: ' + tab.id);

        // active 탭에 스크립트를 주입하여 페이지 정보를 추출
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

        // 서버의 /scan-page API 호출
        const formData = new FormData();
        formData.append("url", result.url);
        formData.append("html", result.html);
        formData.append("scripts", JSON.stringify(result.scripts));

        const response = await fetch("http://localhost:5000/scan-page", {
          method: "POST",
          body: formData,
        });
        
        const text = await response.text();
        logDebug('⚪ 서버 응답 확인: ' + (text ? 'O' : 'X'));
        const data = text ? JSON.parse(text) : {};
        logDebug('⚪ JSON 파싱 성공: ' + (Object.keys(data).length > 0 ? 'O' : 'X'));
        logDebug('⚪ 스캔 결과: ' + (data.result === "malicious" ? '악성 감지' : '정상'));
        
        if (data.result === "malicious") {
          alert(`경고: 악성 패턴 감지됨!\n룰: ${data.matches.join(", ")}`);
        } else {
          alert("정상: 악성 코드 감지 없음. 안전한 상태입니다!");
        }
      } catch (err) {
        console.error("스캔 중 오류 발생:", err);
        logDebug("스캔 중 오류 발생: " + err.message);
        alert("스캔 중 오류가 발생했습니다: " + err.message);
      }
      // 최종적으로 버튼 상태 복원
      scanPageBtn.disabled = false;
      scanPageBtn.textContent = "현재 페이지 검사";
    });
  } else {
    console.error("scanPage 버튼을 찾지 못했습니다.");
  }

  // '로그 보기' 버튼 이벤트 등록
  const viewLogsBtn = document.getElementById('viewLogs');
  if (viewLogsBtn) {
    viewLogsBtn.addEventListener('click', function() {
      chrome.tabs.create({url: 'logs.html'});
    });
  } else {
    console.error("viewLogs 버튼을 찾지 못했습니다.");
  }

  // 파일 드래그 앤 드랍 이벤트 등록
  const dropZone = document.getElementById("drop-zone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = "#f0f0f0";
    });

    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = "transparent";
    });

    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = "transparent";
      logDebug('=== 파일 스캔 시작 ===');
      
      const file = e.dataTransfer.files[0];
      if (!file) return;
      
      logDebug('⚪ 파일명: ' + file.name);
      
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await fetch("http://localhost:5000/scan", {
          method: "POST",
          body: formData,
        });

        const text = await response.text();
        logDebug('⚪ 서버 응답 확인: ' + (text ? 'O' : 'X'));
        const data = text ? JSON.parse(text) : {};
        logDebug('⚪ JSON 파싱 성공: ' + (Object.keys(data).length > 0 ? 'O' : 'X'));
        logDebug('⚪ 스캔 결과 - ' + file.name + ': ' + (data.result === "malicious" ? '악성 감지' : '정상'));
        
        if (data.result === "malicious") {
          alert(`경고: ${file.name} 에서 악성 코드 감지됨!\n룰: ${data.matches.join(", ")}`);
        } else {
          alert(`${file.name} 은(는) 안전합니다.`);
        }
      } catch (err) {
        console.error("파일 스캔 오류:", err);
        logDebug("파일 스캔 오류: " + err.message);
        alert("파일 스캔 중 오류가 발생했습니다: " + err.message);
      }
    });
  } else {
    console.error("drop-zone 요소를 찾지 못했습니다.");
  }

  // 통계 업데이트 함수 실행
  updateStats();
  
  // 통계 업데이트 함수
  function updateStats() {
    chrome.storage.local.get(['scannedFiles', 'detectedThreats'], function(result) {
      const scannedElem = document.getElementById('scanned-files');
      const threatsElem = document.getElementById('detected-threats');
      if (scannedElem) scannedElem.textContent = result.scannedFiles || 0;
      if (threatsElem) threatsElem.textContent = result.detectedThreats || 0;
      
      const statusIndicator = document.querySelector('.status-indicator');
      if (statusIndicator) {
        if (result.detectedThreats > 0) {
          statusIndicator.classList.remove('safe');
          statusIndicator.classList.add('warning');
          const statusText = statusIndicator.querySelector('.status-text');
          if (statusText) statusText.textContent = '보안 상태: 위협 감지됨';
        }
      }
    });
  }
});
