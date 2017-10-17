function addToExclusion(tabId) {
    toggleWaitCursor(true);
    var selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        var urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('customUrlDesc').value;
        }
        if (urlToInclude === '') {
            displayMessage("Enter a valid URL")
            toggleWaitCursor(false);
            return;
        }
        chrome.storage.sync.get('excluded_urls', function(result) {
            var excludedUrls = result != undefined && result.excluded_urls != undefined ? result.excluded_urls : '';
            try {
                var url = new URL(urlToInclude);
                var regexUrl = '^' + (url.origin + url.pathname).replace(/\./g, '\\.');
                var updatedUrls = excludedUrls + (excludedUrls[excludedUrls.length - 1] === '\n' ? '' : '\r\n') + regexUrl + '\r\n';
                if (validateExcludedUrls([regexUrl])) {
                    chrome.storage.sync.set({'excluded_urls': updatedUrls});
                    chrome.tabs.sendMessage(tabId, { event: 'pageload' });
                    window.close();
                } else {
                    displayMessage('The URL you specified is invalid. Double-check it and try saving again.')
                }
            } catch(e) {
                if (e instanceof TypeError) {
                    displayMessage('The URL you specified is invalid. Double-check it and try saving again.');
                } else {
                    displayMessage('An error occurred: ' + e.message);
                }
            } finally {
                toggleWaitCursor(false);
            }

        });
    }
    toggleWaitCursor(false);
}

function displayMessage(message) {
    var alert = document.getElementById('alert');
    alert.innerHTML = message;
    alert.style.setProperty('display', 'block');
    window.setTimeout(function() {alert.style.setProperty('display', 'none');}, 5000);
}

function submitUrlForInclusion() {
    var selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        var urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('customUrlDesc').value;
        }
        if (urlToInclude === '') {
            displayMessage("Enter a valid URL")
            toggleWaitCursor(false);
            return;
        }
        var title = "Here's a new site I'd like you to consider blocking";
        var body = encodeURIComponent(title + ":\n\n" + urlToInclude + '\n\n(please include any other relevant details)');
        var url = `https://github.com/grantwinney/hide-comments-in-chrome-sites/issues/new?title=${title}&body=${body}`;
        window.open(url, '_blank')
    }
}

function displayUrlOptions(url) {
    document.getElementById('baseUrl').value = url.origin;
    document.getElementById('baseUrlDesc').value = url.origin;
    document.getElementById('baseUrlDesc').addEventListener('click', function() {
        document.getElementById('baseUrl').checked = true;
    });

    document.getElementById('fullUrl').value = url.origin + url.pathname;
    document.getElementById('fullUrlDesc').value = url.origin + url.pathname;
    document.getElementById('fullUrlDesc').addEventListener('click', function() {
        document.getElementById('fullUrl').checked = true;
    });
    
    document.getElementById('customUrl').value = 'custom';
    document.getElementById('customUrlDesc').addEventListener('click', function() {
        document.getElementById('customUrl').checked = true;
    });
    document.getElementById('customUrlHeading').addEventListener('click', function() {
        document.getElementById('customUrl').checked = true;
    });
    document.getElementById('customUrlDesc').addEventListener('keydown', function(event) {
        if (event.key !== 'Tab') {
            document.getElementById('customUrl').checked = true;
        }
    });
}

window.addEventListener('DOMContentLoaded', function load(event) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        displayUrlOptions(new URL(tabs[0].url));
        var tabId = tabs[0].id;
        document.getElementById('toggle_hide').addEventListener('click', function() {
            toggleComments(tabId, function() { window.close(); });
        });
        document.getElementById('submit_for_inclusion').addEventListener('click', submitUrlForInclusion);
        document.getElementById('add_to_exclusion').addEventListener('click', function() {
            addToExclusion(tabId);
        });
        document.getElementById('options').addEventListener('click', function() {
            chrome.runtime.openOptionsPage();
        });
    });
});
