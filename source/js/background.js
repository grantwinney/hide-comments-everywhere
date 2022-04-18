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

    chrome.storage.sync.get('remember_toggle', function (rememberToggleResult) {
        // If the user's toggle setting is overridden by something, either their own white or black list,
        // or the global whitelist, then give them an indication as to why it is, and warn them that if
        // they try to override anything by clicking toggle that it's only temporary (because the next
        // time they reload the page and all this logic runs (again), their toggle setting will be overridden (again)).
        let title = '';
        if (message.overrideReason && message.overrideReason !== 'user_whitelist_flag') {
            if (message.overrideReason === 'user_whitelist') {
                title = `${chrome.runtime.getManifest().name} (Site in your whitelist.`;
            } else if (message.overrideReason === 'user_blacklist') {
                title = `${chrome.runtime.getManifest().name} (Site in your blacklist.`;
            } else if (message.overrideReason === 'global_whitelist') {
                title = `${chrome.runtime.getManifest().name} (Site in global whitelist.`;
            }
            if (rememberToggleResult?.remember_toggle === true) {
                title += ' Toggle is temporary.)';
            } else {
                title += ')';
            }
        } else {
            if (message.event == 'comments_hidden') {
                title = chrome.runtime.getManifest().name;
            } else if (message.event == 'comments_shown') {
                title = `${chrome.runtime.getManifest().name} (disabled for this site)`;
            }
        }

        switch (message.event) {
            case 'comments_hidden':
                chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: sender.tab.id }, function () {
                    chrome.browserAction.setTitle({ title: title, tabId: sender.tab.id });
                });
                break;
            case 'comments_shown':
                chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: sender.tab.id }, function () {
                    chrome.browserAction.setTitle({ title: title, tabId: sender.tab.id });
                });
                break;
            default:
                logError(`background script not configured to run for message event: '${message.event}'`);
        }
    });
});


// Fires when user clicks the addon icon in the browser toolbar, and the popup is disabled.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/onClicked
chrome.browserAction.onClicked.addListener(function (tab) {
    toggleCommentsOnCurrentUrl(tab.id, new URL(tab.url));
});


// Fires when a new browser tab is opened.
// If it's time to check for new definitions, and there's an update available, retrieve them.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onCreated
chrome.tabs.onCreated.addListener(function () {
    getUpdatedDefinitions(false);
});


// Anything that needs to be done during an upgrade
function oneTimeUpgradeWork() {
}


// Fires when addon is installed or updated.
// Gets latest definitions.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install' || details.reason === 'update') {
        chrome.storage.sync.get('one_click_toggle', function (result) {
            chrome.browserAction.setPopup({ popup: (result?.one_click_toggle === true) ? '' : '../popup.html' });
        });
        oneTimeUpgradeWork();
        getUpdatedDefinitions(true);
    }
});
