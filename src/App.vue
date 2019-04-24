<template>
  <div id="app" class="mw9 center mv0 ph1 ph3-ns">
    <div class="w-100 w-40-ns center dib-ns background-white bb bw2 bw0-ns b--black v-mid relative" ref="mapcontainer" id="mapcontainer">
      <div id="tooltip" class="absolute rajdhani bold w-75 pa2" :style="tooltip.style" v-if="tooltip.display">
        <span class="f3">{{tooltip.constituency}}{{tooltip.state === tooltip.constituency ? '' : `, ${tooltip.state}`}}</span>
        <h2 class="underline">Top 3 results with selected coalitions</h2>
        <template v-for="(coalition, index) in tooltip.coalitionWinner" v-if="index < 3">
          <div class="db">
            <span class="dib w-50">{{coalition[4]}}</span>
            <span class="dib w-50">{{Intl.NumberFormat('en-IN').format(coalition[0])}} ({{parseFloat((coalition[0] / (tooltip.coalitionWinner.map(d=>d[0]).reduce((a,b)=>a+b))) * 100).toFixed(2)}}%)</span>
          </div>
        </template>
        <h2 class="underline">2014 Ballot</h2>
        <template v-for="(party, index) in candidates[tooltip.state][tooltip.constituency]" v-if="index < 3">
          <div class="db">
            <span class="dib w-50">{{party.party}}</span>
            <span class="dib w-50">{{Intl.NumberFormat('en-IN').format(party.total)}} ({{parseFloat((party.total / (tooltip.coalitionWinner.map(d=>d[0]).reduce((a,b)=>a+b))) * 100).toFixed(2)}}%)</span>
          </div>
        </template>
      </div>
      <IndiaMap class="w-80 w-100-ns center" @tooltip="changeTooltip" @tooltipOff="tooltipOff"/>
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
    <div class="w-100 w-60-ns dib-ns center rajdhani f5 f3-ns ph5-ns v-mid" ref="hudcontainer">
      <span class="w-100 db center tc f3 f2-ns bold pv2" ref="spancontainer">Change party allegiances to see how the seat share changes</span>
      <div ref="listcontainer" id="listcontainer" class="overflow-scroll">
        <div v-for="(party, index) in parties" class="pv2 ph5 ph0-ns" :key="`party-${index}`" style="box-sizing: border-box;" :id="`list-item-${index}`">
          <span class="f3 f2-ns tc tl-ns w-100 w-25-ns dib bold">{{party[0]}}</span>
          <div class="w-100 w-25-ns dib pa2 grow"><button @click="changeCoalitions(party[0], NDA)" class="w-100 pa2" :style="NDA.includes(party[0]) ? 'background: orange' : ''">NDA</button></div>
          <div class="w-100 w-25-ns dib pa2 grow"><button @click="changeCoalitions(party[0], UPA)" class="w-100 pa2" :style="UPA.includes(party[0]) ? 'background: royalblue' : ''">UPA</button></div>
          <div class="w-100 w-25-ns dib pa2 grow"><button @click="changeCoalitions(party[0], Grand)" class="w-100 pa2" :style="Grand.includes(party[0]) ? 'background: deeppink' : ''">Grand Alliance</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import IndiaMap from './components/IndiaMap.vue'
import { csv } from 'd3-fetch'
import { nest } from 'd3-collection'
import virtualList from 'vue-virtual-scroll-list'
const capitalize = require('capitalize')
const toPX = require('to-px')

