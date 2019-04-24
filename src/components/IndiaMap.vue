<template>
  <div>
    <IndiaSVG ref="map" class="map"/>
  </div>
</template>

<script>
import IndiaSVG from '../assets/untitled.svg'
export default {
  name: 'IndiaMap',
  components: {
    IndiaSVG
  },
  mounted () {
    const children = Array.from(this.$refs.map.childNodes).map(d => d.nodeName === 'path' ? d : Array.from(d.children)).flat()
    children.forEach(el => {
      el.addEventListener('mouseover', (event) => {
        if (event.target.parentNode.nodeName === 'g') { this.$emit('tooltip', [event, event.target.id, event.target.parentNode.id]) } else { this.$emit('tooltip', [event, event.target.id, event.target.id]) }
      })
      el.addEventListener('mouseleave', (event) => { this.$emit('tooltipOff') })
    })
  }
}
</script>

<style scoped>
.map {
  stroke: white;
  stroke-width: 1px;
}

path:hover {
  stroke: greenyellow;
  stroke-width: 5px;
  cursor: pointer;
}
</style>
