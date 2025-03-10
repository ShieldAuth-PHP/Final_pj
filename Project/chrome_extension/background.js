// 스캔 목적으로 시작된 다운로드 ID를 저장하는 Set
const scanningDownloads = new Set();

chrome.downloads.onChanged.addListener((delta) => {
  // 이미 스캔 목적으로 시작된 다운로드면 무시
  if (scanningDownloads.has(delta.id)) return;

  if (delta.state && delta.state.current === "complete") {
    chrome.downloads.search({ id: delta.id }, (results) => {
      if (!results || !results.length) return;
      let item = results[0];
      let filename = item.filename.split(/[/\\]/).pop();

      // 재다운로드를 시작하여 스캔 수행
      chrome.downloads.download({
        url: item.finalUrl || item.url,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        // 재다운로드한 항목은 추후 다시 스캔하지 않도록 등록
        scanningDownloads.add(downloadId);
        
        let formData = new FormData();
        formData.append("filename", filename);
        formData.append("downloadId", downloadId);
        formData.append("file_path", item.filename);

        fetch("http://localhost:5000/scan", {
          method: "POST",
          body: formData,
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.result === "malicious") {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/alert.png",
              title: "악성 파일 감지",
              message: `${filename} 파일이 악성으로 의심됩니다.\n즉시 삭제하시기를 권장드립니다!`,
            });
            chrome.downloads.erase({ id: downloadId });
          }
          // 스캔 완료 후 필요 시 등록 해제 (검사 후 재스캔 가능하게 할지 결정)
          // scanningDownloads.delete(downloadId);
        })
        .catch((err) => {
          console.error("파일 스캔 오류:", err);
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/error.png",
            title: "스캔 오류",
            message: "파일 검사 중 오류가 발생했습니다.",
          });
          // 오류 발생시에도 등록 해제가 필요하면
          // scanningDownloads.delete(downloadId);
        });
      });
    });
  }
});

// 웹페이지 스캔 메시지 리스너 추가
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    const formData = new FormData();
    formData.append('url', message.content.url);
    formData.append('html', message.content.html);
    formData.append('scripts', JSON.stringify(message.content.scripts));

    fetch("http://localhost:5000/scan-page", {
      method: "POST",
      body: formData,
    })
    .then((response) => response.text()) // 응답을 text로 받아서
    .then((text) => {
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("JSON 파싱 에러:", e);
      }
      if (data.result === "malicious") {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/alert.png",
          title: "위험한 웹페이지 감지",
          message: `현재 페이지에서 잠재적인 위험이 감지되었습니다!`,
        });
      }
    })
    .catch((err) => console.error("페이지 스캔 오류:", err));
  }
});

// 메시지 리스너: 위협 감지 알림 전송
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_NOTIFICATION') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/alert.png',
            title: message.content.title,
            message: message.content.message
        });
    }
});
