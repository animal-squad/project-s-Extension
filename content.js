// content.js
(function () {
  const htmlContent = document.documentElement.outerHTML;
  chrome.runtime.sendMessage({ html: htmlContent });
})();