export default {
  name: 'app',
  components: {
    IndiaMap,
    virtualList
  },
  data () {
    return {
      tooltip: { 'display': false, 'state': '', 'constituency': '', 'style': {} },
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
      swings: [ { from: NDA_votes, to: UPA_votes, value: 5 } ],
      listItemHeight: 81,
      numberItems: 8,
      parties: new Map()
    }
  },
  async mounted () {
    const map_height = this.$refs.mapcontainer.getBoundingClientRect().height
    const device_height = window.innerHeight
    this.$refs.hudcontainer.style.height = `${window.innerWidth < toPX('48em') ? device_height - map_height : device_height}px`

    const list_container_height = this.$refs.hudcontainer.getBoundingClientRect().height - this.$refs.spancontainer.getBoundingClientRect().height
    this.$refs.listcontainer.style.height = `${list_container_height}px`

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

    // candidates = candidates.filter(d => d.party !== 'IND' && d.party !== 'NOTA')
    this.candidates = nest()
      .key(d => capitalize.words(d.state))
      .key(d => capitalize.words(d.name))
      .sortValues((a, b) => parseInt(a.total) > parseInt(b.total) ? -1 : 1)
      .object(candidates)

    this.getParties()

    this.colorConstituencies()
  },
  methods: {
    changeTooltip ([event, constituency, state]) {
      this.$set(this.tooltip, 'state', state.replace(/_/g, ' '))
      this.$set(this.tooltip, 'constituency', constituency.replace(/_/g, ' '))
      this.$set(this.tooltip, 'coalitionWinner', this.getCoalitionWinner(this.tooltip.state, this.tooltip.constituency))
      this.tooltip.ballot2014 = this.candidates[this.tooltip.state][this.tooltip.constituency]
      this.tooltip.style.top = `${event.offsetY + 10}px`
      this.tooltip.style.left = `${event.offsetX + 10}px`
      this.$set(this.tooltip, 'display', true)
    },
    tooltipOff () {
      this.$set(this.tooltip, 'display', false)
    },
    getParties () {
      const parties = new Map()
      for (let state in this.candidates) {
        for (let constituency in this.candidates[state]) {
          for (let i = 0; i < (this.candidates[state][constituency].length > 5 ? 5 : this.candidates[state][constituency].length); i++) { // parties need to come atleast fifth in any constituency to be counted towards this interactive
            if (this.candidates[state][constituency][i].party === 'NOTA' || this.candidates[state][constituency][i].party === 'IND') { continue }
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
    getNumElectors (state, constituency) {
      return this.candidates[state][constituency][0].electors
    },
    getCoalitionWinner (state, constituency) {
      let UPA_votes = 0
      let NDA_votes = 0
      let grand_votes = 0
      const all_votes = []
      let UPA_parties = []
      let NDA_parties = []
      let grand_parties = []
      const all_parties = this.candidates[state][constituency].map(d => d.party)

      // console.log(`${constituency}, ${state} - ${total_votes_polled}`)

      for (let i = 0; i < this.candidates[state][constituency].length; i++) {
        let total_votes = this.candidates[state][constituency][i].total
        if (this.UPA.includes(this.candidates[state][constituency][i].party)) {
          UPA_votes = UPA_votes + total_votes
          UPA_parties.push(this.candidates[state][constituency][i].party)
        } else if (this.NDA.includes(this.candidates[state][constituency][i].party)) {
          NDA_votes = NDA_votes + total_votes
          NDA_parties.push(this.candidates[state][constituency][i].party)
        } else if (this.Grand.includes(this.candidates[state][constituency][i].party)) {
          grand_votes = grand_votes + total_votes
          grand_parties.push(this.candidates[state][constituency][i].party)
        } else {
          all_votes.push([total_votes, 'NA', 'black', this.candidates[state][constituency][i].party, this.candidates[state][constituency][i].party])
        }
      }

      console.log(this.swings)

      for (let i = 0; i < this.swings.length; i++) {
        const from_party = this.candidates[state][constituency].find(d => d.party === this.swings[i].from)
        const swing = Math.floor((this.swings[i].value / 100) * from_party.total)

        if (UPA_parties.includes(this.swings[i].from)) { UPA_votes = UPA_votes - swing } else if (NDA_parties.includes(this.swings[i].from)) { NDA_votes = NDA_votes - swing } else if (grand_parties.includes(this.swings[i].from)) { grand_votes = grand_votes - swing } else { all_votes[all_votes.findIndex(d => d[3] === this.swings[i].from)][0] -= swing }

        if (UPA_parties.includes(this.swings[i].to)) { UPA_votes = UPA_votes + swing } else if (NDA_parties.includes(this.swings[i].to)) { NDA_votes = NDA_votes + swing } else if (grand_parties.includes(this.swings[i].to)) { grand_votes = grand_votes + swing } else { all_votes[all_votes.findIndex(d => d[3] === this.swings[i].to)][0] += swing }
      }

      all_votes.push([UPA_votes, 'UPA', 'royalblue', UPA_parties, 'UPA'])
      all_votes.push([NDA_votes, 'NDA', 'orange', NDA_parties, 'NDA'])
      all_votes.push([grand_votes, 'Grand', 'deeppink', grand_parties, 'Mahagathbandan'])

      all_votes.sort((a, b) => a[0] < b[0] ? 1 : -1)
      return all_votes
    },
    adjustSwing (vote_a, vote_b, vote_c, total_votes_polled, swing) {
      let a_voteshare = (vote_a / total_votes_polled) * 100
      let b_voteshare = (vote_b / total_votes_polled) * 100
      let c_voteshare = (vote_c / total_votes_polled) * 100
      // debugger
      if (swing < 0) {
        let lost_votes
        if (Math.abs(swing) > a_voteshare) {
          lost_votes = vote_a
          vote_a = 0
        } else {
          lost_votes = Math.floor((Math.abs(swing) / 100) * total_votes_polled)
          vote_a = vote_a - lost_votes
        }
        vote_b = vote_b + (lost_votes / 2)
        vote_c = vote_c + (lost_votes / 2)
      } else {
        let gained_votes
        if (b_voteshare < (swing / 2)) { // if this party doesn't have enough voteshare to lose to the primary party
          gained_votes = vote_b
          vote_b = 0
        } else {
          gained_votes = Math.floor(((swing / 2) / 100) * total_votes_polled)
          vote_b = vote_b - gained_votes
        }
        if (c_voteshare < (swing / 2)) { // if this party doesn't have enough voteshare to lose to the primary party
          gained_votes = gained_votes + vote_c
          vote_c = 0
        } else {
          gained_votes = gained_votes + Math.floor(((swing / 2) / 100) * total_votes_polled)
          vote_c = vote_c - gained_votes
        }
        vote_a = vote_a + gained_votes
      }
      return [vote_a, vote_b, vote_c]
    },
    colorConstituencies () {
      this.count = { 'NDA': 0, 'UPA': 0, 'Grand': 0, 'NA': 0 }
      for (let state in this.candidates) {
        for (let constituency in this.candidates[state]) {
          const elem = document.getElementById(constituency.replace(/ /g, '_'))
          if (!elem) debugger
          elem.style.fill = 'black'
          const winner = this.getCoalitionWinner(state, constituency)
          elem.style.fill = winner[0][2]
          this.$set(this.count, winner[0][1], this.count[winner[0][1]] + 1)
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

#tooltip {
  background: white;
  border:3px solid black;
  z-index: 100;
}

#listcontainer{
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
}
</style>
