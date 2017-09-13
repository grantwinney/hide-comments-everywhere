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

function toggleActiveness(tabId) {
    chrome.browserAction.getBadgeText({tabId: tabId}, function(badgeText) {
        if (badgeText == "") {
            show_disabled_icon(tabId);
            chrome.tabs.sendMessage(tabId, { enabled: false });
        } else {
            show_enabled_icon(tabId);
            chrome.tabs.sendMessage(tabId, { enabled: true });
        }
    });
}

function isUrlExcluded(tab, result) {
    var excludedUrls = result.excluded_urls.split(/\r?\n/);
    for (var i = 0; i < excludedUrls.length; i++) {
        if (excludedUrls[i] === '') {
            continue;
        }
        if (excludedUrls[i] === '<all_urls>') {
            return true;
        } else if (tab.url === excludedUrls[i]) {
            return true;
        } else {
            var pattern = getMatchPatternParts(excludedUrls[i]);
            var patternScheme = pattern[0];
            var patternHost = pattern[1];
            var patternPath = pattern[2];

            var url = new URL(tab.url);
            var activeUrlScheme = url.protocol.substring(0, url.protocol.length-1);
            var activeUrlHost = url.hostname;
            var activeUrlPath = url.pathname + url.search;

            var isSchemeValidMatch = (patternScheme === '*' && (activeUrlScheme === 'http' || activeUrlScheme === 'https')) || (activeUrlScheme === patternScheme);
            var isHostValidMatch = (patternHost === '*' || patternHost === activeUrlHost || activeUrlHost.match('^' + patternHost.replace(/\*/g, '.*') + '$') != undefined);
            var isPathValidMatch = (patternPath === '/' || patternPath === activeUrlPath || activeUrlPath.match('^' + patternPath.replace('?','\\?').replace(/\*/g, '.*') + '$') != undefined);

            if (isSchemeValidMatch && isHostValidMatch && isPathValidMatch) {
                return true;
            }
        }
    }
    return false;
}

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.sync.get('excluded_urls', function(result) {
        if (result == undefined || result.excluded_urls == undefined) {
            toggleActiveness(tab.id);
        } else {
            if (isUrlExcluded(tab, result)) {
                maintainDisabled(tab.id);
            } else {
                toggleActiveness(tab.id);
            }
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get('excluded_urls', function(result) {
            if (result != undefined && result.excluded_urls != undefined && isUrlExcluded(tab, result)) {
                show_disabled_icon(tabId);
                chrome.tabs.sendMessage(tabId, { enabled: false });
            } else {
                show_enabled_icon(tabId);
                chrome.tabs.sendMessage(tabId, { enabled: true });
            }
        });
    }
});
