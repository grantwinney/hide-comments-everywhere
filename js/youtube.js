chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    toggleElements(document.getElementsByTagName('ytd-comments'), (message.enabled ? "none" : "initial"));
});

document.arrive("ytd-comments", {onceOnly: true}, function() {
    chrome.storage.local.get('enabled', function(result) {
        toggleElements(document.getElementsByTagName('ytd-comments'), (is_extension_enabled(result) ? "none" : "initial"));
    });
});
