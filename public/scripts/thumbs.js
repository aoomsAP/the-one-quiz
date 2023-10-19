// inspired by https://stackoverflow.com/questions/9709209/html-select-only-one-checkbox-in-a-group

function onlyOneThumb(checkbox) {
    var thumbs = document.getElementsByName('btnThumbs');
    thumbs.forEach((thumb) => {
        if (thumb != checkbox) thumb.checked = false
    })
}