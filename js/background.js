function show_enabled_icon(tabId) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: tabId });
    chrome.browserAction.setTitle({ title: '', tabId: tabId });
};

function show_disabled_icon(tabId) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: tabId });
    chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: tabId });
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
    chrome.browserAction.getTitle({tabId: tab.id}, function(title) {
        if (title.endsWith('(disabled)')) {
            show_enabled_icon(tab.id);
            chrome.tabs.sendMessage(tab.id, { enabled: true, url: tab.url });
        } else {
            show_disabled_icon(tab.id);
            chrome.tabs.sendMessage(tab.id, { enabled: false, url: tab.url });
        }
    });
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
        getAndStoreSiteDefinitions();
    }
});
