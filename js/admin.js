const DISPLAY_INTRO = "INTRO"
const DISPLAY_RESULT = "RESULT"
const DISPLAY_QUESTION = "QUESTION"
const RESULT_MAJORITY = "majority"
const RESULT_RANGE = "range"

$(document).ready(() => {  
  initVueComponents(Vue)
})

function getResults(_vueObj) {
  return new Promise(function (resolve, reject) {
    db.collection("sessions").get().then(function (snap) {
      let ret_data = []

      snap.forEach(element => {
        ret_data.push({
          email: element.id,
          ...element.data()
        })
      });
      
      ret_data.forEach(function (val, index) {
        if (ret_data[index].finished) {
          ret_data[index].complete_surveys = ret_data[index].surveys
        } else {
          let surveys = ret_data[index].surveys
          ret_data[index].complete_surveys = []

          surveys.forEach((survey, sid) => {
            if (!ret_data[index].answers[survey].some((v) => v === null))
              ret_data[index].complete_surveys.push(survey)
          })
        }

        ret_data[index].results = {}
        ret_data[index].complete_surveys.forEach(function (survey, ind) {
          ret_data[index].results[survey] = computeResults(survey, ret_data[index], _vueObj)
        })
      })

      resolve(ret_data)
    })
  })
}

function computeResult(sid, session, survey_results) {
  let compute_method = survey_results[sid].calculation
  let result_index = 0

  if (compute_method == RESULT_MAJORITY) {
    let mapping = {}
    let majority_key = 1

    session.answers[sid].forEach((val) => {
      if (mapping[val]) mapping[val]++
      else mapping[val] = 1
    })

    let mapping_keys = Object.keys(mapping)
    majority_key = mapping_keys[0]
    mapping_keys.forEach((key, ind) => {
      if (mapping[key] > mapping[majority_key])
        majority_key = key
    })

    survey_results[sid].results.forEach((result, index) => {
      if (result.range[0] == majority_key) result_index = index
    })

  } else if (compute_method == RESULT_RANGE) {
    let total = 0

    session.answers[sid].forEach((val) => {
      if (val != null)
        total += val
    })

    survey_results[sid].results.forEach((result, index) => {
      if (total >= result.range[0] && total <= result.range[1]) {
        result_index = index
      }
    })
  }

  return result_index
}

function computeResults(sid, session, _vueObj) {
  let compute_method = _vueObj.survey_results[sid].calculation
  let result_index = 0

  if (compute_method == RESULT_MAJORITY) {
    let mapping = {}
    let majority_key = 1

    session.answers[sid].forEach((val) => {
      if (mapping[val]) mapping[val]++
      else mapping[val] = 1
    })

    let mapping_keys = Object.keys(mapping)
    majority_key = mapping_keys[0]
    mapping_keys.forEach((key, ind) => {
      if (mapping[key] > mapping[majority_key])
        majority_key = key
    })

    _vueObj.survey_results[sid].results.forEach((result, index) => {
      if (result.range[0] == majority_key) result_index = index
    })

  } else if (compute_method == RESULT_RANGE) {
    let total = 0

    session.answers[sid].forEach((val) => {
      if (val != null)
        total += val
    })

    _vueObj.survey_results[sid].results.forEach((result, index) => {
      if (total >= result.range[0] && total <= result.range[1]) {
        result_index = index
      }
    })
  }

  return _vueObj.survey_results[sid].results[result_index]
}

function toggleLoading() {
  $(".loading").toggleClass("active")
}

function shallowCopy(jsonObj) {
  return JSON.parse(JSON.stringify(jsonObj))
}

