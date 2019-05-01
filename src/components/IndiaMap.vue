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

path {
  stroke: white;
  stroke-width: 1px;
}

.flipped{
  stroke: red;
  stroke-width: 3px;
  stroke-dasharray: 10;
  animation: flip;
  animation-duration: 30s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes flip {
  from {
    stroke-dashoffset: 0%;
  }

  to {
    stroke-dashoffset: 100%;
  }
}

path:hover {
  stroke: greenyellow;
  stroke-width: 5px;
  cursor: pointer;
}
</style>
