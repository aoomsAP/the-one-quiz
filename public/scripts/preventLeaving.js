let shouldBePrevented = false;

// If submit button is clicked, the "beforeunload" event should be prevented
const submitButton = window.document.getElementById("questionSubmit");
submitButton.addEventListener("click", () => {
    shouldBePrevented = true;
})

// If user clicks any other link on the page, page loading should be briefly prevented,
// as the user needs to be warned that they are leaving an active quiz, which may have unintended effects
window.addEventListener("beforeunload", (e) => {
    if (shouldBePrevented === false) {
        const message = "Ben je zeker dat je de pagina wilt verlaten? De quizgegevens gaan mogelijk verloren.";
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
});