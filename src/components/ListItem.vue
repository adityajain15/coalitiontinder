<template>
  <div class="pv2 ph5 ph0-ns h4">
    <span class="f3 f2-ns tc h-100 w-100 w-25-ns dib bold v-mid">{{party[0]}}</span>
    <div class="w-100 w-25-ns h-100 dib pa2 grow v-top"><button @click="changeCoalitions(party[0], NDA)" class="w-100 h-100 pa2" :style="NDA.includes(party[0]) ? 'background: orange' : ''">NDA</button></div>
    <div class="w-100 w-25-ns h-100 dib pa2 grow v-top"><button @click="changeCoalitions(party[0], UPA)" class="w-100 h-100 pa2" :style="UPA.includes(party[0]) ? 'background: royalblue' : ''">UPA</button></div>
    <div class="w-100 w-25-ns h-100 dib pa2 grow v-top"><button @click="changeCoalitions(party[0], Grand)" class="w-100 h-100 pa2" :style="Grand.includes(party[0]) ? 'background: deeppink' : ''">Grand Alliance</button></div>
  </div>
</template>

<script>
export default {
  name: 'list-item',
  props: ['party', 'NDA', 'UPA', 'Grand'],
  data () {
    return {
      itemHeight: 0
    }
  },
  mounted () {
    this.itemHeight = this.$el.clientHeight
  }
}
</script>

<style scoped>
span {
  line-height: 7rem;
}
</style>
