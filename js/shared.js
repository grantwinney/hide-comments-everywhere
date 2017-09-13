function toggleElements(elements, displayValue) {
    for (var i = 0; i < elements.length; i++) {
        toggleElement(elements[i], displayValue);
    };
};

function toggleElement(element, displayValue) {
    if (element != undefined) {
        element.style.setProperty("display", displayValue, "important");
    }
};

function getMatchPatternParts(url) {
    var parts = url.split("://");
    var hostAndPath = parts[1].split(/\/(.+)/);

    var scheme = parts[0];
    var host = hostAndPath[0];
    var path = '/' + (hostAndPath[1] != undefined ? hostAndPath[1] : '');

    return [scheme, host, path];
}

function isValidMatchPattern(url) {
    try {
        if (url === '' || url == "<all_urls>") {
            return true;
        }

        var parts = getMatchPatternParts(url);
        var scheme = parts[0];
        var host = parts[1];
        var path = parts[2];

        return ((scheme === '*' || scheme === 'http' || scheme === 'https' || scheme === 'file' || scheme === 'ftp')
                && (host === '*'
                    || (host.startsWith("*.") && host.length > 0 && host.substring(1).indexOf('/') === -1 && host.substring(1).indexOf('*') === -1)
                    || (host.length > 0 && host.indexOf('/') === -1 && host.indexOf('*') === -1))
                && (path.startsWith('/')));
    } catch (e) {
        return false;
    }
}
