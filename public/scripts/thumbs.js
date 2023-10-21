// inspired by https://stackoverflow.com/questions/9709209/html-select-only-one-checkbox-in-a-group

function onlyOneThumb(checkbox) {
    var thumbs = document.getElementsByName('btnThumbs');
    if (thumbs[0].checked && thumbs[1].checked) {
        $("#collapseComment").collapse("hide"); // requires JQuery
    }
    thumbs.forEach((thumb) => {
        if (thumb != checkbox) thumb.checked = false;
    })
}