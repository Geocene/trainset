// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import VueRouter from 'vue-router'
import Index from './components/Index'
import Help from './components/Help'
import Labeler from './components/Labeler'

require('expose-loader?$!expose-loader?jQuery!jquery')
require('jquery-csv')
require('popper.js')
require('bootstrap')
require('bootstrap/dist/css/bootstrap.min.css')

Vue.use(VueRouter)
const routes = [
	{ name: 'home', path: '/', component: Index, props: true },
	{ name: 'help', path: '/help', component: Help },
	{ name: 'labeler', path: '/labeler', component: Labeler, props: true }
]

const router = new VueRouter({
	routes,
	mode: 'history'
})

new Vue({
	el: '#app',
	template: '<App/>',
	components: { App },
	router
}).$mount('#app')
