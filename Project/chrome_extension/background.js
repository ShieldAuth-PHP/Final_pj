chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === "complete") {
    chrome.downloads.search({ id: delta.id }, (results) => {
      if (!results || !results.length) return;
      let item = results[0];
      let filename = item.filename.split(/[/\\]/).pop();

      // Use download API to get file contents and send info to server
      chrome.downloads.download({
        url: item.finalUrl || item.url,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        let formData = new FormData();
        formData.append("filename", filename);
        formData.append("downloadId", downloadId);

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
              message: `${filename} 에서 악성 코드가 탐지되었습니다!`,
            });
          }
        })
        .catch((err) => console.error("파일 스캔 오류:", err));
      });
    });
  }
});
