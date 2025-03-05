console.log("Malware Scanner Extension Loaded");

// 악성 도메인 리스트 (Emotet, SocGholish, IcedID 관련 도메인)
const MALICIOUS_DOMAINS = [
  "emotet-malware.com",
  "socgholish.com",
  "icedid-banking-trojan.net",
  "icedid-cc-net.com",
  "icedid-c2-manager.ru"
];

// (A) 기존 규칙 제거 후 새 규칙 추가(메인 프레임 접근 차단)
chrome.declarativeNetRequest.updateDynamicRules(
  {
    removeRuleIds: MALICIOUS_DOMAINS.map((_, index) => index + 1),
    addRules: MALICIOUS_DOMAINS.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: domain,
        resourceTypes: ["main_frame"]
      }
    }))
  },
  () => {
    if (chrome.runtime.lastError) {
      console.error("룰 업데이트 중 오류:", chrome.runtime.lastError.message);
    } else {
      console.log("악성 도메인 차단 룰이 업데이트되었습니다.");
    }
  }
);

// (B) 다운로드 이벤트 감시 → 악성 도메인 다운로드 차단
chrome.downloads.onCreated.addListener((downloadItem) => {
  // downloadItem.finalUrl: 최종 다운로드 주소
  const url = downloadItem.finalUrl || downloadItem.url;
  console.log("Download started:", url);

  // URL에 악성 도메인이 포함되어 있는지 확인
  const isMalicious = MALICIOUS_DOMAINS.some((domain) => url.includes(domain));
  if (isMalicious) {
    // (1) 다운로드 취소
    chrome.downloads.cancel(downloadItem.id, () => {
      if (chrome.runtime.lastError) {
        console.error("다운로드 취소 중 오류 발생:", chrome.runtime.lastError.message);
      } else {
        console.log("악성 다운로드가 취소되었습니다:", url);
      }
    });

    // (2) 사용자에게 알림 전송
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "icons/alert.png",
        title: "악성 다운로드 차단",
        message: `다음 URL의 다운로드가 차단되었습니다: ${url}`
      },
      (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error("알림 생성 중 오류:", chrome.runtime.lastError.message);
        }
      }
    );
  }
});