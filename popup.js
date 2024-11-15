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

    // 현재 창의 ID를 가져와 그 창에 속한 탭만 쿼리
    const windowId = await new Promise((resolve) => {
      chrome.windows.getCurrent((window) => resolve(window.id));
    });

    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ windowId }, (tabs) => resolve(tabs));
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
                    content: "", // content: result[0]?.result || "",
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

    const responseText = await response.text(); // 응답을 텍스트로 받음
    console.log("응답 원문 데이터:", responseText);

    if (response.status === 401) {
      alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      chrome.tabs.create({
        url: "https://www.link-bucket.animal-squad.uk/api/auth/google",
      });
      return;
    }

    if (response.status === 201) {
      // 저장 성공
      submitButton.innerText = "저장 완료";
      submitButton.style.backgroundColor = "#41A332"; // 초록색으로 변경
      submitButton.style.color = "white";

      // 2초 후 원래 상태로 복원
      setTimeout(() => {
        submitButton.innerText = "저장";
        submitButton.style.backgroundColor = ""; // 원래 색상으로 복원
        submitButton.style.color = "";
      }, 2000);
    } else {
      // 저장 실패 (초기 상태로 복원)
      console.error("저장 실패:", responseText);
      submitButton.innerText = "저장";
    }
  } catch (error) {
    console.error("오류 발생:", error); // 오류 로그
  } finally {
    // 버튼 활성화
    submitButton.disabled = false;
  }
});
