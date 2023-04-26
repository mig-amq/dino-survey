const DISPLAY_INTRO = "INTRO"
const DISPLAY_RESULT = "RESULT"
const DISPLAY_QUESTION = "QUESTION"
const RESULT_MAJORITY = "majority"
const RESULT_RANGE = "range"

Vue.config.productionTip = true;
Vue.config.devtools = true;

function random_rgba() {
  var o = Math.round, r = Math.random, s = 255;
  return 'rgb(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ')';
}

$(document).ready(() => {
  const {App, Form, Card, Text} = initVueComponents(Vue)
})

function displayQuestion(_vueObj) {
  console.log("Displaying: Question " + _vueObj.session.current_survey + "-" + _vueObj.session.current_question)
  console.log("Next Page: Page " + _vueObj.session.next_page)

  let aCharCode = 65
  let survey = shallowCopy(_vueObj.surveys[_vueObj.session.current_survey])
  let question = shallowCopy(survey.questions[_vueObj.session.current_question])

  _vueObj.$refs.card.qAns = 1
  _vueObj.$refs.card.title = survey.name.replace(/\r\n/g, '<br/>')
  _vueObj.$refs.card.subtitle = survey.instructions.replace(/\r\n/g, '<br/>')
  _vueObj.$refs.card.question = question.q.replace(/\r\n/g, '<br/>')
  _vueObj.$refs.card.is_numerical = survey.numericalChoices
  _vueObj.$refs.card.horizontal_display = survey.horizontalDisplay

  if (survey.hasSameChoices) {
    let answers = []
    survey.answers.forEach((element) => {
      answers.push(element)
    });

    if (survey.numericalChoices) {
      answers.forEach((val, index) => {
        answers[index] = {
          val: val,
          prefix: (index + 1) + " - "
        }
      })
    } else {
      answers.forEach((val, index) => {
        answers[index] = {
          val: val,
          prefix: String.fromCharCode(aCharCode + index) + ". "
        }
      })
    }

    _vueObj.$refs.card.answers = answers
  } else {
    
    if (survey.numericalChoices) {
      question.as.forEach((val, index) => {
        question.as[index] = {
          val: val,
          prefix: (index + 1) + " - "
        }
      })
    } else {
      question.as.forEach((val, index) => {
        question.as[index] = {
          val: val,
          prefix: String.fromCharCode(aCharCode + index) + ". "
        }
      })
    }

    _vueObj.$refs.card.answers = question.as;
  }

  if (_vueObj.session.answers[survey.sid][_vueObj.session.current_question])
    _vueObj.$refs.card.qAns = _vueObj.session.answers[survey.sid][_vueObj.session.current_question]

  _vueObj.shownPage = 'card'
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function displayPage(_vueObj) {
  console.log("Displaying: Page " + _vueObj.session.current_survey)
  console.log("Next Page: Page " + _vueObj.session.next_page)

  _vueObj.shownPage = _vueObj.session.current_survey
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function answerQuestion(_vueObj) {
  console.log("Answered: ", _vueObj.session.current_question, " with " + _vueObj.$refs.card.qAns)
  console.log("Next Page: Page " + _vueObj.session.next_page)

  if (_vueObj.$refs.card.qAns != null)
    _vueObj.session.answers[_vueObj.session.current_survey][_vueObj.session.current_question] = _vueObj.$refs.card.qAns
}

function computeResults(sid, _vueObj) {
  let compute_method = _vueObj.survey_results[sid].calculation
  let result_index = 0

  if (compute_method == RESULT_MAJORITY) {
    let mapping = {}
    let majority_key = 1

    _vueObj.session.answers[sid].forEach((val) => {
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

    _vueObj.session.answers[sid].forEach((val) => {
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

function validateEmail(mail) 
{
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
  {
    return (true)
  }
    return (false)
}

function displayResults(_vueObj) {
  console.log("Displaying: Results " + _vueObj.session.current_survey)
  console.log("Next Page: Page " + _vueObj.session.next_page)

  let current_survey = _vueObj.session.current_survey

  let subtitle = ""
  _vueObj.$refs.texts = null

  if (_vueObj.session.finished && _vueObj.settings.display_all_results_at_end) {
    let texts = []
    let survey_results_keys = Object.keys(_vueObj.survey_results)

    for (i = survey_results_keys.length - 1; i >= 0; i--) {
      current_survey = _vueObj.survey_keys[i]
      let survey_results = computeResults(current_survey, _vueObj)
      subtitle = ""

      if (current_survey == "self-efficacy-test") {
        let sum = _vueObj.session.answers[current_survey].reduce((prev, curr) => prev + curr, 0)
        subtitle = "You got a self-efficacy score of " + sum + " out of 50"
      }

      texts.push({
        ifInput: false,
        title: _vueObj.surveys[current_survey].name.replace(/\r\n/g, '<br/>'),
        subtitle: subtitle,
        content: survey_results.text.replace(/\r\n/g, '<br/>'),
        additionalInfo: survey_results.additionalInfo,
        image: survey_results.image
      })
    }

    _vueObj.$refs.text.texts = texts

  } else {
    let survey = _vueObj.surveys[current_survey]
    let survey_results = computeResults(current_survey, _vueObj)

    if (current_survey == "self-efficacy-test") {
      let sum = _vueObj.session.answers[current_survey].reduce((prev, curr) => prev + curr, 0)
      subtitle = "You got a self-efficacy score of " + sum + " out of 50"
    }

    _vueObj.$refs.text.ifInput = false
    _vueObj.$refs.text.title = survey.name.replace(/\r\n/g, '<br/>')
    _vueObj.$refs.text.subtitle = subtitle
    _vueObj.$refs.text.content =  survey_results.text.replace(/\r\n/g, '<br/>')
    _vueObj.$refs.text.additionalInfo =  survey_results.additionalInfo
    _vueObj.$refs.text.image = survey_results.image
  }

  // _vueObj.page = 'vc-text'
  document.body.scrollTop = document.documentElement.scrollTop = 0;
  _vueObj.shownPage = 'text'
}

function saveSession(_vueObj, _db) {
  toggleLoading()
  let prevStat = _vueObj.disablePrev
  let nextStat = _vueObj.disableNext

  _vueObj.disableNext = true
  _vueObj.disablePrev = true

  if (!_vueObj.fromPrevious) {
    return new Promise((resolve, reject) => {
      _db.collection('sessions').doc(_vueObj.$refs.text.email).set(_vueObj.session).then((function (snap0) {
        _vueObj.disableNext = nextStat
        _vueObj.disablePrev = prevStat
        toggleLoading()
        resolve(snap0)
      }))
    })
  } else {
    return new Promise((resolve, reject) => {
      _db.collection('sessions').doc(_vueObj.$refs.text.email).update({
        answers: _vueObj.session.answers
      }).then((function (snap0) {
        _vueObj.disableNext = nextStat
        _vueObj.disablePrev = prevStat
        toggleLoading()
        resolve(snap0)
      }))
    })
  }
}

function shallowCopy(jsonObj) {
  return JSON.parse(JSON.stringify(jsonObj))
}

function toggleLoading() {
  $(".loading").toggleClass("active")
}

function initVueComponents(_V) {
  const Card = _V.component("vc-card", {
    template: "#vc-card",
    data() {
      return {
        qid: "",
        sid: "",
        title: "",
        question: null,
        answers: null,
        subtitle: null,
        is_numerical: false,
        horizontal_display: false,
        ans: null,
        qAns: 0
      }
    }
  })

  const Text = _V.component("vc-text", {
    template: "#vc-text",
    data() {
      return {
        title: "",
        subtitle: "",
        content: "",
        ifInput: null,
        email: '',
        additionalInfo: "",
        texts: null,
        image: null
      }
    }
  })

  const Form = _V.component("vc-form", {
    template: "#vc-form",
    data() {
        return {
          page: "vc-text",
          session: {},
          message: null,
          disableNext: false,
          disablePrev: true,
          shownPage: 'text',
          settings: {},
          surveys: {},
          survey_keys: [],
          survey_results: {},
          fromPrevious: false
        }
      },
    mounted() {
      this.$refs.text.ifInput=true
      this.$refs.text.title="Welcome!"
      this.survey_keys = []
      toggleLoading()

      // load from surveys from db
      db.collection('surveys').get().then(function (snap) {
        this.session.answers = {}
        
        snap.forEach(function (doc) {
          this.surveys[doc.id] = shallowCopy(doc.data())
          this.survey_keys.push(doc.id)

          this.session.answers[doc.id] = []

          this.surveys[doc.id].questions.forEach(function () {
            this.session.answers[doc.id].push(null)
          }.bind(this))
        }.bind(this))

        this.session.surveys = this.survey_keys

        this.session.current_question = null
        this.session.next_question = null

        this.session.current_page = null
        this.session.next_page = null

        this.session.current_survey = null
        this.session.next_survey = null

        this.session.finished = false

      }.bind(this))

      db.collection('survey-results').get().then(function (snap) {
        snap.forEach(function (doc) {
          this.survey_results[doc.id] = doc.data()
        }.bind(this))
      }.bind(this))

      db.collection('settings').doc('main').get().then(function (snap) {
        this.settings = snap.data()

        this.$refs.text.content = this.settings.intro
        toggleLoading()
      }.bind(this))
    },
    methods: {
      previousPage(event) {
        if (!this.disablePrev) {
          if (!this.session.finished) {
            if (this.session.current_page != DISPLAY_RESULT) {
              if (this.session.current_page == DISPLAY_INTRO) {
                // check if went past a results page
                let curr_survey_index = this.session.surveys.indexOf(this.session.current_survey)

                if (this.settings.display_results_after_survey && curr_survey_index > 0) {
                  // display results page from previous survey
                  let prev_survey_index = curr_survey_index - 1

                  if (prev_survey_index >= 0) {
                    this.session.current_page = DISPLAY_RESULT
                    this.session.next_page = DISPLAY_INTRO
                    
                    this.session.next_survey = this.session.current_survey
                    this.session.current_survey = this.session.surveys[prev_survey_index]
                  }
                  
                  this.disablePrev = true
                  this.fromPrevious = true
                  displayResults(this)
                }
              } else if (this.session.current_page == DISPLAY_QUESTION) {
                // check if previous page was an intro page or a question
                let curr_survey_index = this.session.surveys.indexOf(this.session.current_survey)
                if (this.session.current_question > 0) {
                  // go back to intro
                  this.session.current_page = DISPLAY_QUESTION
                  this.session.next_page = DISPLAY_QUESTION
                  
                  this.session.next_question = this.session.current_question
                  this.session.current_question = this.session.current_question - 1

                  this.disablePrev = false
                  this.fromPrevious = true
                  displayQuestion(this)
                } else {
                  this.session.current_page = DISPLAY_INTRO
                  this.session.next_page = DISPLAY_QUESTION
                  
                  if (curr_survey_index <= 0) 
                    this.disablePrev = true

                  this.fromPrevious = true
                  displayPage(this)
                }
              }
            }
          }
        }
      },

      nextPage(event) {
        if (this.$refs.text.email && !this.disableNext){
          this.$refs.text.email = this.$refs.text.email.trim()

          if (this.$refs.text.email.length > 0 && validateEmail(this.$refs.text.email)) {
            this.message = null
            if (!this.session.finished) {
              if (this.session.next_page == DISPLAY_INTRO) {
                // display intro for survey
                // check if came from landing page
                if (this.session.current_page == null) {
                  this.session.current_survey = this.session.surveys[0]

                  if (this.session.surveys.length > 1)
                    this.session.next_survey = this.session.surveys[1]

                    this.disablePrev = true
                } else {
                  if (this.session.current_page == DISPLAY_QUESTION) {
                    this.fromPrevious = false
                    answerQuestion(this)
                  } else if (this.session.current_page == DISPLAY_RESULT) {
                    this.session.current_survey = this.session.next_survey

                    // move to next survey
                    this.session.current_survey = this.session.next_survey
                    let curr_survey_index = this.session.surveys.indexOf(this.session.current_survey)

                    if (curr_survey_index != -1 && curr_survey_index + 1 < this.session.surveys.length) {
                      this.session.next_survey = this.session.surveys[curr_survey_index]
                    } else {
                      this.session.next_survey = null
                    }

                    if (curr_survey_index > 0)
                      this.disablePrev = false
                    else
                      this.disablePrev = true
                  }
                }

                this.session.current_page = DISPLAY_INTRO
                this.session.next_page = DISPLAY_QUESTION
                saveSession(this, db).then(function (snap0) {
                  displayPage(this)
                }.bind(this))
              } else if (this.session.next_page == DISPLAY_QUESTION) {
                // check if came from intro page
                if (this.session.current_page == DISPLAY_INTRO || this.session.current_page == DISPLAY_RESULT) {
                  // display initial question only
                  this.session.current_page = DISPLAY_QUESTION
                  this.session.current_question = 0
                  this.session.next_question = 1

                  saveSession(this, db).then(function (snap0) {
                    this.disablePrev = false
                    displayQuestion(this)
                  }.bind(this));
                } else if (this.session.current_page == DISPLAY_QUESTION) {
                  // came from previous question
                  // todo answer previous question
                  this.fromPrevious = false
                  answerQuestion(this)

                  this.session.current_question = this.session.next_question
                  this.session.next_question = this.session.current_question + 1
                  if (this.session.next_question >= this.surveys[this.session.current_survey].questions.length) {
                    if(this.settings.display_results_after_survey) {
                      this.session.next_page = DISPLAY_RESULT
                    } else {
                      this.session.next_page = DISPLAY_INTRO
                    }
                  }
                  
                  saveSession(this, db).then(function (snap0) {
                    this.disablePrev = false
                    displayQuestion(this)
                  }.bind(this));
                }
              } else if (this.session.next_page == DISPLAY_RESULT) {
                if (this.session.current_page == DISPLAY_QUESTION) {
                  this.fromPrevious = false
                  answerQuestion(this)

                  // check if came from final question
                  if (this.session.next_question >= this.surveys[this.session.current_survey].questions.length) {
                    // check if in final survey
                    if (this.session.next_survey == null) {
                      this.session.finished = true
                      this.session.next_page = null
                      this.session.next_question = null

                      this.disableNext = true
                    } else {
                      this.session.next_page = DISPLAY_INTRO
                    }
                  } else {
                    this.session.next_page = DISPLAY_INTRO
                  }
                }
                
                this.session.current_page = DISPLAY_RESULT
                saveSession(this, db).then(function (snap0) {
                  this.disablePrev = true
                  displayResults(this)
                }.bind(this));
              } else {
                // current_page is null means landing page was displayed
                db.collection('sessions').doc(this.$refs.text.email).get().then((function (snap) {
                  if (snap.exists) {
                    this.session = shallowCopy(snap.data())

                    if (this.session.finished) {
                      this.disableNext = true
                      this.disablePrev = true
                      displayResults(this)
                    } else if (this.session.current_page == DISPLAY_QUESTION){
                      this.disableNext = false
                      this.disablePrev = false
                      displayQuestion(this)
                    } else if (this.session.current_page == DISPLAY_INTRO) {
                      if (Object.keys(this.session.surveys)[0] == this.session.current_survey) {
                        this.disablePrev = true
                      } else {
                        this.disablePrev = false
                      }
                      
                      displayPage(this)
                    } else if (this.session.current_page == DISPLAY_RESULT) {
                      displayResults(this)
                    }
                  } else {
                    db.collection('sessions').doc(this.$refs.text.email).set(this.session).then((function (snap0) {
                      this.session.current_page = null
                      this.session.next_page = DISPLAY_INTRO
                      
                      this.nextPage(this)
                    }).bind(this))
                  }
                }).bind(this))
              }
            } else {
              displayResults(this)
            }
          } else {
            this.message = {
              type: 'error',
              text: 'A valid email address must be entered.'
            }
          }
        } else {
          this.message = {
            type: 'error',
            text: 'Email address is required.'
          }
        }
      },

      load(event) {
        
      }
    }
  })

  return {
    App: new _V({
      el: "#app"
    }),
    Form,
    Card, 
    Text
  }
}