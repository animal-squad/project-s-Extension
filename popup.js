const toggleButton = document.getElementById("toggleButton");
const submitButton = document.getElementById("submitButton");
const textInput = document.getElementById("textInput");
const textArea = document.getElementById("textArea");
// 초기화
let isSavingCurrentTab = true;

// 슬라이드 토글 버튼 클릭 시 이벤트 추가
toggleButton.addEventListener("change", () => {
  // 상태를 반대로 바꿈
  isSavingCurrentTab = !isSavingCurrentTab;
});

// 저장 버튼 (submitButton) 클릭 시 이벤트 추가
submitButton.addEventListener("click", () => {
  const titleText = textInput.value;
  const memoText = textArea.value;

  // 텍스트, 상태 출력
  console.log("제목:", titleText);
  console.log("메모:", memoText);
  console.log(isSavingCurrentTab ? "현재 탭 저장" : "모든 탭 저장");
});
