<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app',
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.navbar { background:#7E4C64; }
.nav-link , .navbar-brand { color: #f4f4f4; cursor: pointer; }
.nav-link { margin-right: 1em !important; }
.nav-link:hover { background: #f4f4f4; color: #7E4C64; }
.navbar-toggler { background:#fff !important; }
.navbar-nav { float: right; }
.container { padding: 100px 15px; text-align: center; }
.homeLink { text-decoration: none; color: inherit; }
.homeLink:hover { text-decoration: none; color: inherit; }
#welcome { color: #7E4C64; }
#upload { margin-top: 20px; border-width: 3px; border-color: #7E4C64; color: #7E4C64; padding: 15px 60px; }
#upload:hover { background: #7E4C64; color: #f4f4f4; }
#upload-file { display: none; }
</style>