<template>
  <div class="container">
    <nav class="navbar navbar-expand-lg fixed-top">
      <h1 class="navbar-brand"><router-link class="homeLink" v-bind:to="'/'">TRAINSET<img id="logo" src="/static/trainset_logo.png"></router-link></h1>
      <div class="navbar-nav ml-auto">
        <router-link class="nav-link" v-bind:to="'/help'">Help</router-link>
        <router-link class="nav-link" v-bind:to="'/license'">License</router-link>
      </div>
    </nav>
    <div id="info">
	    <h5 class="subh">MIT License</h5>

      Copyright (c) 2019 Geocene Inc. </br></br>

      Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</br></br>

      The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. </br></br>

      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    </div>
  </div>
</template>

<style>
#title { color: #7E4C64; font-weight: bold; }
#info { text-align: left; padding-left: 100px; }
.subh { color: #7E4C64; font-weight: 500; }
</style>