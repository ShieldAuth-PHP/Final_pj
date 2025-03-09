document.addEventListener('DOMContentLoaded', function() {
  // 디버그 메시지 출력 헬퍼 함수
  function logDebug(message) {
      const debugElem = document.getElementById("debug-info");
      if(debugElem) {
          debugElem.textContent += message + "\n";
      }
      console.log(message);
      
      // 로그를 Chrome storage에 저장
      chrome.storage.local.get(['scanLogs'], function(result) {
          const logs = result.scanLogs || [];
          logs.push(message);
          // 최대 1000개의 로그만 유지
          if (logs.length > 1000) {
              logs.shift();
          }
          chrome.storage.local.set({ scanLogs: logs });
      });
  }

  // '현재 페이지 검사' 버튼 이벤트 등록
  const scanPageBtn = document.getElementById('scanPage');
  if (scanPageBtn) {
    scanPageBtn.addEventListener('click', async function () {
      try {
        logDebug('=== 웹 페이지 스캔 시작 ===');
        logDebug('[INFO] Active page scan initiated.');

        // 현재 활성 탭의 정보를 가져옴
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) {
          logDebug('[ERROR] 활성 탭 ID 없음.');
          return;
        }
        logDebug('[INFO] 활성 탭 ID: ' + tab.id);

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
        
        logDebug('[DEBUG] 추출된 URL: ' + result.url);
        logDebug('[DEBUG] HTML 길이: ' + result.html.length);
        logDebug('[DEBUG] 스크립트 수: ' + result.scripts.length);

        // 서버의 /scan-page API 호출
        const formData = new FormData();
        formData.append("url", result.url);
        formData.append("html", result.html);
        formData.append("scripts", JSON.stringify(result.scripts));
        logDebug('[DEBUG] FormData 준비 완료.');

        const response = await fetch("http://localhost:5000/scan-page", {
          method: "POST",
          body: formData,
        });
        
        // 서버 응답 파싱 후 (예시)
        const text = await response.text();
        logDebug('[DEBUG] Raw server response: ' + text);
        logDebug('⚪ 서버 응답 확인: ' + (text ? 'O' : 'X'));

        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
          logDebug('[DEBUG] 파싱된 JSON: ' + JSON.stringify(data, null, 2));
        } catch (e) {
          logDebug("[ERROR] JSON 파싱 에러: " + e.message);
        }

        logDebug('⚪ 스캔 결과: ' + (data.result === "malicious" ? '악성 감지됨' : '정상'));

        // 웹페이지 관련 정보 출력 (예: URL, HTML 길이, 스크립트 수)
        if (data.url) {
          logDebug('[INFO] 스캔된 페이지 URL: ' + data.url);
        }
        if (data.html) {
          logDebug('[INFO] HTML 길이: ' + data.html.length);
        }
        if (data.scripts) {
          try {
            const scripts = JSON.parse(data.scripts);
            logDebug('[INFO] 스크립트 개수: ' + scripts.length);
          } catch (e) {
            logDebug('[INFO] 스크립트 정보: ' + data.scripts);
          }
        }

        // YARA 룰 내용 출력 (combined_rules.yar)
        if (data.rules) {
          // 전체 내용 출력이 너무 길다면, 원하는 길이만 출력하거나 별도 버튼으로 전체보기 처리 가능
          logDebug('[DEBUG] YARA Rules (전체):\n' + data.rules);
        } else {
          logDebug('[INFO] YARA 룰 파일 로드 실패 또는 내용 없음.');
        }

        // 매칭된 룰 정보 출력 (있는 경우)
        if (data.result === "malicious") {
          if (data.matches && data.matches.length > 0) {
            logDebug('[DEBUG] Matched YARA rules: ' + data.matches.join(', '));
          } else {
            logDebug('[INFO] 매칭된 YARA 룰이 없습니다.');
          }
        } else {
          logDebug('[INFO] 안전한 상태입니다.');
        }
        
        if (data.result === "malicious") {
          alert(`경고: 악성 패턴 감지됨!\n룰: ${data.matches.join(", ")}`);
        } else {
          alert("정상: 악성 코드 감지 없음. 안전한 상태입니다!");
        }
      } catch (err) {
        logDebug("[ERROR] 스캔 중 오류 발생: " + err.message);
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
      if (!file) {
        logDebug('[ERROR] 드롭된 파일이 없습니다.');
        return;
      }
      
      logDebug('[INFO] 드롭된 파일명: ' + file.name);
      logDebug('[DEBUG] 파일 크기: ' + file.size + ' bytes');
      
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await fetch("http://localhost:5000/scan", {
          method: "POST",
          body: formData,
        });

        const text = await response.text();
        logDebug('[DEBUG] Raw file scan response: ' + text);
        logDebug('⚪ 파일 스캔 서버 응답 확인: ' + (text ? 'O' : 'X'));
        const data = text ? JSON.parse(text) : {};
        logDebug('[DEBUG] 파일 스캔 JSON: ' + JSON.stringify(data));
        logDebug('⚪ 파일 스캔 결과 - ' + file.name + ': ' + (data.result === "malicious" ? '악성 감지됨' : '정상'));
        
        if (data.result === "malicious") {
          alert(`경고: ${file.name} 에서 악성 코드 감지됨!\n룰: ${data.matches.join(", ")}`);
        } else {
          alert(`${file.name} 은(는) 안전합니다.`);
        }
      } catch (err) {
        logDebug("[ERROR] 파일 스캔 오류: " + err.message);
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
      logDebug('[INFO] 통계 업데이트 완료.');
    });
  }
});
