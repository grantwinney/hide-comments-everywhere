// A background page is loaded when it is needed, and unloaded when it goes idle. Some examples of events include:
// - The extension is first installed or updated to a new version.
// - The background page was listening for an event, and the event is dispatched.
// - A content script or other extension sends a message.
// - Another view in the extension, such as a popup, calls runtime.getBackgroundPage.
// https://developer.chrome.com/extensions/background_pages


// Listens for messages from content script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function (message, sender, _sendResponse) {
    if (!sender.tab) {
        return;
    }
    switch (message.event) {
        case 'comments_hidden':
            chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: sender.tab.id }, function () {
                chrome.browserAction.setTitle({ title: '', tabId: sender.tab.id });
            });
            break;
        case 'comments_shown':
            chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: sender.tab.id }, function () {
                chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled for this site)', tabId: sender.tab.id });
            });
            break;
        default:
            logError(`background script not configured to run for message event: '${message.event}'`);
    }
});

// Fires when user clicks the addon icon in the browser toolbar.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/onClicked
chrome.browserAction.onClicked.addListener(function (tab) {
    toggleCommentsOnCurrentUrl(tab.id, new URL(tab.url));
});


// Fires when a new browser tab is opened.
// Gets latest site definitions, 
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onCreated
chrome.tabs.onCreated.addListener(function () {
    getUpdatedDefinitions(false);
});


// TODO: Test out all this logic
// Anything that needs to be done during an upgrade
function oneTimeUpgradeWork() {
    // Rename excluded_urls to user_whitelist in storage (1.5.2 -> 1.5.3)
    chrome.storage.sync.get('excluded_urls', function (result) {
        if (result?.excluded_urls != undefined) {
            chrome.storage.sync.set({ 'user_whitelist': result.excluded_urls }, function () {
                chrome.storage.sync.remove('excluded_urls');
            });
        }
    });
    // Rename blacklist_urls to user_blacklist in storage (1.5.2 -> 1.5.3)
    chrome.storage.sync.get('blacklist_urls', function (result) {
        if (result?.blacklist_urls != undefined) {
            chrome.storage.sync.set({ 'user_blacklist': result.blacklist_urls }, function () {
                chrome.storage.sync.remove('blacklist_urls');
            });
        }
    });
    // Definitions will be re-downloaded, stored in different storage key (1.5.2 -> 1.5.3)
    chrome.storage.sync.remove('definitions');
    // Move setting to sync'd storage and rename (1.5.2 -> 1.5.3)
    chrome.storage.local.get('one_click_option', function (result) {
        chrome.storage.sync.set({ 'one_click_toggle': result?.one_click_option }, function () {
            chrome.storage.local.remove('one_click_option');
        });
    });
    // By default, remember the toggle setting per site; can be disabled in options
    chrome.storage.sync.get('remember_toggle', function (result) {
        if (result?.remember_toggle === undefined) {
            chrome.storage.sync.set({ 'remember_toggle': true });
        }
    });
}


// Fires when addon is installed or updated.
// Gets latest definitions.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install' || details.reason === 'update') {
        oneTimeUpgradeWork();
        getUpdatedDefinitions(true);
        chrome.storage.sync.get('one_click_toggle', function (result) {
            chrome.browserAction.setPopup({ popup: (result?.one_click_toggle === true) ? '' : '../popup.html' });
        });
    }
});
