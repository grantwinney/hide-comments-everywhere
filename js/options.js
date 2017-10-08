function loadExcludedUrls() {
    chrome.storage.sync.get('excluded_urls', function(result) {
        if (result != undefined && result.excluded_urls != undefined) {
            document.getElementById('excluded_urls').value = result.excluded_urls;
        }
    });
}

function checkForNewDefinitions() {
    toggleWaitCursor(true);
    getDefinitionVersion(function(version) {
        chrome.storage.local.get('definition_version', function(result) {
            if (result == undefined || result.definition_version == undefined || result.definition_version < version) {
                toggleNewDefinitionMessage(true);
            }
            toggleWaitCursor(false);
        });
    });
}

function saveExcludedUrls() {
    toggleWaitCursor(true);
    var excludedUrls = document.getElementById('excluded_urls').value;
    if (validateExcludedUrls(excludedUrls.split(/\r?\n/))) {
        chrome.storage.sync.set({'excluded_urls': excludedUrls});
    } else {
        alert('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try saving again.')
    }
    toggleWaitCursor(false);
}

window.addEventListener('load', function load(event) {
    loadExcludedUrls();
    checkForNewDefinitions();
    document.getElementById('update_definitions').addEventListener('click', getAndStoreSiteDefinitions);
    document.getElementById('save').addEventListener('click', saveExcludedUrls);
});
