<template>
  <div id="app" class="mw9 center mv0 ph2 ph3-ns">
    <div class="w-80 w-40-ns center dib-ns background-white bb bw2 bw0-ns b--black v-mid" ref="mapcontainer" id="mapcontainer">
      <IndiaMap/>
      <div class="tc rajdhani f4 f4-m f3-ns pv2">
        <div class="w-25 dib v-top">
          <span>{{count.NDA}}</span>
          <span class="db bold f4 f3-m f2-ns">NDA</span>
        </div>
        <div class="w-25 dib v-top">
          <span>{{count.UPA}}</span>
          <span class="db bold f4 f3-m f2-ns">UPA</span>
        </div>
        <div class="w-25 dib v-top">
          <span>{{count.Grand}}</span>
          <span class="db bold f4 f3-m f2-ns">Grand Alliance</span>
        </div>
        <div class="w-25 dib v-top">
          <span>{{count.NA}}</span>
          <span class="db bold f4 f3-m f2-ns">Non-aligned Parties</span>
        </div>
      </div>
    </div>
    <div class="w-100 w-60-ns dib-ns center overflow-scroll rajdhani f5 f3-ns ph5-ns v-mid" ref="hudcontainer">
      <span class="w-100 db center tc f3 f2-ns bold pv2">Change party allegiances to see how the seat share changes</span>
      <template v-for="(party, index) in parties">
        <div class="pv2 ph5 ph0-ns" :key="`party-${index}`">
          <span class="f3 f2-ns tc tl-ns w-100 w-25-ns dib bold">{{party[0]}}</span>
          <div class="w-100 w-25-ns dib pa2 grow"><button @click="changeCoalitions(party[0], NDA)" class="w-100 pa2" :style="NDA.includes(party[0]) ? 'background: orange' : ''">NDA</button></div>
          <div class="w-100 w-25-ns dib pa2 grow"><button @click="changeCoalitions(party[0], UPA)" class="w-100 pa2" :style="UPA.includes(party[0]) ? 'background: royalblue' : ''">UPA</button></div>
          <div class="w-100 w-25-ns dib pa2 grow"><button @click="changeCoalitions(party[0], Grand)" class="w-100 pa2" :style="Grand.includes(party[0]) ? 'background: deeppink' : ''">Grand Alliance</button></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import IndiaMap from './components/IndiaMap.vue'
import { csv } from 'd3-fetch'
import { nest } from 'd3-collection'
const capitalize = require('capitalize')
const toPX = require('to-px')

export default {
  name: 'app',
  components: {
    IndiaMap
  },
  data () {
    return {
      candidates: {},
      NDA: ['BJP', 'SHS', 'TDP', 'SAD', 'LJP', 'RLSP', 'AD', 'PMK', 'SWP', 'AINRC', 'NPP', 'NPF'],
      UPA: ['INC', 'NCP', 'RJD', 'IUML', 'JMM', 'KEC(M)', 'RSP'],
      Grand: ['AITC', 'ADMK', 'CPM', 'YSRCP', 'SDF', 'NPEP', 'JD(S)', 'JKPDP', 'BLSP', 'BOPF', 'AIUDF', 'AIMIM', 'TRS'],
      count: {
        'NDA': 0,
        'UPA': 0,
        'Grand': 0,
        'NA': 0
      },
      parties: new Map()
    }
  },
  async mounted () {
    const map_height = this.$refs.mapcontainer.getBoundingClientRect().height
    const device_height = window.innerHeight
    this.$refs.hudcontainer.style.height = `${window.innerWidth < toPX('48em') ? device_height - map_height : 0.99 * device_height}px`

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

    this.getParties()

    this.colorConstituencies()
  },
  methods: {
    getParties () {
      const parties = new Map()

      for (let state in this.candidates) {
        for (let constituency in this.candidates[state]) {
          for (let i = 0; i < this.candidates[state][constituency].length; i++) {
            // if(this.candidates[state][constituency][i].vote_pct > 25.00) {
            if (!parties.has(this.candidates[state][constituency][i].party)) {
              parties.set(this.candidates[state][constituency][i].party, this.candidates[state][constituency][i].total)
            } else {
              const currentVal = parties.get(this.candidates[state][constituency][i].party)
              parties.set(this.candidates[state][constituency][i].party, this.candidates[state][constituency][i].total + currentVal)
            }
          }
        }
      }
      this.parties = Array.from(parties.entries()).sort((a, b) => a[1] < b[1] ? 1 : -1)
    },
    colorConstituencies () {
      this.count = { 'NDA': 0, 'UPA': 0, 'Grand': 0, 'NA': 0 }

      for (let state in this.candidates) {
        for (let constituency in this.candidates[state]) {
          const elem = document.getElementById(constituency.replace(/ /g, '_'))
          if (!elem) console.log(constituency)
          elem.style.fill = 'black'
          let UPA_votes = 0
          let NDA_votes = 0
          let grand_votes = 0
          const all_votes = []

          for (let i = 0; i < this.candidates[state][constituency].length; i++) {
            if (this.UPA.includes(this.candidates[state][constituency][i].party)) {
              UPA_votes = UPA_votes + this.candidates[state][constituency][i].total
            } else if (this.NDA.includes(this.candidates[state][constituency][i].party)) {
              NDA_votes = NDA_votes + this.candidates[state][constituency][i].total
            } else if (this.Grand.includes(this.candidates[state][constituency][i].party)) {
              grand_votes = grand_votes + this.candidates[state][constituency][i].total
            } else {
              all_votes.push([this.candidates[state][constituency][i].total, 'NA', 'black'])
            }
          }

          all_votes.push([UPA_votes, 'UPA', 'royalblue'])
          all_votes.push([NDA_votes, 'NDA', 'orange'])
          all_votes.push([grand_votes, 'Grand', 'deeppink'])
          all_votes.sort((a, b) => a[0] < b[0] ? 1 : -1)

          elem.style.fill = all_votes[0][2]
          this.$set(this.count, all_votes[0][1], this.count[all_votes[0][1]] + 1)
        }
      }
    },
    changeCoalitions (party, coalition) {
      if (coalition.includes(party)) {
        coalition.splice(coalition.findIndex(d => d === party), 1)
      } else {
        if (this.NDA.includes(party)) this.NDA.splice(this.NDA.findIndex(d => d === party), 1)
        if (this.UPA.includes(party)) this.UPA.splice(this.UPA.findIndex(d => d === party), 1)
        if (this.Grand.includes(party)) this.Grand.splice(this.Grand.findIndex(d => d === party), 1)
        coalition.push(party)
      }
      this.colorConstituencies()
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

button{
  background: transparent;
  box-shadow: none;
  border: 3px solid black;
  cursor: pointer;
}

.rajdhani {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 500;
}

.bold {
  font-weight: 700;
}
</style>
