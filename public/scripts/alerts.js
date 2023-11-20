// inspired by https://getbootstrap.com/docs/5.3/components/alerts/#examples

const alertPlaceholder = document.getElementById("accessDeniedOtherProjects");
const appendAlert = (message, type) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">`,
    `   <p>${message}</p>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  alertPlaceholder.innerHTML = ""; // Clear existing alerts
  alertPlaceholder.append(wrapper);
  isAlertVisible = true;

}

// alert for all projects other than LOTR
const alertTriggers = document.querySelectorAll(".noAccessAlertBtn");
alertTriggers.forEach((alertTrigger) => {
    alertTrigger.addEventListener("click", () => {
        appendAlert("Je hebt geen toegang tot dit project.", "danger");
    })
});

// alert for LOTR if you are not logged in (user is null)
const alertTrigger = document.getElementById("accessDeniedWithoutLoginBtn");
if (alertTrigger) {
  alertTrigger.addEventListener("click", () => {
    const message = "Meld je aan om toegang te krijgen tot het project 'Lord of the Rings'.";
    appendAlert(message, "danger");
  });
}