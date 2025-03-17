# Emotet / SocGholish / IcedID 최적화 Chrome Extension 백신 개발

## 프로젝트 구조

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

## 기능

- 웹페이지의 악성 스크립트 실시간 탐지
- 다운로드된 파일의 악성코드 검사
- AI 기반 악성코드 분석
- 알림 시스템


## 팀 개발 가이드

1. **환경 설정**:
- 모든 팀원은 설정 스크립트를 실행하여 동일한 환경을 구성합니다.
- 개인별로 Chrome 확장 프로그램 ID는 다를 수 있으므로 각자 설정합니다.

2. **코드 수정 시 주의사항**:
- 경로나 환경 설정을 하드코딩하지 않습니다.
- 경로 설정에는 템플릿 또는 상대 경로를 사용합니다.

3. **테스트**:
- 확장 프로그램 설치 후 콘솔 로그를 확인합니다(`chrome://extensions` → 세부정보 → 백그라운드 페이지 검사).
- 서버 로그를 모니터링하여 요청/응답을 확인합니다.

4. **패키지 추가**:
- 새 패키지를 추가할 경우 `requirements.txt`를 업데이트합니다.
- 팀원들에게 변경 사항을 알립니다.

---

## 확장 프로그램 문제 해결 체크리스트

### 기본 사항
- [ ] manifest.json에 content_scripts 설정이 있는지 확인
- [ ] monitor.py 파일에 실행 권한이 있는지 확인
- [ ] Flask 서버가 실행 중인지 확인 (http://localhost:5000)
- [ ] monitor_host.json 파일의 경로가 monitor.py의 실제 경로와 일치하는지 확인
- [ ] monitor_host.json의 확장 프로그램 ID가 현재 설치된 ID와 일치하는지 확인

## 에러 확인 방법
1. Chrome 확장 프로그램 콘솔 열기
- chrome://extensions 방문
- 해당 확장 프로그램 "세부정보" 클릭
- "백그라운드 페이지 검사" 클릭
- 콘솔 탭에서 오류 확인

2. Flask 서버 로그 확인
- 서버 실행 창에서 오류 메시지 확인

3. 파일 권한 확인
- monitor.py가 실행 가능한지 확인
- 필요한 디렉토리에 쓰기 권한이 있는지 확인

## 간단한 해결책
- Chrome 확장 프로그램 새로고침
- Flask 서버 재시작
- monitor_host.json 파일 이름이 "com.example.monitor.json"인지 확인