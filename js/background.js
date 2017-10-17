chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { event: 'pageload' });
    }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch(message.event) {
        case 'scriptdone':
            if (message.hideComments) {
                showEnabledIcon(sender.tab.id);
            } else {
                showDisabledIcon(sender.tab.id);
            }
            break;
        default:
            console.error("Hide Comments Everywhere received an unexpected message: " + message.event);
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    toggleComments(tab.id);
});

chrome.windows.onCreated.addListener(function() {
    // if filters are missing, download them
    // if filters are present but version is missing or old, re-download them
    chrome.storage.local.get('site_patterns', function(result) {
        if (result == undefined || result.site_patterns == undefined) {
            getAndStoreSiteDefinitions();
        } else {
            getDefinitionVersion(function(version) {
                chrome.storage.local.get('definition_version', function(result) {
                    if (result == undefined || result.definition_version == undefined || result.definition_version < version) {
                        getAndStoreSiteDefinitions(version);
                    }
                });
            });
        }
    });
    // set the browser action to either show a popup or not, based on user's setting
    chrome.storage.local.get('one_click_option', function(result) {
        var oneClickEnabled = (result != undefined && result.one_click_option == true);
        chrome.browserAction.setPopup({popup: oneClickEnabled ? "" : "../popup.html"});
    });
})
