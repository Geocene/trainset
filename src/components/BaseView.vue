<template>
  <div>
    <BaseNavbar>
      <template v-slot:nav-content>
        <slot name="navbar-content">
        </slot>
      </template>
    </BaseNavbar>
    <slot name="main-content"></slot>
  </div>
</template>

<script>
export default {
  name: 'BaseView'
}
</script>

<style scoped>
.title { color: #7E4C64; font-weight: bold; }
.info { text-align: left; padding-left: 100px; }
.subh { color: #7E4C64; font-weight: 500; }
</style>
