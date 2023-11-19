// inspired by https://getbootstrap.com/docs/5.3/components/alerts/#examples

const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
const appendAlert = (message, type) => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible mt-3" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  alertPlaceholder.innerHTML = ''; // Clear existing alerts
  alertPlaceholder.append(wrapper);
  isAlertVisible = true;

}

const alertTriggers = document.querySelectorAll(".noAccessAlertBtn");
alertTriggers.forEach((alertTrigger) => {
    alertTrigger.addEventListener("click", () => {
        appendAlert('Je hebt geen toegang tot dit project.', 'warning');
    })
})
