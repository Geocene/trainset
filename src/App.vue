<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 65px !important;
}
.navbar { background:#7E4C64; }
.nav-link , .navbar-brand { color: #f4f4f4; cursor: pointer; }
.nav-link { margin-right: 1em !important; }
.nav-link:hover { background: #f4f4f4; color: #7E4C64; }
.navbar-toggler { background:#fff !important; }
.navbar-nav { float: right; }
.container { display: inline-block; padding-top: 75px !important; padding-right: 15px; padding-left: 15px; text-align: center; }
.homeLink { text-decoration: none; color: inherit; }
.homeLink:hover { text-decoration: none; color: inherit; }
</style>