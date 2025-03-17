# 🧭 EpochScan: A Next-Gen Trojan Detection System
**Detecting and neutralizing Emotet, SocGholish, and IcedID with AI-powered security.**

## 📜 Our EpochScan ?
EpochScan is an advanced security tool designed to **detect and mitigate Trojan malware**, specifically targeting *Emotet, SocGholish, and IcedID*. Developed by the **"History of Security"** team, this project integrates **machine learning, YARA rules, and real-time behavioral analysis** to provide next-generation protection against evolving cyber threats.

## 🗃️ Features  
🔗 **AI-Powered Malware Detection** – Scans executables using machine learning models  
🔗 **Trojan-Specific Protection** – Focuses on detecting Emotet, SocGholish, and IcedID  
🔗 **Real-Time File Execution Monitoring** – Prevents execution of malicious files  
🔗 **Chrome Extension Integration** – Blocks suspicious downloads and URLs  
🔗 **Flask-Based Scan API** – Local malware scanning with YARA rule validation

## 🔧 Installation  
### 1️⃣ **Clone the Repository**  
```bash
git clone https://github.com/YOUR-USERNAME/EpochScan.git
cd EpochScan
```

### 2️⃣ **Set up the python environment**
```bash
pip install -r requirements.txt
```

### 3️⃣ **Run the Flask server**
```bash
python server.py
```

### 4️⃣ **Load the Chrome Extension**
1. Open chrome://extensions/in your browser
2. Enable Developer Mode
3. Click *Load Unpacked* and select the chrome_extension/folder

## ⌛️ How it works
1. File Execution Monitoring
    - `monitor.py` detects when a user attempts to execute a file  
	- The file is analyzed for malicious indicators before running
2. Download Protection via Chrome Extension
	- Detects and blocks suspicious files before they are executed  
	- Uses a combination of YARA rules and AI analysis
3. AI-Powered Threat Detection
	- Files are scanned using a pre-trained machine learning model  
	- If a file is deemed malicious, the system prevents execution

## Directory

```
project/
├── chrome_extension/        # Chrome 확장 프로그램 소스
│   ├── background.js        # 백그라운드 스크립트
│   ├── contentscript.js     # 콘텐츠 스크립트
│   ├── manifest.json        # 확장 프로그램 매니페스트
│   ├── monitor.py           # 네이티브 메시징 스크립트
│   ├── monitor_host_template.json # 네이티브 메시징 호스트 설정 템플릿
│   ├── popup.html           # 팝업 UI
│   ├── popup.js             # 팝업 스크립트
│   └── icons/               # 아이콘 이미지
│       ├── vaccine.png      # 백신 아이콘
│       └── alert.png        # 경고 아이콘
├── malware_detector.py      # 악성코드 탐지 모듈
├── server.py                # Flask 서버
├── setup.py                 # 환경 설정 스크립트
├── requirements.txt         # 필요한 패키지 목록
└── uploads/                 # 업로드된 파일 저장 디렉토리
```

## 🖥️ Demo

Uploading 테스트 백신 동작.mov…

## 🤝 Contributing
We welcome contributions! Feel free to open issues and submit pull requests.
