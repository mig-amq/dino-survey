$(document).ready(() => {
  initVueComponents()
})

function getResults() {
  return new Promise((resolve, reject) => {
    db.collection("survey-results").get().then((snap) => {
      let ret_data = []

      snap.forEach(element => {
        ret_data.push = {
          email: element.id,
          ...element.data()
        }
      });

      resolve(ret_data)
    })
  })
}

function toggleLoading() {
  $(".loading").toggleClass("active")
}

function initVueComponents() {
  const ResultsList = Vue.component("vc-results-list",
  {
    template: "#vc-results-list",
    data() {
      return {
        results: [],
        display_results: [],
        page: 1,
        curr_page: 1,
        limit: 15,
        q: '',
      } 
    },
    mounted() {
      getResults().then(function (data) {
        this.results = data.slice(0, this.limit + 1)
        this.display_results = shallowCopy(this.results)
      }.bind(this))
    },
    computed:  {
      pages() {
        return Math.ceil(this.results.length / this.limit)
      }
    },
    methods: {
      search() {
        getResults().then(function(data) {
          let _results = data
          let condition = new RegExp(this.q)

          _results = _results.filter((el) => condition.test(el.email))
          
          this.results = _results
          this.curr_page = 1
          this.page = 1

          this.display_results = shallowCopy(this.results.slice(0, this.limit + 1))
        }.bind(this))
      },
      selectPage(page) {
        let start = this.page * this.limit
        this.display_results = shallowCopy(this.results.slice(starst, start + this.limit + 1))

        this.curr_page = page
      }
    }
  })
}