<template>
  <v-app style="background:floralwhite;">
    <div id="app">
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
        <IndiaMap class="w-80 w-100-ns center" @tooltip="changeTooltip" @tooltipOff="tooltipOff" @click="tooltipOff"/>
        <div class="w-100 rajdhani f3 pv4 lh-title">
          <div class="w-75 center bold f2">
            <span class="w-70 dib">Party</span>
            <span class="w-30 dib">Seats</span>
          </div>
          <div class="w-75 center">
            <div class="w-10 h-100 pa2 dib" style="background: orange;"></div>
            <span class="w-60 dib pl2">NDA</span>
            <span class="w-30 dib">{{count.NDA}}</span>
          </div>
          <div class="w-75 center">
            <div class="w-10 h-100 pa2 dib" style="background: royalblue;"></div>
            <span class="w-60 dib pl2">UPA</span>
            <span class="w-30 dib">{{count.UPA}}</span>
          </div>
          <div class="w-75 center">
            <div class="w-10 h-100 pa2 dib" style="background: deeppink;"></div>
            <span class="w-60 dib pl2">Grand Alliance</span>
            <span class="w-30 dib">{{count.Grand}}</span>
          </div>
          <div class="w-75 center">
            <div class="w-10 h-100 pa2 dib" style="background: black;"></div>
            <span class="w-60 dib pl2">Non-aligned Parties</span>
            <span class="w-30 dib">{{count.NA}}</span>
          </div>
        </div>
      </div>
      <div class="w-100 w-60-ns dib-ns center rajdhani f5 f3-ns ph5-ns v-mid" ref="hudcontainer">
        <div class="pv4" ref="buttonContainer" id="buttonContainer">
          <div class="w-50 dib"><button :class="showSwingContainer ? 'center db pa2 grow style-button' : 'center db pa2 grow selected-button'" @click="showSwing(false)">Manage Coalitions</button></div>
          <div class="w-50 dib"><button :class="showSwingContainer ? 'center db pa2 grow selected-button' : 'center db pa2 grow style-button'" @click="showSwing(true)">Manage Vote Swings</button></div>
        </div>
        <keep-alive>
          <div v-if="showSwingContainer" ref="swingcontainer" id="swingcontainer" class="overflow-scroll ph2">
            <p class="w-100 db center tc f3 f3-ns pv2 bold" ref="spancontainer">Assign vote swings to and away from a coalition. Swings can be applied nationally or within specific states</p>
            <template v-for="(swing, index) in swings">
              <div :key="`swing-${index}`" :class="index ? 'mv6' : 'mb6'">
                <v-select class="w-third ph2 rajdhani" :style="{display:'inline-block'}" v-model="swing.party" :items="['NDA', 'UPA', 'Mahagathbandan']" @change="colorConstituencies" label="Swing from/to"></v-select>
                <number-input class="v-mid w-third" v-model="swing.value" @change="colorConstituencies" :min="-100" :max="100" inline controls placeholder="Default"></number-input>
                <v-select class="w-100 rajdhani mt0" v-model="swing.filter" :items="states" @change="blah()" label="Apply swing to specific states" multiple chips></v-select>
                <button class="style-button db center pa2 grow remove-button" @click="removeSwing(index)">Remove</button>
              </div>
            </template>
            <button class="db center b1 style-button pa2 grow" @click="addSwing">Add Swing</button>
          </div>
        </keep-alive>
        <keep-alive>
          <div v-if="!showSwingContainer" ref="listcontainer" id="listcontainer" class="overflow-scroll ph2">
            <p class="w-100 db center tc f3 f3-ns pv2 bold" ref="spancontainer">Scroll within this list of key players and assign them to a coalition to see how the electoral map changes</p>
            <div v-for="(party, index) in parties" class="pv3 ph5 ph0-ns" :key="`party-${index}`" style="box-sizing: border-box;" :id="`list-item-${index}`">
              <div class="tc tl-ns w-100 w-25-ns dib">
                <span class="f3 f2-ns bold">{{party[0]}}</span>
                <span class="f4 f4-ns db">{{partynames[party[0]]}}</span>
              </div>
              
              <div class="w-100 w-25-ns dib pa2 grow v-top" v-if="!restrictedParties.includes(party[0]) || party[0] === 'BJP'"><button :disabled="restrictedParties.includes(party[0])" @click="changeCoalitions(party[0], NDA)" class="style-button w-100 pa2" :style="NDA.includes(party[0]) ? 'background: orange' : ''">NDA</button></div>
              <div class="w-100 w-25-ns dib pa2 grow v-top" v-if="!restrictedParties.includes(party[0]) || party[0] === 'INC'"><button :disabled="restrictedParties.includes(party[0])" @click="changeCoalitions(party[0], UPA)" class="style-button w-100 pa2" :style="UPA.includes(party[0]) ? 'background: royalblue' : ''">UPA</button></div>
              <div class="w-100 w-25-ns dib pa2 grow v-top" v-if="!restrictedParties.includes(party[0]) || party[0] === 'BSP' || party[0] === 'SP' || party[0] === 'RLD'"><button @click="changeCoalitions(party[0], Grand)" class="style-button w-100 h-100 pa2" :style="Grand.includes(party[0]) ? 'background: deeppink' : ''">Grand Alliance</button></div>
            </div>
          </div>
        </keep-alive>
      </div>
    </div>
  </v-app>
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
      NDA: ['BJP'],
      // ['BJP', 'SHS', 'TDP', 'SAD', 'LJP', 'RLSP', 'AD', 'PMK', 'SWP', 'AINRC', 'NPP', 'NPF']
      UPA: ['INC'],
      // ['INC', 'NCP', 'RJD', 'IUML', 'JMM', 'KEC(M)', 'RSP'],
      Grand: ['SP', 'BSP', 'RLD'],
      restrictedParties: ['BJP', 'INC', 'SP', 'BSP', 'RLD'],
      // ['AITC', 'ADMK', 'CPM', 'YSRCP', 'SDF', 'NPEP', 'JD(S)', 'JKPDP', 'BLSP', 'BOPF', 'AIUDF', 'AIMIM', 'TRS']
      count: {
        'NDA': 0,
        'UPA': 0,
        'Grand': 0,
        'NA': 0
      },
      total_votes_nationally: 0,
      swings: [], // { party: 'NDA', value: -2, filter: [] }
      parties: new Map(),
      states: [],
      partynames: {},
      vote_tallies: [],
      showSwingContainer: false
    }
  },
  async mounted () {
    const map_height = this.$refs.mapcontainer.getBoundingClientRect().height
    const device_height = window.innerHeight
    this.$refs.hudcontainer.style.height = `${window.innerWidth < toPX('48em') ? 0.8 * device_height : device_height}px`
    this.$refs.listcontainer.style.height = `${this.$refs.hudcontainer.getBoundingClientRect().height - this.$refs.buttonContainer.getBoundingClientRect().height}px`

    // this.$refs.swingcontainer.style.height = `${list_container_height}px`

    let candidates_promise = csv('./result_compress.csv', (d) => {
      return {
        state: d.state.trim().toLowerCase(),
        name: d.name.trim().toLowerCase(),
        candidate: d.candidate.trim(),
        total: +d.total,
        party: d.party.trim()
      }
    })

    let names_promise = csv('./partynames.csv', (d) => {
      this.partynames[d.party] = d.party_name
    })
    
    const candidates = await candidates_promise

    this.total_votes_nationally = candidates.map(d => d.total).reduce((a, b) => a + b)
    // candidates = candidates.filter(d => d.party !== 'IND' && d.party !== 'NOTA')
    this.candidates = nest()
      .key(d => capitalize.words(d.state))
      .key(d => capitalize.words(d.name))
      .sortValues((a, b) => parseInt(a.total) > parseInt(b.total) ? -1 : 1)
      .object(candidates)

    this.states = candidates.map(d => capitalize.words(d.state)).reduce((a, b) => a.includes(b) ? [...a] : [...a, b], []).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)

    this.getParties()
    this.getVoteTallies()
    this.colorConstituencies()
  },
  methods: {
    blah () {
      this.getVoteTallies()
      this.colorConstituencies()
    },
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
    addSwing () {
      this.swings.push({ party: 'NDA', value: 0, filter: [] })
      this.getVoteTallies()
      this.colorConstituencies()
    },
    removeSwing (index) {
      this.swings.splice(index, 1)
      this.getVoteTallies()
      this.colorConstituencies()
    },
    showSwing (value) {
      this.showSwingContainer = value
      if (value) {
        this.$nextTick(() => {
          this.$refs.swingcontainer.style.height = `${this.$refs.hudcontainer.getBoundingClientRect().height - this.$refs.buttonContainer.getBoundingClientRect().height}px`
        })
      } else {
        this.$nextTick(() => {
          this.$refs.listcontainer.style.height = `${this.$refs.hudcontainer.getBoundingClientRect().height - this.$refs.buttonContainer.getBoundingClientRect().height}px`
        })
      }
    },
    getParties () {
      const parties = new Map()
      for (let state in this.candidates) {
        for (let constituency in this.candidates[state]) {
          for (let i = 0; i < (this.candidates[state][constituency].length > 2 ? 2 : this.candidates[state][constituency].length); i++) { // parties need to come atleast second in any constituency to be a part of this interactive
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
      this.parties = Array.from(parties.entries()).sort((a, b) => {
        if (this.restrictedParties.includes(a[0]) && this.restrictedParties.includes(b[0])) { return a[1] < b[1] ? 1 : -1 } else if (this.restrictedParties.includes(a[0])) { return -1 } else if (this.restrictedParties.includes(b[0])) { return 1 }
        return a[1] < b[1] ? 1 : -1
      })
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

      for (let i = 0; i < this.candidates[state][constituency].length; i++) {
        let total_votes = this.candidates[state][constituency][i].total
        if (this.UPA.includes(this.candidates[state][constituency][i].party)) {
          UPA_votes += total_votes
          UPA_parties.push(this.candidates[state][constituency][i].party)
        } else if (this.NDA.includes(this.candidates[state][constituency][i].party)) {
          NDA_votes += total_votes
          NDA_parties.push(this.candidates[state][constituency][i].party)
        } else if (this.Grand.includes(this.candidates[state][constituency][i].party)) {
          grand_votes += total_votes
          grand_parties.push(this.candidates[state][constituency][i].party)
        } else {
          all_votes.push([total_votes, 'NA', 'black', [this.candidates[state][constituency][i].party], this.candidates[state][constituency][i].party])
        }
      }

      all_votes.push([UPA_votes, 'UPA', 'royalblue', UPA_parties, 'UPA'])
      all_votes.push([NDA_votes, 'NDA', 'orange', NDA_parties, 'NDA'])
      all_votes.push([grand_votes, 'Grand', 'deeppink', grand_parties, 'Mahagathbandan'])

      for (let i = 0; i < this.swings.length; i++) {
        // debugger
        if (this.swings[i].filter.length && !this.swings[i].filter.includes(state)) { continue }
        const party = this.swings[i].party // the coalition name
        let number_of_votes = this.vote_tallies[i][0] // total votes polled, either nationally or in a particular state
        let votes_polled = this.vote_tallies[i][1] // total votes polled by the party
        const votes_polled_constituency = all_votes.find(d => d[4] === party)[0] // votes polled by the party in this constituency
        const vote_value = Math.floor(((Math.abs(this.swings[i].value) / 100) * number_of_votes) * (votes_polled_constituency / votes_polled))
        /* ^ first calculates the number of votes to be
        increased nationally or statewise. Then calculates the number to be increased in a particular
        constituency depending on whether or not the party has a stronghold here */
        const other_party_total_votes = all_votes.filter(d => d[4] !== party).map(d => d[0]).reduce((a, b) => a + b)
        // ^ calculate all votes except the given party's vote
        if (this.swings[i].value >= 0) { // if the swing is positive, towards the party (increasing its voteshare)
          let total_reduction = 0
          for (let j = 0; j < all_votes.length; j++) {
            if (all_votes[j][4] === party) { continue }
            const reduction = Math.floor(vote_value * (all_votes[j][0] / other_party_total_votes))
            all_votes[j][0] = reduction > all_votes[j][0] ? 0 : all_votes[j][0] - reduction
            total_reduction = reduction > all_votes[j][0] ? total_reduction + all_votes[j][0] : total_reduction + reduction
          }
          all_votes[all_votes.findIndex(d => d[4] === party)][0] += total_reduction
        } else { // if the swing is negative, away from the party (decreasing its voteshare)
          let total_reduction = Math.min(all_votes.find(d => d[4] === party)[0], vote_value)
          all_votes[all_votes.findIndex(d => d[4] === party)][0] -= total_reduction
          for (let j = 0; j < all_votes.length; j++) {
            if (all_votes[j][4] === party) { continue }
            const addition = Math.floor(total_reduction * (all_votes[j][0] / other_party_total_votes))
            all_votes[j][0] += addition
          }
        }
      }

      all_votes.sort((a, b) => a[0] < b[0] ? 1 : -1)

      return all_votes
    },
    colorConstituencies () {
      this.count = { 'NDA': 0, 'UPA': 0, 'Grand': 0, 'NA': 0 }
      for (let state in this.candidates) {
        for (let constituency in this.candidates[state]) {
          const elem = document.getElementById(constituency.replace(/ /g, '_'))
          if (!elem) debugger
          elem.style.fill = 'black'
          const winner = this.getCoalitionWinner(state, constituency)
          elem.style.fill = winner[0][3].includes(this.candidates[state][constituency][0].party) ? winner[0][2] : `url(#${winner[0][1]})`
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
      this.getVoteTallies()
      this.colorConstituencies()
    },
    getVoteTallies () {
      this.vote_tallies = []
      for (let i = 0; i < this.swings.length; i++) {
        this.vote_tallies.push(this.getNumVotesInStates(this.swings[i].filter.length ? this.swings[i].filter : [], this.swings[i].party))
      }
    },
    getNumVotesInStates (states, party) {
      let total = 0
      let party_votes = 0

      const vote_tallies = {}

      for (let state in this.candidates) {
        if (states.length && !states.includes(state)) { continue }
        for (let constituency in this.candidates[state]) {
          for (let i = 0; i < this.candidates[state][constituency].length; i++) {
            total += this.candidates[state][constituency][i].total

            if (this.NDA.includes(this.candidates[state][constituency][i].party)) {
              if (vote_tallies.hasOwnProperty('NDA')) { vote_tallies['NDA'] += this.candidates[state][constituency][i].total } else { vote_tallies['NDA'] = this.candidates[state][constituency][i].total }
            } else if (this.UPA.includes(this.candidates[state][constituency][i].party)) {
              if (vote_tallies.hasOwnProperty('UPA')) { vote_tallies['UPA'] += this.candidates[state][constituency][i].total } else { vote_tallies['UPA'] = this.candidates[state][constituency][i].total }
            } else if (this.Grand.includes(this.candidates[state][constituency][i].party)) {
              if (vote_tallies.hasOwnProperty('Mahagathbandan')) { vote_tallies['Mahagathbandan'] += this.candidates[state][constituency][i].total } else { vote_tallies['Mahagathbandan'] = this.candidates[state][constituency][i].total }
            } else {
              if (vote_tallies.hasOwnProperty(this.candidates[state][constituency][i].party)) { vote_tallies[this.candidates[state][constituency][i].party] += this.candidates[state][constituency][i].total } else { vote_tallies[this.candidates[state][constituency][i].party] = this.candidates[state][constituency][i].total }
            }
          }
        }
      }
      return [total, vote_tallies[party]]
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

a {
  color: black !important;
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

.style-button{
  background: transparent;
  box-shadow: none;
  border: 3px solid black;
  cursor: pointer;
}

.selected-button{
  color: white;
  background-color: black;
  box-shadow: none;
  border: 3px solid black;
  cursor: pointer;
}

.remove-button{
  background: red;
  color: white;
}

.rajdhani {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 500;
}

.bold {
  font-weight: 700;
}

#tooltip {
  background: floralwhite;
  border:3px solid black;
  z-index: 100;
}

#listcontainer{
  overflow-y: scroll;
  background: white;
  -webkit-overflow-scrolling: touch;
  border: 3px solid black;
}

#swingcontainer{
  overflow-y: scroll;
  background: white;
  -webkit-overflow-scrolling: touch;
  border: 3px solid black;
}

.v-list__tile__content{
  font-family: rajdhani;
}

.number-input--inline{
  border: 3px solid black;
}

.number-input__input{
  border: none !important;
}

.number-input__button--minus{
  border-right: 3px solid black !important;
}

.number-input__button--plus{
  border-left: 3px solid black !important;
}

.number-input__button{
  top: 0px !important;
  bottom: 0px !important;
}

ol{
  list-style-type: decimal !important;
}
</style>
