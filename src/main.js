import Vue from 'vue'
import MintUI from 'mint-ui'
import { Row, Col } from 'element-ui'
import 'mint-ui/lib/style.css'
import 'element-ui/lib/theme-chalk/col.css'
import 'element-ui/lib/theme-chalk/row.css'
//import 'element-ui/lib/theme-chalk/select.css'
import App from './App.vue'

Vue.use(MintUI)
Vue.component(Row.name, Row)
Vue.component(Col.name, Col)

new Vue({
  el: '#app',
  components: { App },
  render: h => h(App)
})
