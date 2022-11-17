// A background page is loaded when it is needed, and unloaded when it goes idle. Some examples of events include:
// - The extension is first installed or updated to a new version.
// - The background page was listening for an event, and the event is dispatched.
// - A content script or other extension sends a message.
// - Another view in the extension, such as a popup, calls runtime.getBackgroundPage.
// https://developer.chrome.com/extensions/background_pages

let invalidProtocols = ['chrome-extension', 'edge', 'moz-extension', 'about'];
const GLOBAL_DEFINITION_EXPIRATION_SEC = 86400;
const VERSION_JSON = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/version.json';
const SITES_JSON = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/sites.json';


// Write an error to the console, prepended with the addon name.
function logError(errorMessage) {
    console.error(`[${chrome.runtime.getManifest().name}]: ${errorMessage}`);
}

function getCurrentSeconds() {
    return new Date().getTime() / 1000 | 0;
}

// Get the latest site definitions.
function getUpdatedDefinitions(forceUpdate, updatedAction = undefined, notUpdatedAction = undefined) {
    chrome.storage.local.get('definition_version', function (localVersionResult) {
        chrome.storage.local.get('definition_version_last_check', function (lastCheckResult) {
            // If the definition version or last update time is missing, or we're forcing an update, check for new definitions
            if (!Number.isInteger(localVersionResult?.definition_version)
                || !Number.isInteger(lastCheckResult?.definition_version_last_check)
                || getCurrentSeconds() - lastCheckResult.definition_version_last_check > GLOBAL_DEFINITION_EXPIRATION_SEC
                || forceUpdate) {

                fetch(VERSION_JSON)
                    .then((response) => response.json())
                    .then((verData) => {
                        // Even if forcing an update, if the definition version is available locally and matches what's
                        // on GitHub, there's no point in wasting the bandwidth to get the definitions again.
                        if (localVersionResult?.definition_version === undefined
                            || !Number.isInteger(localVersionResult.definition_version)
                            || localVersionResult.definition_version < verData.version) {
                            fetch(SITES_JSON)
                                .then((response) => response.json())
                                .then((sitesData) => {
                                    chrome.storage.local.set({ 'global_definitions': JSON.stringify(sitesData) });
                                    chrome.storage.local.set({ 'definition_version': verData.version });
                                    chrome.storage.local.set({ 'definition_version_last_check': getCurrentSeconds() });
                                    if (updatedAction) {
                                        updatedAction(verData.version);
                                    }
                                })
                                .catch(function (error) {
                                    logError(JSON.stringify(error));
                                });
                        } else {
                            chrome.storage.local.set({ 'definition_version_last_check': getCurrentSeconds() });
                            if (notUpdatedAction) {
                                notUpdatedAction(localVersionResult.definition_version);
                            }
                        }
                    });
            } else {
                if (notUpdatedAction) {
                    notUpdatedAction(localVersionResult.definition_version);
                }
            }
        });
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
                logError(`background script not configured to run for message event: '${message.event}'`);
        }
    });
});


// Fires when user clicks the addon icon in the browser toolbar, and the popup is disabled.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/onClicked
chrome.action.onClicked.addListener(function (tab) {
    if (invalidProtocols.some(p => new URL(tab.url).protocol.startsWith(p))) {
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
            chrome.action.setPopup({ popup: (result?.one_click_toggle === true) ? '' : '../popup.html' });
        });
        oneTimeUpgradeWork();
        getUpdatedDefinitions(true);
    }
});
