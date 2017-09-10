function show_enabled_icon() {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png' });
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
};

function show_disabled_icon() {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png' });
    chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)' });
    chrome.browserAction.setBadgeBackgroundColor({ color: [155,155,155,255] });
    chrome.browserAction.setBadgeText({ text: 'X' });
};

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.local.get('enabled', function(result) {
        if (is_extension_enabled(result)) {
            chrome.storage.local.set({'enabled': false}, show_disabled_icon);
            chrome.tabs.sendMessage(tab.id, { enabled: false });
        } else {
            chrome.storage.local.set({'enabled': true}, show_enabled_icon);
            chrome.tabs.sendMessage(tab.id, { enabled: true });
        }
    });
});

window.addEventListener('load', function load(event) {
    chrome.storage.local.get('enabled', function(result) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var isEnabled = is_extension_enabled(result);
            if (isEnabled) {
                show_enabled_icon();
            } else {
                show_disabled_icon();
            }
            chrome.tabs.sendMessage(tabs[0].id, { enabled: isEnabled });
        });
    });
});
