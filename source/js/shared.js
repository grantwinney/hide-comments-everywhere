// Write an error to the console, prepended with the addon name.
function logError(errorMessage) {
    console.error(`${chrome.runtime.getManifest().name}: ${errorMessage}`);
}

// Get the current site definitions.
function getUpdatedDefinitions(updatedAction = undefined, notUpdatedAction = undefined) {
    axios.get('https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/version.json')
         .then(function(cloudVersionResult) {
            chrome.storage.local.get('definition_version', function (localVersionResult) {
                if (localVersionResult?.definition_version == undefined|| !Number.isInteger(localVersionResult.definition_version) || localVersionResult.definition_version < cloudVersionResult.data.version) {
                    axios.get('https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/sites.json')
                         .then(function(cloudSitesResult) {
                            chrome.storage.local.set({'definitions': cloudSitesResult.data});
                            chrome.storage.local.set({'definition_version': cloudVersionResult.data.version});
                            if (updatedAction) {
                                updatedAction(cloudVersionResult.data.version);
                            }
                         })
                         .catch(function (error) {
                             logError(JSON.stringify(error));
                         });
                } else {
                    if (notUpdatedAction) {
                        notUpdatedAction(localVersionResult.definition_version);
                    }
                }
            });
         });
}

// Addon is enabled for a particular url
function showEnabledIcon(tabId, callback) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-32.png', tabId: tabId }, function() {
        chrome.browserAction.setTitle({ title: '', tabId: tabId });
        if (callback !== undefined) {
            callback();
        }
    });
}

// Addon is disabled for a particular url
function showDisabledIcon(tabId, callback) {
    chrome.browserAction.setIcon({ path: 'images/hide-comments-bw-32.png', tabId: tabId }, function() {
        chrome.browserAction.setTitle({ title: chrome.runtime.getManifest().name + ' (disabled)', tabId: tabId });
        if (callback !== undefined) {
            callback();
        }
    });
}

// User chose to toggle comments (temporary), so adjust the addon icon/title and send a message
//  to the content script to toggle whether or not comments are hidden on the page.
function toggleComments(tabId, postAction = undefined) {
    chrome.browserAction.getTitle({tabId: tabId}, function(title) {
        if (title.endsWith('(disabled)')) {
            showEnabledIcon(tabId, postAction);
            chrome.tabs.sendMessage(tabId, { event: 'toggle', hideComments: true });
        } else {
            showDisabledIcon(tabId, postAction);
            chrome.tabs.sendMessage(tabId, { event: 'toggle', hideComments: false });
        }
    });
}

// Check that all custom URLs are valid regex patterns
function validateCustomUrls(urls) {
    try {
        for (let i = 0; i < urls.length; i++) {
            new RegExp(urls[i]);
        }
        return true;
    }
    catch(e) {
        return false;
    }
}
