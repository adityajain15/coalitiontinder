<template>
  <div id="app" class="mw8 center mv5">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <div id="cardContainer" class="w-100">
      <vue-swing @throwoutright="throwright" @throwoutleft="throwleft" @throwoutup="throwup" ref="vueswing">
        <template v-for="(card, index) in cards">
          <div :key="`card-${index}`" class="box w-50 h4">
            <span class="db center">{{card}}</span>
          </div>
        </template>
      </vue-swing>
    </div>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import VueSwing from 'vue-swing'
import { csv } from 'd3-fetch'
import { nest } from 'd3-collection'
const capitalize = require('capitalize')
export default {
  name: 'app',
  components: {
    HelloWorld,
    VueSwing
  },
  data () {
    return {
      candidates: {},
      NDA: ['BJP', 'SHS', 'TDP', 'SAD', 'PMK', 'LJP', 'RLSP', 'AD', 'PMK', 'SWP', 'AINRC', 'NPP', 'NPF'],
      UPA: ['INC', 'NCP', 'RJD', 'IUML', 'JMM', 'KEC(M)', 'RSP'],
      cards: ['INC', 'BJP', 'TDP', 'RJD', 'JMM']
    }
  },
  async mounted () {
    let candidates = await csv('./result.csv', (d) => {
      return {
        state: d.state.trim().toLowerCase(),
        name: d.name.trim().toLowerCase(),
        age: +d.age,
        candidate: d.candidate.trim(),
        electors: +d.electors,
        general: +d.general,
        postal: +d.postal,
        sex: d.sex.trim(),
        symbol: d.symbol.trim(),
        total: +d.total,
        party: d.party.trim(),
        category: d.category.trim(),
        vote_pct: +d.vote_pct,
        electors_pct: +d.electors_pct
      }
    })

    candidates = candidates.filter(d => d.party !== 'IND' && d.party !== 'NOTA')
    this.candidates = nest()
      .key(d => capitalize.words(d.state))
      .key(d => capitalize.words(d.name))
      .sortValues((a, b) => parseInt(a.total) > parseInt(b.total) ? -1 : 1)
      .object(candidates)

    for (let state in this.candidates) {
      for (let constituency in this.candidates[state]) {
        // console.log(constituency)
        const elem = document.getElementById(constituency.replace(/ /g, '_'))
        if (!elem) console.log(constituency)
        if (this.NDA.includes(this.candidates[state][constituency][0].party)) { elem.style.fill = 'orange' } else if (this.UPA.includes(this.candidates[state][constituency][0].party)) { elem.style.fill = 'royalblue' } else { elem.style.fill = 'green' }
      }
    }
  },
  methods: {
    throwright (args) {
      console.log(args)
      console.log('right')
    },
    throwleft () {
      console.log('left')
    },
    throwup () {
      console.log('up')
      this.cards.pop()
    }
  }
}
</script>

<style>
#app {
  font-family: 'Georgia', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#cardContainer {
  position: relative;
}

.box{
  top:0px;
  left:25%;
  position: absolute;
  background: white;
  border: 1px solid black;
  border-radius: 7px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
