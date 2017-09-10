chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.enabled == true) {
        document.body.style.backgroundColor = "red";
    } else {
        document.body.style.backgroundColor = "blue";
    }
});
