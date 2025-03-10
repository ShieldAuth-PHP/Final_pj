// 웹 워커 파일 (worker.js)
self.onmessage = async function(e) {
    const { url, html, scripts } = e.data;
    
    try {
        const formData = new FormData();
        formData.append('url', url);
        formData.append('html', html);
        formData.append('scripts', JSON.stringify(scripts));

        const response = await fetch("http://localhost:5000/scan-page", {
            method: "POST",
            body: formData
        });
        
        const result = await response.text();
        self.postMessage({ success: true, data: result });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};