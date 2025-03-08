chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === "complete") {
    chrome.downloads.search({ id: delta.id }, (results) => {
      if (!results || !results.length) return;
      let item = results[0];
      let fileUrl = item.finalUrl || item.url;
      let filename = item.filename.split(/[/\\]/).pop();

      // 파일을 fetch로 불러와 Blob으로 전환 후 서버에 전송
      fetch(fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
          let formData = new FormData();
          formData.append("file", blob, filename);

          return fetch("http://localhost:5000/scan", {
            method: "POST",
            body: formData,
          });
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.result === "malicious") {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icon48.png",
              title: "악성 파일 감지",
              message: `${filename} 에서 악성 코드가 탐지되었습니다!`,
            });
          }
        })
        .catch((err) => console.error("파일 스캔 오류:", err));
    });
  }
});
