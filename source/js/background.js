// A background page is loaded when it is needed, and unloaded when it goes idle. Some examples of events include:
// - The extension is first installed or updated to a new version.
// - The background page was listening for an event, and the event is dispatched.
// - A content script or other extension sends a message.
// - Another view in the extension, such as a popup, calls runtime.getBackgroundPage.
// https://developer.chrome.com/extensions/background_pages


// Fires when a tab is updated.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Tabs/onUpdated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, _tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { event: 'tab_updated' });
    }
});

// Listens for messages from content script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function(message, sender, _sendResponse) {
    if (!sender.tab) {
        return;
    }
    switch(message.event) {
        case 'comments_hidden':
            chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: sender.tab.id });
            chrome.browserAction.setTitle({ title: '', tabId: sender.tab.id });
            break;
        case 'comments_shown':
            chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: sender.tab.id });
            chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: sender.tab.id });
            break;
        default:
            logError(`background script: ${message.event}`);
    }
});

// Fires when user clicks the addon icon in the browser toolbar.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/onClicked
chrome.browserAction.onClicked.addListener(function(tab) {
    toggleComments(tab.id);
});


// Fires when a new browser window is opened.
// Gets latest definitions and enables/disables the popup.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/onCreated
chrome.windows.onCreated.addListener(function() {
    getUpdatedDefinitions();
    chrome.storage.local.get('one_click_option', function(result) {
        chrome.browserAction.setPopup({popup: (result?.one_click_option === true) ? "" : "../popup.html"});
    });
})


// Fires when addon is installed or updated.
// Gets latest definitions.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install' || details.reason === 'update') {
        getUpdatedDefinitions();
    }
});
