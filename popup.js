const toggleButton = document.getElementById("toggleButton");
const submitButton = document.getElementById("submitButton");
const textInput = document.getElementById("textInput");
const textArea = document.getElementById("textArea");

// 초기화
let isSavingCurrentTab = true;

// 슬라이드 토글 버튼 클릭 시 이벤트 추가
toggleButton.addEventListener("change", () => {
  isSavingCurrentTab = !isSavingCurrentTab;
});

// 저장 버튼 (submitButton) 클릭 시 이벤트 추가
submitButton.addEventListener("click", async () => {
  try {
    const titleText = textInput.value;
    const memoText = textArea.value;

    console.log("제목:", titleText);
    console.log("메모:", memoText);
    console.log(isSavingCurrentTab ? "현재 탭 저장" : "모든 탭 저장");

    chrome.identity.getProfileUserInfo((info) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting user info:", chrome.runtime.lastError);
        return;
      }

      const email = info.email;  
      console.log("User Email:", email);
    });
  } catch (error) {
    console.error("버튼 클릭 중 오류 발생:", error);
  }
});
