$(document).ready(() => {
  const {App, Form, Card, Text} = initVueComponents(Vue)
  Vue.config.productionTip = true;
  Vue.config.devtools = true;

})

function initVueComponents(_V) {
  const Card = _V.component("vc-card", {
    template: "#vc-card",
    data() {
      return {
        qid: "",
        sid: "",
        title: "",
        question: "",
        answers: {}
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
          session: null,
          message: null,
          questions: [],
          disableNext: false,
          disablePrev: true
        }
      },
    mounted() {
      this.$refs.text.ifInput=true
      this.$refs.text.title="Welcome!"
      // load from db

    },
    methods: {
      previousPage(event) {
        if (!this.disablePrev) {
          
        }
      },

      nextPage(event) {
        if (!this.disableNext) {
          if (this.qid == null) {
            // check for email
            
            if (this.page != "vc-card")
              this.page = "vc-card"
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