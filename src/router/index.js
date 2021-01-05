import Vue from 'vue'
import VueRouter from 'vue-router'

// router components
import Index from '@/views/Index'
import Help from '@/views/Help'
import Labeler from '@/views/Labeler'
import License from '@/views/License'

Vue.use(VueRouter)

const routes = [
  { name: 'home', path: '/', component: Index, props: true },
  { name: 'help', path: '/help', component: Help },
  { name: 'license', path: '/license', component: License },
  { name: 'labeler', path: '/labeler', component: Labeler, props: true }
]

export default new VueRouter({
  routes,
  mode: 'history'
})
