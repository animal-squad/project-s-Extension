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
  // 버튼 비활성화
  submitButton.disabled = true;
  submitButton.innerText = "저장 중..."; // 사용자에게 저장 중이라는 메시지를 표시

  try {
    const titleText = textInput.value;

    const info = await new Promise((resolve, reject) => {
      chrome.identity.getProfileUserInfo((info) => {
        if (chrome.runtime.lastError) {
          reject("Error getting user info: " + chrome.runtime.lastError);
        } else {
          resolve(info);
        }
      });
    });

    const email = info.email;

    if (!email) {
      alert("브라우저에 로그인되어있지 않습니다. 먼저 로그인해주세요.");
      return;
    }

    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => resolve(tabs));
    });

    const selectedTabs = isSavingCurrentTab
      ? [tabs.find((tab) => tab.active)]
      : tabs.slice(0, 10);

    // HTML 콘텐츠 수집, 실패한 경우 빈 문자열 설정
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
                    content: "", // 실패한 경우 빈 문자열로 설정
                  });
                } else {
                  resolve({
                    URL: tab.url,
                    content: result[0]?.result || "",
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

    if (response.status === 401) {
      alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      chrome.tabs.create({
        url: "https://www.link-bucket.animal-squad.uk/api/auth/google",
      });
      return;
    }

    const result = await response.json();
    console.log("응답 데이터:", result);

  } catch (error) {
    console.error("저장 중 오류 발생:", error);
  } finally {
    // 버튼 활성화 및 원래 텍스트로 복원
    submitButton.disabled = false;
    submitButton.innerText = "저장";
  }
});
