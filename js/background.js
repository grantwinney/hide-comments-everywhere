function show_enabled_icon() {
    chrome.browserAction.setIcon({ path: "images/hide-comments-32.png" });
    chrome.browserAction.setTitle({ title: "" });
};

function show_disabled_icon() {
    chrome.browserAction.setIcon({ path: "images/hide-comments-bw-32.png" });
    chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + " (disabled)" });
}

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.browserAction.setBadgeText({ text: "1", tabId: tab.id });

    chrome.storage.local.get('enabled', function(result) {
        if (result == undefined || result.enabled == undefined || result.enabled == true) {
            chrome.storage.local.set({'enabled': false}, show_disabled_icon);
        } else {
            chrome.storage.local.set({'enabled': true}, show_enabled_icon);
        }
    });
    //
    // chrome.tabs.sendMessage(tab.id, {greeting: "hello"}, function(response) {
    //     console.log(response.farewell);
    // });
});

chrome.storage.local.get('enabled', function(result) {
    if (result == undefined || result.enabled == undefined || result.enabled == true) {
        show_enabled_icon();
    } else {
        show_disabled_icon();
    }
});
