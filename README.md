## 실행 방법 및 테스트

1️⃣ 테스트 환경 준비
```
pip install yara-python psutil
```

2️⃣ 악성코드 실행
```
python rat_malware.py
```

3️⃣ 백신 실행
```
python rat_antivirus.py
```

📌 실행 결과 예상<br>
```
Scanning files for RAT signatures...
Detected RAT in ./rat_malware.py
File scan completed.
Scanning running processes...
RAT detected in running process: python.exe (PID: 1234)
Process scan completed.
```
