const submitButton = document.getElementById("submitButton");
const textInput = document.getElementById("textInput");
const currentTabButton = document.getElementById("currentTabButton");
const allTabsButton = document.getElementById("allTabsButton");
const closeTabsButton = document.getElementById("closeTabsCheckbox");
const homepageLink = document.getElementById("homepageLink");

// 초기화
let isSavingCurrentTab = true;
let isClosingTab = false;

// 버튼 활성 상태 관리 함수
const toggleActiveState = (activate, deactivate) => {
  activate.classList.add("active");
  deactivate.classList.remove("active");
};

closeTabsButton.addEventListener("click", () => {
  if (isClosingTab) {
    isClosingTab = false;
    console.log("탭 닫지 않기");
  } else {
    isClosingTab = true;
    console.log("탭 닫기");
  }
});

// 버튼 클릭 이벤트 설정
currentTabButton.addEventListener("click", () => {
  isSavingCurrentTab = true;
  toggleActiveState(currentTabButton, allTabsButton);
  console.log("현재 탭 저장 모드");
});

allTabsButton.addEventListener("click", () => {
  isSavingCurrentTab = false;
  toggleActiveState(allTabsButton, currentTabButton);
  console.log("모든 탭 저장 모드");
});

homepageLink.addEventListener("click", () => {
  window.open("https://www.linket.site/", "_blank");
});

submitButton.addEventListener("click", async () => {
  if (submitButton.innerText === "링킷 홈페이지") {
    window.open("https://www.linket.site/", "_blank");
    return;
  }

  submitButton.disabled = true;
  submitButton.innerText = "저장 중...";

  try {
    const titleText = textInput.value;

    const info = await new Promise((resolve, reject) => {
      chrome.identity.getProfileUserInfo((info) => {
        if (chrome.runtime.lastError) {
          console.error("프로필 정보 요청 오류:", chrome.runtime.lastError);
          reject("Error getting user info: " + chrome.runtime.lastError);
        } else {
          console.log("프로필 정보:", info);
          resolve(info);
        }
      });
    });

    const email = info.email;

    if (!email) {
      alert("브라우저에 로그인되어있지 않습니다. 먼저 로그인해주세요.");
      return;
    }

    const windowId = await new Promise((resolve) => {
      chrome.windows.getCurrent((window) => resolve(window.id));
    });

    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ windowId }, (tabs) => resolve(tabs));
    });

    const selectedTabs = isSavingCurrentTab
      ? [tabs.find((tab) => tab.active)]
      : tabs.slice(0, 10);

    const links = selectedTabs.map((tab) => ({
      URL: tab.url,
      content: "", // 간단히 URL만 포함
    }));

    const data = {
      title: titleText || null,
      email,
      links,
    };

    console.log("전송 데이터:", JSON.stringify(data, null, 2));

    // 데이터 전송
    const response = await fetch("https://www.linket.site/api/bucket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Status Code:", response.status);

    const responseText = await response.text();
    console.log("응답 원문 데이터:", responseText);

    if (response.status === 401) {
      alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      chrome.tabs.create({
        url: "https://www.linket.site/api/auth/google",
      });
      return;
    }

    if (response.status === 201) {
      submitButton.innerText = "저장 완료";
      submitButton.style.backgroundColor = "#41A332";
      submitButton.style.color = "white";

      if (isClosingTab) {
        const tabIdsToClose = selectedTabs.map((tab) => tab.id);
        chrome.tabs.remove(tabIdsToClose, () => {
          console.log("사용된 탭이 요청 후 닫혔습니다.");
        });
      }
      // 1. 링크 열기
      const newTab = await new Promise((resolve) => {
        chrome.tabs.create({ url: "https://www.linket.site/" }, (tab) =>
          resolve(tab)
        );
      });

      console.log("링킷 홈페이지로 새 탭 열림:", newTab);

      // 1초 후 버튼 업데이트
      setTimeout(() => {
        submitButton.innerText = "링킷 홈페이지";
        submitButton.style.backgroundColor = "#FFD700"; // 노란색
        submitButton.style.color = "#000"; // 검정색 글자
        submitButton.disabled = false;

        // 기존 이벤트 방지
        submitButton.replaceWith(submitButton.cloneNode(true));
        const newButton = document.getElementById("submitButton");
        newButton.addEventListener("click", () => {
          window.open("https://www.linket.site/", "_blank");
        });
      }, 1000);
    } else {
      console.error("저장 실패:", responseText);
      submitButton.innerText = "저장";
    }
  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    submitButton.disabled = false;
  }
});
