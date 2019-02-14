import Vue from 'vue'
import App from './App'
import VueRouter from 'vue-router'
import Index from './components/Index'
import Help from './components/Help'
import Upload from './components/Upload'
import Labeler from './components/Labeler'

require('expose-loader?$!expose-loader?jQuery!jquery')
require('script-loader!jquery-csv')

Vue.use(VueRouter)
const routes = [
	{ path: '/', component: Index },
	{ path: '/help', component: Help },
	{ name: 'upload', path: '/upload', component: Upload, props: true },
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