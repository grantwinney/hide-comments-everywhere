// A background service worker is loaded when it is needed, and unloaded when it goes idle. Some examples include:
// - The extension is first installed or updated to a new version.
// - The background page was listening for an event, and the event is dispatched.
// - A content script or other extension sends a message.
// - Another view in the extension, such as a popup, calls runtime.getBackgroundPage.
// https://developer.chrome.com/docs/extensions/mv3/service_workers/

import * as utils from './shared-utils.js';

function setIconBehavior() {
    chrome.storage.sync.get('one_click_toggle', function (result) {
        chrome.action.setPopup({ popup: (result?.one_click_toggle === true) ? '' : '../popup.html' });
    });
}

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
                chrome.action.setIcon({ path: '../images/hide-comments-32.png', tabId: sender.tab.id }, function () {
                    chrome.action.setTitle({ title: title, tabId: sender.tab.id });
                });
                break;
            case 'comments_shown':
                chrome.action.setIcon({ path: '../images/hide-comments-bw-32.png', tabId: sender.tab.id }, function () {
                    chrome.action.setTitle({ title: title, tabId: sender.tab.id });
                });
                break;
            default:
                utils.log(`background script not configured to run for message event: '${message.event}'`);
        }
    });
});


// Fires when user clicks the addon icon in the browser toolbar, and the popup is disabled.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/onClicked
chrome.action.onClicked.addListener(function (tab) {
    if (utils.INVALID_PROTOCOLS.some(p => new URL(tab.url).protocol.startsWith(p))) {
        return;
    }
    // The value of the toggle setting is stored from the toggleCommentVisibility
    // method in the content script, after the comments are displayed/hidden, to
    // avoid a buggy situation described in more detail in there.
    chrome.tabs.sendMessage(tab.id, { event: 'toggle_tab' });
});


// Fires when a new browser tab is opened.
// If it's time to check for new definitions, and there's an update available, retrieve them.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onCreated
chrome.tabs.onCreated.addListener(function () {
    utils.getUpdatedDefinitions(false);
});


// Anything that needs to be done during an upgrade
function oneTimeUpgradeWork() {
}

// On installation, set default option values
function setInitialOptionValues() {
    chrome.storage.sync.set({ 'one_click_toggle': false });
    chrome.storage.sync.set({ 'remember_toggle': true });
}


// Fires when addon is installed or updated.
// Gets latest definitions.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        setInitialOptionValues();
    }
    if (details.reason === 'install' || details.reason === 'update') {
        setIconBehavior();
        oneTimeUpgradeWork();
        utils.getUpdatedDefinitions(true);
    }
});

chrome.runtime.onStartup.addListener(function () {
    setIconBehavior();
});
