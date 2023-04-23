$(document).ready(() => {
  const {App, Form, Card, Text} = initVueComponents(Vue)
  Vue.config.productionTip = true;
  Vue.config.devtools = true;

})

function displayQuestion(_vueObj) {
  let survey = _vueObj.surveys[_vueObj.sid]
  let question = survey.questions[_vueObj.session.qIndex]
  
  _vueObj.$refs.card.qAns = 0
  _vueObj.$refs.card.title = survey.name.replace(/[\n\r]/g, '')
  _vueObj.$refs.card.subtitle = survey.instructions.replace(/[\n\r]/g, '')
  _vueObj.$refs.card.question = question.q.replace(/[\n\r]/g, '')
  _vueObj.$refs.card.is_numerical = survey.numericalChoices
  _vueObj.$refs.card.horizontal_display = survey.horizontalDisplay

  if (survey.hasSameChoices) {
    let answers = []
    survey.answers.forEach((element) => {
      answers.push(element)
    });

    _vueObj.$refs.card.answers = answers
  } else {
    _vueObj.$refs.card.answers = question.as;
  }

  if (question.a)
    _vueObj.$refs.card.qAns = question.a
  
  _vueObj.page = 'vc-card'
}

function computeResults(sid, _vueObj) {
  return _vueObj.survey_results[sid].results[0]
}

function displayFinished(_vueObj) {
  let sid = _vueObj.sid

  if (_vueObj.sid == null) {
    sid = _vueObj._survey_keys[_vueObj._survey_keys.length - 1]
  }

  _vueObj.$refs.texts = null

  if (_vueObj.session.finished || (_vueObj.session.sid == null && _vueObj.settings.display_all_results_at_end)) {
    let texts = []
    let survey_results_keys = Object.keys(_vueObj.survey_results)

    for (i = survey_results_keys.length - 1; i >= 0; i--) {
      sid = _vueObj._survey_keys[i]
      let survey_results = computeResults(sid, _vueObj)

      texts.push({
        ifInput: false,
        title: _vueObj.surveys[sid].name.replace(/[\n\r]/g, ''),
        subtitle: survey_results.title.replace(/[\n\r]/g, ''),
        content: survey_results.text.replace(/[\n\r]/g, ''),
        additionalInfo: survey_results.additionalInfo
      })
    }

    _vueObj.$refs.text.texts = texts

  } else {
    let survey = _vueObj.surveys[sid]
    let survey_results = computeResults(sid, _vueObj)

    _vueObj.$refs.text.ifInput = false
    _vueObj.$refs.text.title = survey.name.replace(/[\n\r]/g, '')
    _vueObj.$refs.text.subtitle = survey_results.title.replace(/[\n\r]/g, '')
    _vueObj.$refs.text.content =  survey_results.text.replace(/[\n\r]/g, '')
    _vueObj.$refs.text.additionalInfo =  survey_results.additionalInfo
  }

  _vueObj.page = 'vc-text'
}

function saveSession(_vueObj, _db) {
  return new Promise((resolve, reject) => {
    _db.collection('sessions').doc(_vueObj.$refs.text.email).set(_vueObj.session).then((function (snap0) {
      resolve(snap0)
    }))
  })
}

