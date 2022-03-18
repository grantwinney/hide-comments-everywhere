// SETTINGS

function loadAllSettings() {
    chrome.storage.sync.get('one_click_toggle', function (result) {
        document.getElementById('one_click_toggle').checked = (result?.one_click_toggle === true);
    });
    chrome.storage.sync.get('remember_toggle', function (result) {
        document.getElementById('remember_toggle').checked = (result?.remember_toggle === true);
    });
    chrome.storage.sync.get('show_placeholder', function (result) {
        document.getElementById('show_placeholder').checked = (result?.show_placeholder === true);
    });
}

function saveOneClickSetting() {
    let oneClickEnabled = document.getElementById('one_click_toggle').checked;
    chrome.storage.sync.set({ 'one_click_toggle': oneClickEnabled });
    chrome.browserAction.setPopup({ popup: oneClickEnabled ? '' : '../popup.html' });
}

function saveRememberToggleSetting() {
    let rememberToggleCheckbox = document.getElementById('remember_toggle');
    if (rememberToggleCheckbox.checked) {
        chrome.storage.sync.set({ 'remember_toggle': true });
    } else {
        let sure = confirm("This will clear toggle settings for all sites that you've previously set them for. Continue?");
        if (!sure) {
            rememberToggleCheckbox.checked = true;
        } else {
            chrome.storage.sync.remove('user_whitelist_flags');
            chrome.storage.sync.set({ 'remember_toggle': false });
        }
    }
}

// TODO: Implement this to show a placeholder image
function saveShowPlaceholderSetting() {
    let showPlaceholderEnabled = document.getElementById('show_placeholder').checked;
    chrome.storage.sync.set({ 'show_placeholder': showPlaceholderEnabled });
}

// FILTERS

function loadWhitelist() {
    chrome.storage.sync.get('user_whitelist', function (result) {
        if (result?.user_whitelist != undefined) {
            document.getElementById('user_whitelist').value = result.user_whitelist;
        }
    });
}

function loadBlacklist() {
    chrome.storage.sync.get('user_blacklist', function (result) {
        if (result?.user_blacklist != undefined) {
            document.getElementById('user_blacklist').value = result.user_blacklist;
        }
    });
}

function saveUrlList(urlTextAreaId, savedItem) {
    let urls = document.getElementById(urlTextAreaId).value;
    if (validateCustomUrls(urls.split(/\r?\n/))) {
        let urlJson = {};
        urlJson[urlTextAreaId] = urls;
        chrome.storage.sync.set(urlJson, function () {
            if (chrome.runtime.lastError) {
                toastr.error(chrome.runtime.lastError.message, `${savedItem} Save Failed`);
            } else {
                toastr.success(`Your changes to the ${savedItem.toLowerCase()} have been saved.`, `${savedItem} Changes Saved`);
            }
        });
    } else {
        toastr.warning('One or more of your URLs are invalid.\r\n\r\nDouble-check them and try saving again.', `${savedItem} Save Failed`);
    }
}

function saveWhitelist() {
    saveUrlList('user_whitelist', 'Whitelist');
}

function saveBlacklist() {
    saveUrlList('user_blacklist', 'Blacklist');
}

function submitBlacklist() {
    let blacklistUrls = document.getElementById('user_blacklist').value;
    navigator.clipboard.writeText(blacklistUrls)
        .then(function () {
            window.open("https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=Blacklisted sites to consider adding&body=Here's my list of blacklisted sites to consider blocking by default.%0A%0A```%0A(THEY'RE ON YOUR CLIPBOARD. Just paste them here and replace this line.)%0A```%0A", '_blank');
            toastr.success("Another tab should open to GitHub, where you can paste the blacklist as a new issue.", "Submit Blacklist");
        })
        .catch(error => function () {
            window.open("https://github.com/grantwinney/hide-comments-everywhere/issues/new?title=Blacklisted sites to consider adding&body=Here's my list of blacklisted sites to consider blocking by default.%0A%0A```%0A(Copy them from the Options page, and paste them here replacing this line.)%0A```%0A", '_blank');
            toastr.warning("Copying the blacklist to your clipboard failed, so you'll have to copy and paste them into the GitHub issue manually.", "Submit Blacklist", { timeOut: 120000 });
            logError(error.message)
        });
}

// FOOTER

function showVersion() {
    let manifest = chrome.runtime.getManifest();
    let version = document.getElementById('version');
    version.innerHTML = `&copy; 2018 - ${(new Date()).getFullYear()}, ver ${manifest.version}`

    chrome.storage.local.get('definition_version', function (result) {
        if (result?.definition_version) {
            version.innerHTML += ` (${result.definition_version})`;
        }
    });
}

function wireUpSaveButtonsToTextAreas() {
    function wireUpListToSaveButton(listId, saveButtonId) {
        document.getElementById(listId).addEventListener('keydown', function (event) {
            if ((event.key === 's') && (event.metaKey || event.ctrlKey)) {
                let saveButton = document.getElementById(saveButtonId);
                if (saveButton && typeof saveButton.click === 'function') {
                    event.preventDefault();
                    saveButton.click();
                }
            }
        });
    }
    wireUpListToSaveButton('user_whitelist', 'save-whitelist');
    wireUpListToSaveButton('user_blacklist', 'save-blacklist');
}

window.addEventListener('DOMContentLoaded', function load(_event) {
    // Settings
    loadAllSettings();
    document.getElementById('one_click_toggle').addEventListener('click', function () { saveOneClickSetting(); });
    document.getElementById('remember_toggle').addEventListener('click', function () { saveRememberToggleSetting(); });
    document.getElementById('show_placeholder').addEventListener('click', function () { saveShowPlaceholderSetting(); });

    // Filters
    loadWhitelist();
    loadBlacklist();
    $('#save-whitelist').click(function () { saveWhitelist(); });
    $('#save-blacklist').click(function () { saveBlacklist(); });
    $('#submit-blacklist').click(function () { submitBlacklist(); });
    $('#filters-help-hint-1').click(function () { $('#filters-help-1').slideToggle(500); });
    $('#filters-help-hint-2').click(function () { $('#filters-help-2').slideToggle(500); });

    // Save Buttons
    wireUpSaveButtonsToTextAreas();

    // Updates
    $("#update-definitions").click(function () {
        getUpdatedDefinitions(true,
            (version) => { toastr.info(`Updated site definitions (#${version}) were found and have been applied.`, "Updated Sites Available"); },
            (version) => { toastr.info(`The latest site definitions (#${version}) are already applied.`, "No Updates Available"); }
        );
    });

    showVersion();
});
