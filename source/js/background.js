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
    // Rename excluded_urls to user_whitelist in storage (1.5.2 -> 1.5.3)
    chrome.storage.sync.get('excluded_urls', function (result) {
        if (result?.excluded_urls !== undefined) {
            chrome.storage.sync.set({ 'user_whitelist': result.excluded_urls }, function () {
                chrome.storage.sync.remove('excluded_urls');
            });
        }
    });
    // Rename blacklist_urls to user_blacklist in storage (1.5.2 -> 1.5.3)
    chrome.storage.sync.get('blacklist_urls', function (result) {
        if (result?.blacklist_urls !== undefined) {
            chrome.storage.sync.set({ 'user_blacklist': result.blacklist_urls }, function () {
                chrome.storage.sync.remove('blacklist_urls');
            });
        }
    });
    // Definitions will be re-downloaded, stored in different storage key (1.5.2 -> 1.5.3)
    chrome.storage.sync.remove('definitions');

    // Move setting to sync'd storage and rename (1.5.2 -> 1.5.3)
    chrome.storage.local.get('one_click_option', function (result) {
        if (result?.one_click_option !== undefined) {
            chrome.storage.sync.set({ 'one_click_toggle': result?.one_click_option }, function () {
                chrome.browserAction.setPopup({ popup: (result?.one_click_option === true) ? '' : '../popup.html' });
                chrome.storage.local.remove('one_click_option');
            });
        } else {
            // TODO: This needs to move back into the chrome.runtime.onInstalled.addListener event handler below
            // when this upgrade code is eventually removed
            chrome.storage.sync.get('one_click_toggle', function (result) {
                chrome.browserAction.setPopup({ popup: (result?.one_click_toggle === true) ? '' : '../popup.html' });
            });
        }
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
    }
});
