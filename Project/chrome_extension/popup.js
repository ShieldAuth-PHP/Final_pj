// 디버그 메시지 출력 헬퍼 함수 추가
function logDebug(message) {
    const debugElem = document.getElementById("debug-info");
    debugElem.textContent += message + "\n";
}

document.getElementById("scan").addEventListener("click", async function () {
  try {
    logDebug('=== 웹 페이지 스캔 시작 ===');
    
    // 현재 활성 탭의 정보를 가져옴
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    
    logDebug('⚪ 활성 탭 ID: ' + tab.id);

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
    
    const text = await response.text();
    console.log('=== 웹 페이지 스캔 결과 ===');
    logDebug('=== 웹 페이지 스캔 결과 ===');
    console.log('⚪ 서버 응답 확인:', text ? 'O' : 'X');
    logDebug('⚪ 서버 응답 확인: ' + (text ? 'O' : 'X'));
    
    const data = text ? JSON.parse(text) : {};
    console.log('⚪ JSON 파싱 성공:', Object.keys(data).length > 0 ? 'O' : 'X');
    logDebug('⚪ JSON 파싱 성공: ' + (Object.keys(data).length > 0 ? 'O' : 'X'));
    console.log('⚪ 스캔 결과:', {
      '악성코드 감지': data.result === "malicious" ? 'O' : 'X',
      '매칭된 YARA 룰': data.matches ? data.matches.join(", ") : '없음',
      '스캔된 URL': result.url,
      '스캔된 스크립트 수': result.scripts.length
    });
    logDebug('⚪ 스캔 결과: ' + (data.result === "malicious" ? '악성 감지' : '정상'));
    
    // YARA 룰과 연동되어 악성이 감지될 때만 alert 발생, 아니면 안전함을 알림
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
});

// 파일 드래그 앤 드랍 이벤트 추가
const dropZone = document.getElementById("drop-zone");

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
    console.log('=== 파일 스캔 결과 ===');
    logDebug('=== 파일 스캔 결과 ===');
    console.log('⚪ 서버 응답 확인:', text ? 'O' : 'X');
    logDebug('⚪ 서버 응답 확인: ' + (text ? 'O' : 'X'));
    
    const data = text ? JSON.parse(text) : {};
    console.log('⚪ JSON 파싱 성공:', Object.keys(data).length > 0 ? 'O' : 'X');
    logDebug('⚪ JSON 파싱 성공: ' + (Object.keys(data).length > 0 ? 'O' : 'X'));
    console.log('⚪ 스캔 결과:', {
      '파일명': file.name,
      '파일 크기': `${(file.size / 1024).toFixed(2)}KB`,
      '악성코드 감지': data.result === "malicious" ? 'O' : 'X',
      '매칭된 YARA 룰': data.matches ? data.matches.join(", ") : '없음'
    });
    logDebug('⚪ 스캔 결과 - ' + file.name + ': ' + (data.result === "malicious" ? '악성 감지' : '정상'));
    
    console.log('파일 스캔 서버 응답:', text);
    
    console.log('파일 스캔 결과:', {
      파일명: file.name,
      결과: data.result,
      매칭된_룰: data.matches,
      전체_데이터: data
    });
    
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

document.addEventListener('DOMContentLoaded', function() {
    // 통계 업데이트
    updateStats();

    // 버튼 이벤트 리스너
    document.getElementById('scanPage').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "scanPage"});
        });
        
        // 스캔 버튼 비활성화 및 로딩 표시
        const button = document.getElementById('scanPage');
        button.disabled = true;
        button.textContent = "검사 중...";
        
        // 3초 후 버튼 복구 (실제로는 스캔 완료 이벤트에 따라 처리)
        setTimeout(() => {
            button.disabled = false;
            button.textContent = "현재 페이지 검사";
        }, 3000);
    });

    // 로그 보기 버튼
    document.getElementById('viewLogs').addEventListener('click', function() {
        chrome.tabs.create({url: 'logs.html'});
    });
});

// 통계 업데이트 함수
function updateStats() {
    // Chrome storage에서 통계 데이터 가져오기
    chrome.storage.local.get(['scannedFiles', 'detectedThreats'], function(result) {
        document.getElementById('scanned-files').textContent = result.scannedFiles || 0;
        document.getElementById('detected-threats').textContent = result.detectedThreats || 0;
        
        // 위협 발견 시 상태 표시 변경
        const statusIndicator = document.querySelector('.status-indicator');
        if (result.detectedThreats > 0) {
            statusIndicator.classList.remove('safe');
            statusIndicator.classList.add('warning');
            statusIndicator.querySelector('.status-text').textContent = '보안 상태: 위협 감지됨';
        }
    });
}
