import Vue from 'vue'
import App from './App.vue'
import 'reset-css'
import 'vuetify/dist/vuetify.min.css'
import Vuetify from 'vuetify'
import VueNumberInput from '@chenfengyuan/vue-number-input'

Vue.use(VueNumberInput)
Vue.use(Vuetify)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
