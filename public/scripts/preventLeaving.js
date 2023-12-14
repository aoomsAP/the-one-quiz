let shouldBePrevented = false;

const submitButton = window.document.getElementById("questionSubmit");
submitButton.addEventListener("click", () => {
    shouldBePrevented = true;
})

window.addEventListener("beforeunload", (e) => {
    if (shouldBePrevented === false) {
        const message = "Ben je zeker dat je de pagina wilt verlaten? De quizgegevens gaan mogelijk verloren.";
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
});