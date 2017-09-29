function show_enabled_icon(tabId) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: tabId });
    chrome.browserAction.setTitle({ title: '', tabId: tabId });
    chrome.browserAction.setBadgeText({ text: '', tabId: tabId });
};

function show_disabled_icon(tabId) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: tabId });
    chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: tabId });
    chrome.browserAction.setBadgeBackgroundColor({ color: [155,155,155,255], tabId: tabId });
    chrome.browserAction.setBadgeText({ text: 'X', tabId: tabId });
};

function toggleActiveness(tabId, tabUrl) {
    chrome.browserAction.getBadgeText({tabId: tabId}, function(badgeText) {
        if (badgeText == "") {
            show_disabled_icon(tabId);
            chrome.tabs.sendMessage(tabId, { enabled: false, url: tabUrl });
        } else {
            show_enabled_icon(tabId);
            chrome.tabs.sendMessage(tabId, { enabled: true, url: tabUrl });
        }
    });
};

function isUrlExcluded(url, excludedUrls) {
    var excludedUrlPatterns = excludedUrls.split(/\r?\n/);
    for (var i = 0; i < excludedUrlPatterns.length; i++) {
        if (excludedUrlPatterns[i] === '') {
            continue;
        }
        if (isValidMatch(url, excludedUrlPatterns[i])) {
            return true;
        }
    }
    return false;
};

chrome.browserAction.onClicked.addListener(function(tab) {
    toggleActiveness(tab.id, tab.url);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get('excluded_urls', function(result) {
            if (result != undefined && result.excluded_urls != undefined && isUrlExcluded(tab.url, result.excluded_urls)) {
                show_disabled_icon(tabId);
                chrome.tabs.sendMessage(tabId, { enabled: false, url: tab.url });
            } else {
                show_enabled_icon(tabId);
                chrome.tabs.sendMessage(tabId, { enabled: true, url: tab.url });
            }
        });
    }
});

chrome.storage.local.get('site_patterns', function(result) {
    if (result == undefined || result.site_patterns == undefined) {
        storeSiteDefinitions();
    }
});
