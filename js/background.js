chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { event: 'pageload' });
    }
});

chrome.storage.local.get('site_patterns', function(result) {
    if (result == undefined || result.site_patterns == undefined) {
        getAndStoreSiteDefinitions();
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

chrome.storage.local.get('one_click_option', function(result) {
    var oneClickEnabled = (result != undefined && result.one_click_option == true);
    chrome.browserAction.setPopup({popup: oneClickEnabled ? "" : "../popup.html"});
});