function shallowCopy(jsonObj) {
  return JSON.parse(JSON.stringify(jsonObj))
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
        email: 'asd@asd.com',
        additionalInfo: "",
        texts: null
      }
    }
  })

  const Form = _V.component("vc-form", {
    template: "#vc-form",
    data() {
        return {
          page: "vc-text",
          action: "#",
          method: "POST",
          qid: null,
          sid: null,
          session: {},
          message: null,
          surveys: {},
          survey_results: {},
          disableNext: false,
          disablePrev: true,
          sessID: "",
          settings: {},
          _survey_keys: []
        }
      },
    mounted() {
      this.$refs.text.ifInput=true
      this.$refs.text.title="Welcome!"
      this._survey_keys = []

      // load from surveys from db
      db.collection('surveys').get().then(function (snap) {
        snap.forEach(function (doc) {
          this.surveys[doc.id] = doc.data()
          this._survey_keys.push(doc.id)

          if (this.session['surveys']) {
            this.session['surveys'][doc.id] = shallowCopy(doc.data())
          } else {
            this.session['surveys'] = {}
            this.session['surveys'][doc.id] = shallowCopy(doc.data())
          }
        }.bind(this))

        let fsID = Object.keys(this.surveys)[0]
        this.session['_survey_keys'] = this._survey_keys
        this.session['qid'] = this.surveys[fsID].questions[0].qid
        this.session['qIndex'] = 0

        this.session['sid'] = this.surveys[fsID].sid
        this.session['finished'] = false
      }.bind(this))

      db.collection('survey-results').get().then(function (snap) {
        snap.forEach(function (doc) {
          this.survey_results[doc.id] = doc.data()

          if (this.session['survey_results']) {
            this.session['survey_results'][doc.id] = shallowCopy(doc.data())
          } else {
            this.session['survey_results'] = {}
            this.session['survey_results'][doc.id] = shallowCopy(doc.data())
          }
        }.bind(this))
      }.bind(this))

      db.collection('settings').doc('main').get().then(function (snap) {
        this.settings = snap.data()

        this.$refs.text.content = this.settings.intro
      }.bind(this))
    },
    methods: {
      previousPage(event) {
        if (!this.disablePrev) {
          if (this.qid != null && !(this._survey_keys.indexOf(this.sid) == 0 && this.session.qIndex == 0)) {
            if (this.session.qIndex > 0) {
              this.session.qIndex--;
              this.qid = this.surveys[this.sid].questions[this.session.qIndex].qid

              if (this.session.qIndex == 0)
                this.disablePrev = true

              displayQuestion(this)
            }
          } else {
            this.disablePrev = true
          }
        }
      },

      nextPage(event) {
        event.preventDefault()

        if (!this.disableNext) {
          if (!this.session.finished) {
            // check for email
            if (this.qid == null && this.sid == null) {
              this.session['email'] = this.$refs.text.email
              this.sessID = this.session.email

              db.collection('sessions').doc(this.$refs.text.email).get().then((function (snap) {
                if (snap.exists) {
                  this.session = shallowCopy(snap.data())
                  this.surveys = shallowCopy(this.session['surveys'])
                  this.survey_results = shallowCopy(this.session['survey_results'])

                  this._survey_keys = shallowCopy(this.session['_survey_keys'])
                  
                  this.qid = this.session.qid
                  this.sid = this.session.sid

                  if (this.session.finished) {
                    this.disableNext = true
                    this.disablePrev = true

                    console.log("displayFinished 1")
                    displayFinished(this)
                  } else {
                    if (this.qid != null && !(this._survey_keys.indexOf(this.sid) == 0 && this.session.qIndex == 0))
                      this.disablePrev = false

                      if (this.sid != null && this.qid == null && this.session.qIndex == -1)
                        this.nextPage(event)
                      else
                        displayQuestion(this)
                  }
                  
                } else {
                  db.collection('sessions').doc(this.$refs.text.email).set(this.session).then((function (snap0) {
                    this.qid = this.session.qid
                    this.sid = this.session.sid
                    this.disablePrev = true
                    
                    displayQuestion(this)
                  }).bind(this))
                }
              }).bind(this))
            } 
            else if (this.qid != null && this.sid != null) {
              let _survey_key_ind = this.session._survey_keys.indexOf(this.session.sid)
              this.disablePrev = false

              if (this.session.qIndex == -1) {
                this.session.qIndex = 0
                // todo move to next survey
                this.sid = this.session.surveys[this.session._survey_keys[_survey_key_ind + 1]].sid
                this.session.sid = this.sid
                this.disablePrev = true

                saveSession(this, db).then(((snap) => {
                  displayQuestion(this)
                }).bind(this))
              } else {
                // todo answer survey
                this.session.surveys[this.sid].questions[this.session.qIndex].a = parseInt(this.$refs.card.qAns)
                this.surveys[this.sid].questions[this.session.qIndex].a = parseInt(this.$refs.card.qAns)

                // move to next question
                if (this.session.qIndex < this.session.surveys[this.session.sid].questions.length - 1) {
                  this.session.qIndex++
                  this.session.qid = this.session.surveys[this.session.sid].questions[this.session.qIndex].qid

                  this.qid = this.session.qid

                  saveSession(this, db).then(((snap) => {
                    displayQuestion(this)
                  }).bind(this))
                } 
                else if (this.session.qIndex >= this.session.surveys[this.session.sid].questions.length - 1 &&
                         this.session._survey_keys.indexOf(this.session.sid) >= this.session._survey_keys.length - 1) {
                  // move to finished
                  this.session.finished = true
                  this.session.sid = null
                  this.session.qid = null
                  this.session.qIndex = 0
                  
                  saveSession(this, db).then(((snap) => {
                    this.disableNext = true
                    this.disablePrev = true
                    this.sid = null
                    this.qid = null
                    
                    console.log("displayFinished 2")
                    displayFinished(this)
                  }).bind(this))
                }
                // move to next survey
                else {
                  this.disablePrev = true
                  this.session.qIndex = -1
                  this.session.qid = null
                  this.qid = null

                  saveSession(this, db).then(((snap) => {
                    this.nextPage(event)
                  }).bind(this))
                }
              }
            }
            // show final result or skip to next survey
            else if (this.sid != null) {
              let _survey_key_ind = this.session._survey_keys.indexOf(this.session.sid)
              
              if (_survey_key_ind > -1) {
                this.qid = this.session.surveys[this.session._survey_keys[_survey_key_ind + 1]].questions[0].qid
                this.session.qid = this.qid

                if (this.settings.display_results_after_survey) {
                  // display result for survey
                  this.disablePrev = true
                  console.log("displayFinished 3")
                  displayFinished(this)
                } else {
                  // move to next survey
                  this.disablePrev = true
                  this.nextPage(event)
                }
              }
            }
          } else {
            console.log("displayFinished 4")
            displayFinished(this)
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