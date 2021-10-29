// A background page is loaded when it is needed, and unloaded when it goes idle. Some examples of events include:
// - The extension is first installed or updated to a new version.
// - The background page was listening for an event, and the event is dispatched.
// - A content script or other extension sends a message.
// - Another view in the extension, such as a popup, calls runtime.getBackgroundPage.
// https://developer.chrome.com/extensions/background_pages


// Listens for messages from content script.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Runtime/onMessage
chrome.runtime.onMessage.addListener(function(message, sender, _sendResponse) {
    switch(message.event) {
        case 'elements_modified':
            if (message.hideComments) {
                showEnabledIcon(sender.tab.id);
            } else {
                showDisabledIcon(sender.tab.id);
            }
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
