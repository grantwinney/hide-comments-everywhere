// Write an error to the console, prepended with the addon name.
function logError(errorMessage) {
    console.error(`${chrome.runtime.getManifest().name}: ${errorMessage}`);
}

// Get the current site definitions.
function getUpdatedDefinitions(updatedAction = undefined, notUpdatedAction = undefined) {
    let versionJson = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/upgrade/sites/version.json';
    let sitesJson = 'https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/upgrade/sites/sites.json';
    
    axios.get(versionJson)
         .then(function(cloudVersionResult) {
            chrome.storage.local.get('definition_version', function (localVersionResult) {
                if (localVersionResult?.definition_version == undefined|| !Number.isInteger(localVersionResult.definition_version) || localVersionResult.definition_version < cloudVersionResult.data.version) {
                    axios.get(sitesJson)
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

// User chose to toggle comments (temporary), so adjust the addon icon/title and send a message
//  to the content script to toggle whether or not comments are hidden on the page.
function toggleComments(tabId, postAction) {
    chrome.browserAction.getTitle({tabId: tabId}, function(title) {
        chrome.tabs.sendMessage(tabId, { event: 'toggle' });
        if (postAction) {
            postAction();
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
