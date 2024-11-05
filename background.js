chrome.tabs.query({}, (tabs) => {
  const limitedTabs = tabs.slice(0, 10); // 처음 10개 탭만 선택

  limitedTabs.forEach((tab) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content.js"],
      },
      (result) => {
        if (chrome.runtime.lastError) {
          // 스크립팅이 실패한 경우
          console.error(
            `탭 ${tab.id}에서 스크립팅 실패: ${chrome.runtime.lastError.message}`
          );
          chrome.runtime.sendMessage({
            tabId: tab.id,
            html: "Scripting Failed",
          });
        }
      }
    );
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.html) {
    if (sender.tab) {
      // sender.tab이 정의된 경우만 접근
      console.log(`탭 ${sender.tab.id}의 HTML:`, message.html);
    } else {
      console.warn("메시지를 보낸 탭 정보가 없습니다.");
    }
  } else {
    console.warn("메시지가 없습니다.");
  }
});
