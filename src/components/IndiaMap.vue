<template>
  <div class="w-100 pa2 center">
    <IndiaSVG class="map"/>
  </div>
</template>

<script>
import IndiaSVG from '../assets/untitled.svg'
export default {
  name: 'IndiaMap',
  components: {
    IndiaSVG
  }
}
</script>

<style scoped>
.map {
  stroke: white;
  stroke-width: 1px;
}
</style>
