const toggleButton = document.getElementById("toggleButton");

// 초기 상태를 정의
let isSavingCurrentTab = true;

// 체크박스의 상태 변경 이벤트 리스너 추가
toggleButton.addEventListener("change", () => {
  // 상태를 반대로 바꿈
  isSavingCurrentTab = !isSavingCurrentTab;
});
