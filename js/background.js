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
    if (message.event === 'scriptdone') {
        if (message.hideComments) {
            show_enabled_icon(sender.tab.id);
        } else {
            show_disabled_icon(sender.tab.id);
        }
    }
});
