<template>
  <div class="container">
    <nav class="navbar navbar-expand-lg fixed-top"> 
      <h1 class="navbar-brand"><router-link class="homeLink" v-bind:to="'/'">TRAINSET</router-link></h1>
      <div class="navbar-nav ml-auto">
        <router-link class="nav-link" v-bind:to="'/help'">Help</router-link>
      </div>
    </nav>
    <h3 id="welcome">Template help page</h3>
  </div>
</template>