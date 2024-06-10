<template>
  <div class="flex min-h-screen w-full text-base">
    <Sidebar class="w-[130px] min-h-screen" />
    <div class="flex-grow bg-gray-100">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './views/components/Sidebar.vue'
</script>

<style>
@import 'vue-sidebar-menu/dist/vue-sidebar-menu.css';
</style>
