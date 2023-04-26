$(document).ready(() => {

})

function getResults() {
  return new Promise((resolve, reject) => {
    db.collection("survey-results").get().then((snap) => {
      return shallowCopy(snap.data())
    })
  })
}

function toggleLoading() {
  $(".loading").toggleClass("active")
}