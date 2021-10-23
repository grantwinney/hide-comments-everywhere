// Get the current site definitions, and hide the new definition message and adjust the wait cursor.
function getAndStoreSiteDefinitions(currentVersion = undefined) {
    toggleWaitCursor(true);
    axios.get('https://raw.githubusercontent.com/grantwinney/hide-comments-everywhere/master/sites/sites.json')
         .then(function(result) {
            chrome.storage.local.set({'patterns': result.data});
            toggleNewDefinitionMessage(false);
            if (currentVersion != undefined) {
                chrome.storage.local.set({'definition_version': currentVersion});
                toggleWaitCursor(false);
            } else {
                getDefinitionVersion(function(version) {
                    chrome.storage.local.set({'definition_version': version});
                    toggleWaitCursor(false);
                });
            }
         })
         .catch(function(error) {
             logError(JSON.stringify(error));
             toggleWaitCursor(false);
         });
}

function toggleNewDefinitionMessage(show) {
    let message = document.getElementById('new_definition_message');
    if (message != null) {
        message.style.setProperty('display', show ? 'block' : 'none');
    }
}

function loadOptions() {
    chrome.storage.local.get('one_click_option', function(result) {
        let oneClickEnabled = (result != undefined && result.one_click_option == true);
        document.getElementById('one_click_option').checked = oneClickEnabled;
    });
}

function setOneClickDisable() {
    let oneClickEnabled = document.getElementById('one_click_option').checked;
    chrome.storage.local.set({'one_click_option': oneClickEnabled});
    chrome.browserAction.setPopup({popup: oneClickEnabled ? "" : "../popup.html"});
}

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
    let excludedUrls = document.getElementById('excluded_urls').value;
    if (validateExcludedUrls(excludedUrls.split(/\r?\n/))) {
        chrome.storage.sync.set({'excluded_urls': excludedUrls}, function() {
            let sn = document.getElementById('save-notification');
            sn.innerText = chrome.runtime.lastError ? "ERROR!" : "SAVED!";
            if (chrome.runtime.lastError) {
                console.error(`Error: ${chrome.runtime.lastError.message}`);
            }
            sn.style.setProperty('display', 'inline')
            setTimeout(function() {sn.style.setProperty('display', 'none')}, 4000);
        });
    } else {
        alert('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try saving again.')
    }
    toggleWaitCursor(false);
}

function showVersion() {
    let manifest = chrome.runtime.getManifest();
    let version = document.getElementById('version');
    version.innerHTML = `&copy; 2018 - ${(new Date()).getFullYear()}, ver ${manifest.version}`

    chrome.storage.local.get('definition_version', function(result) {
        if (result?.definition_version) {
            version.innerHTML += ` (${result.definition_version})`;
        }
    });
}

window.addEventListener('DOMContentLoaded', function load(_event) {
    loadOptions();
    loadExcludedUrls();
    checkForNewDefinitions();
    showVersion();
    document.getElementById('one_click_option').addEventListener('click', function() { setOneClickDisable(); });
    document.getElementById('one_click_option_description').addEventListener('click', function() { document.getElementById('one_click_option').click(); });
    document.getElementById('update_definitions').addEventListener('click', function() { getAndStoreSiteDefinitions(); });
    document.getElementById('save').addEventListener('click', function() { saveExcludedUrls(); });

    $('#filters-help-icon').click(function(){
        $('#filters-help').slideToggle(500);
    });
});
