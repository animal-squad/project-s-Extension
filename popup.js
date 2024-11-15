const submitButton = document.getElementById("submitButton");
const textInput = document.getElementById("textInput");
const currentTabButton = document.getElementById("currentTabButton");
const allTabsButton = document.getElementById("allTabsButton");

// 초기화
let isSavingCurrentTab = true;

// 버튼 활성 상태 관리 함수
const toggleActiveState = (activate, deactivate) => {
  activate.classList.add("active");
  deactivate.classList.remove("active");
};

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

submitButton.addEventListener("click", async () => {
  // 버튼 비활성화
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

    const links = await Promise.all(
      selectedTabs.map(
        (tab) =>
          new Promise((resolve) => {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: () => document.documentElement.outerHTML,
              },
              (result) => {
                if (chrome.runtime.lastError) {
                  console.warn(
                    `탭 ${tab.id}에서 HTML 콘텐츠 가져오기 실패: ${chrome.runtime.lastError.message}`
                  );
                  resolve({
                    URL: tab.url,
                    content: "",
                  });
                } else {
                  resolve({
                    URL: tab.url,
                    content: "",
                  });
                }
              }
            );
          })
      )
    );

    const data = {
      title: titleText || null,
      email,
      links,
    };

    console.log("전송 데이터:", JSON.stringify(data, null, 2));

    const response = await fetch(
      "https://www.link-bucket.animal-squad.uk/api/bucket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    console.log("Status Code:", response.status);

    const responseText = await response.text();
    console.log("응답 원문 데이터:", responseText);

    if (response.status === 401) {
      alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      chrome.tabs.create({
        url: "https://www.link-bucket.animal-squad.uk/api/auth/google",
      });
      return;
    }

    if (response.status === 201) {
      submitButton.innerText = "저장 완료";
      submitButton.style.backgroundColor = "#41A332";
      submitButton.style.color = "white";

      setTimeout(() => {
        submitButton.innerText = "저장";
        submitButton.style.backgroundColor = "";
        submitButton.style.color = "";
      }, 2000);
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
