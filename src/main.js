import Vue from 'vue'
import MintUI from 'mint-ui'
import 'mint-ui/lib/style.css'
import App from './App.vue'

Vue.use(MintUI)
Vue.component(Row.name, Row)
Vue.component(Col.name, Col)

var vm = new Vue({
  el: '#app',
  components: { App },
  render: h => h(App)
});
