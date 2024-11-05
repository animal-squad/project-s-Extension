const toggleButton = document.getElementById("toggleButton");
const submitButton = document.getElementById("submitButton");
const textInput = document.getElementById("textInput");

// 초기화
let isSavingCurrentTab = true;

// 슬라이드 토글 버튼 클릭 시 이벤트 추가
toggleButton.addEventListener("change", () => {
  isSavingCurrentTab = !isSavingCurrentTab;
});

submitButton.addEventListener("click", async () => {
  try {
    const titleText = textInput.value;

    console.log("제목:", titleText);
    console.log(isSavingCurrentTab ? "현재 탭 저장" : "모든 탭 저장");

    chrome.identity.getProfileUserInfo((info) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting user info:", chrome.runtime.lastError);
        return;
      }

      const email = info.email;
      console.log("User Email:", email);
    });

    // 배경 스크립트에 메시지 보내기
    chrome.runtime.sendMessage({
      action: "saveTabs",
      saveCurrentTab: isSavingCurrentTab,
    });
  } catch (error) {
    console.error("버튼 클릭 중 오류 발생:", error);
  }
});