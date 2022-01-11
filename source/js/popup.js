function addToExclusion(tabId) {
    let selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        let urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('customUrlDesc').value;
        }
        if (urlToInclude === '') {
            displayMessage("Enter a valid URL")
            return;
        }
        chrome.storage.sync.get('excluded_urls', function(result) {
            let excludedUrls = result != undefined && result.excluded_urls != undefined ? result.excluded_urls : '';
            try {
                let url = new URL(urlToInclude);
                let regexUrl = '^' + (url.origin + url.pathname).replace(/\./g, '\\.');
                let updatedUrls = excludedUrls + (excludedUrls[excludedUrls.length - 1] === '\n' ? '' : '\r\n') + regexUrl + '\r\n';
                if (validateCustomUrls([regexUrl])) {
                    chrome.storage.sync.set({'excluded_urls': updatedUrls});
                    chrome.tabs.sendMessage(tabId, { event: 'tab_updated' });
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
            }

        });
    }
}

function displayMessage(message) {
    let alert = document.getElementById('alert');
    alert.innerHTML = message;
    alert.style.setProperty('display', 'block');
    window.setTimeout(function() {alert.style.setProperty('display', 'none');}, 5000);
}

function submitUrlForInclusion() {
    let selection = document.querySelector('input[name="url"]:checked');
    if (selection !== null) {
        let urlToInclude = selection.value;
        if (urlToInclude === 'custom') {
            urlToInclude = document.getElementById('customUrlDesc').value;
        }
        if (urlToInclude === '') {
            displayMessage("Enter a valid URL")
            return;
        }
        let title = "Here's a new site I'd like you to consider blocking";
        let body = encodeURIComponent(title + ":\n\n" + urlToInclude + '\n\n(please include any other relevant details)');
        let url = `https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=${title}&body=${body}`;
        window.open(url, '_blank')
    }
}

function displayUrlOptions(url) {
    let baseUrl = document.getElementById('baseUrl');
    let baseUrlDesc = document.getElementById('baseUrlDesc');
    baseUrl.value = url.origin;
    baseUrlDesc.value = baseUrlDesc.title = url.origin;
    baseUrlDesc.addEventListener('click', function() {baseUrl.checked = true;});

    let fullUrl = document.getElementById('fullUrl');
    let fullUrlDesc = document.getElementById('fullUrlDesc');
    fullUrl.value = fullUrlDesc.value = fullUrlDesc.title = url.origin + url.pathname;
    fullUrlDesc.addEventListener('click', function() {fullUrl.checked = true;});

    let customUrl = document.getElementById('customUrl');
    let customUrlDesc = document.getElementById('customUrlDesc');
    customUrl.value = 'custom';
    customUrlDesc.addEventListener('click', function() {customUrl.checked = true;});
    document.getElementById('customUrlHeading').addEventListener('click', function() {customUrl.checked = true;});
    customUrlDesc.addEventListener('keydown', function(event) {
        if (event.key !== 'Tab') {
            customUrl.checked = true;
        }
    });
}

window.addEventListener('DOMContentLoaded', function load(event) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        displayUrlOptions(new URL(tabs[0].url));
        let tabId = tabs[0].id;
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