function initVueComponents(_V) {
  const ResultData = _V.component("vc-result-data", {
    template: "#vc-result-data",
    data() {
      return {
        all_data: [],
        survey_results: {},
        survey: [],
        result: null,
        learning_style_chart: null,
        self_efficacy_chart: null
      }
    },
    mounted() {
      this.$root.$on("initialise", this.initialise)

      this.$root.$on("load", this.load)
    },
    computed: {
      avgSelfEfficacyScore() {
        let val = 0
        let finished = 0

        this.all_data.forEach(function (data) {
          if (data.finished) {
            let sum = data.answers['self-efficacy-test'].reduce((prev, curr) => prev+curr, 0)

            val += sum
            finished++
          }
        }.bind(this))

        if (finished > 0){
          let avg = val / finished
          let desc = ""

          if (avg >= 10 && avg <= 20) desc = "Low"
          else if (avg > 20 && avg <= 39) desc = "Average"
          else if (avg >= 40) desc = "High"

          return (val / finished) + " (" + desc + ")"
        } else
          return null
      },
      avgSelfEfficacy() {
        let efficacies = {0: 0, 1: 0, 2:0}
        let finished = 0
        let avgIndex = 0

        this.all_data.forEach(function (data) {
          if (data.finished) {
            let sum = data.answers['self-efficacy-test'].reduce((prev, curr) => prev+curr, 0)

            if (sum >= 10 && sum <= 20) efficacies[0]++
            else if (sum > 20 && sum <= 39) efficacies[1]++
            else if (sum >= 40) efficacies[2]++
            finished++
          }
        }.bind(this))

        if (finished > 0){
          for (i = 1; i < 3; i++)
            if (efficacies[i] > efficacies[avgIndex])
              avgIndex = i

          if (avgIndex == 0) return "Low Self-efficacy"
          else if (avgIndex == 1) return "Average Self-efficacy"
          else if (avgIndex == 2) return "High Self-efficacy"

            return null
        } else
          return null
      },
      avgLearnStyle() {
        let styles = {0: 0, 1: 0, 2: 0}
        let avgIndex = 0;
        let finished = 0

        this.all_data.forEach(function (data) {
          if (data.finished) {
            let index = computeResult("learning-style-test", data, this.survey_results)

            styles[index]++
            finished++
          }
        }.bind(this))

        for (i = 1; i < 3; i++)
          if (styles[i] > styles[avgIndex])
            avgIndex = i
        
        if (finished > 0)
          return this.survey_results['learning-style-test'].results[avgIndex].title
        else
          return null
      }
    },
    methods: {
      initialise(surveys, survey_results, all_data) {
        let lsDataset = [0, 0, 0]
        var barColors = [
          "#b91d47",
          "#00aba9",
          "#2b5797",
          "#e8c3b9"
        ];

        let seDataset = [0, 0, 0]

        this.surveys = surveys
        this.survey_results = survey_results
        this.all_data = all_data
        
        this.all_data.forEach(function (data) {
          let res = null

          if (data.complete_surveys.includes("learning-style-test")) {
            res = computeResult("learning-style-test", data, this.survey_results)

            if (res != null)
              lsDataset[res]++
          }

          if (data.complete_surveys.includes("self-efficacy-test")) {
            res = computeResult("self-efficacy-test", data, this.survey_results)

            if (res != null)
              seDataset[res]++
          }
        }.bind(this))

        this.learning_style_chart = new Chart("learning_style_chart", {
          type: "pie",
          data: {
            labels: ["Visual", "Auditory", "Kinesthetic"],
            datasets: [{
              backgroundColor: barColors,
              data: lsDataset
            }]
          },
          options: {
            title: {
              display: true,
              text: "Learning Style"
            }
          }
        })

        this.self_efficacy_chart = new Chart("self_efficacy_chart", {
          type: "pie",
          data: {
            labels: ["Low", "Average", "High"],
            datasets: [{
              backgroundColor: barColors,
              data: seDataset
            }]
          },
          options: {
            title: {
              display: true,
              text: "Self-efficacy Level"
            }
          }
        })

        console.log("ResultData initialised...")
      },

      load(result) {
        this.result = result
      }
    }
  })

  const ResultsList = _V.component("vc-results-list",
  {
    template: "#vc-results-list",
    data() {
      return {
        surveys: {},
        survey_keys: [],
        results: [],
        display_results: [],
        survey_results: {},
        curr_page: 1,
        limit: 10,
        q: '',
      } 
    },
    mounted() {
      toggleLoading()

      // load from surveys from db
      db.collection('surveys').get().then(function (snap) {
        snap.forEach(function (doc) {
          this.surveys[doc.id] = shallowCopy(doc.data())
          this.survey_keys.push(doc.id)
        }.bind(this))

      }.bind(this))

      db.collection('survey-results').get().then(function (snap) {
        snap.forEach(function (doc) {
          this.survey_results[doc.id] = doc.data()
        }.bind(this))

      }.bind(this)).then(function () {
        getResults(this).then(function (data) {
          this.results = data
          this.display_results = shallowCopy(this.results.slice(0, this.limit))

          this.$root.$emit("initialise", shallowCopy(this.surveys), shallowCopy(this.survey_results), shallowCopy(this.results))
          toggleLoading()
        }.bind(this))
      }.bind(this))
    },
    computed:  {
      pages() {
        return Math.ceil(this.results.length / this.limit)
      }
    },
    methods: {
      search() {
        toggleLoading()
        getResults(this).then(function(data) {
          let _results = data
          let condition = new RegExp(this.q)

          _results = _results.filter((el) => condition.test(el.email))
          
          this.results = _results
          this.curr_page = 1
          this.page = 1

          this.display_results = shallowCopy(this.results.slice(0, this.limit))
          toggleLoading()
        }.bind(this))
      },
      selectPage(page) {
        let start = (page - 1) * this.limit

        this.display_results = shallowCopy(this.results.slice(start, start + this.limit))

        this.curr_page = page
      },

      loadResult(result) {
        this.$root.$emit("load", shallowCopy(result))
      }
    }
  })

  
  return {
    App: new _V({
      el: "#app"
    }),
    ResultsList,
  }
}