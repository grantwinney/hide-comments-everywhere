function toggleElements(elements, isHiding) {
    for (var i = 0; i < elements.length; i++) {
        toggleElement(elements[i], isHiding);
    };
};

function toggleElement(element, isHiding) {
    if (element != undefined) {
        if (isHiding) {
            element.style.setProperty('display', 'none', 'important');
        } else {
            element.style.setProperty('display', '', '');
        }
    }
};

function isValidMatch(url, pattern) {
    var re = new RegExp(pattern);
    return re.test(url);
}

function storeSiteDefinitions() {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'https://raw.githubusercontent.com/grantwinney/hide-comments-in-chrome/master/sites.json', true);
    xobj.responseType = 'json';
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            chrome.storage.local.set({'site_patterns': xobj.response})
        }
    };
    xobj.send();
}
