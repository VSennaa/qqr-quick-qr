function startScanner(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['jsQR.js', 'content.js']
  });
}

chrome.action.onClicked.addListener((tab) => {
  startScanner(tab.id);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse({ img: dataUrl });
    });
    return true; 
  }
});