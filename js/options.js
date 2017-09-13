window.addEventListener('load', function load(event) {
    chrome.storage.sync.get('excluded_urls', function(result) {
        if (result != undefined && result.excluded_urls != undefined) {
            document.getElementById('message').value = result.excluded_urls;
        }
    });

    document.getElementById('save').addEventListener('click', function() {
        var excludedUrls = document.getElementById('message').value;
        var excludedUrlsArray = excludedUrls.split(/\r?\n/);
        for (var i = 0; i < excludedUrlsArray.length; i++) {
            if (isValidMatchPattern(excludedUrlsArray[i])) {
                chrome.storage.sync.set({'excluded_urls': excludedUrls});
            } else {
                alert('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try to save again.')
                break;
            }
        }
    });
});
