function loadExcludedUrls() {
    chrome.storage.sync.get('excluded_urls', function(result) {
        if (result != undefined && result.excluded_urls != undefined) {
            document.getElementById('message').value = result.excluded_urls;
        }
    });
}

function isExcludedUrlsValid(urls) {
    try {
        for (var i = 0; i < urls.length; i++) {
            new RegExp(urls[i]);
        }
        return true;
    }
    catch(e) {
        return false;
    }
}

function saveExcludedUrls() {
    var excludedUrls = document.getElementById('message').value;
    if (isExcludedUrlsValid(excludedUrls.split(/\r?\n/))) {
        chrome.storage.sync.set({'excluded_urls': excludedUrls});
    } else {
        alert('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try saving again.')
    }
}

window.addEventListener('load', function load(event) {
    loadExcludedUrls();
    document.getElementById('update_definitions').addEventListener('click', storeSiteDefinitions);
    document.getElementById('save').addEventListener('click', saveExcludedUrls);
});
