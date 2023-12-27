// Inspired by https://stackoverflow.com/questions/9709209/html-select-only-one-checkbox-in-a-group

function onlyOneThumb(checkbox) {
    var thumbs = document.getElementsByName('btnThumbs');

    // If user hits blacklist button & then favorites button, blacklist comment field should be hidden
    if (thumbs[0].checked && thumbs[1].checked) {
        $("#collapseComment").collapse("hide"); // requires JQuery
    }

    // If one button is checked, other button should be unchecked
    thumbs.forEach((thumb) => {
        if (thumb != checkbox) thumb.checked = false;
    })

    // "Required" property for blacklist comment should only be present if blacklist button is checked
    if (thumbs[0].checked) {
        document.getElementById('blacklistComment').removeAttribute("required");
    } else if (thumbs[1].checked) {
        document.getElementById('blacklistComment').setAttribute("required", "");
    } else {
        document.getElementById('blacklistComment').removeAttribute("required");
    }
}