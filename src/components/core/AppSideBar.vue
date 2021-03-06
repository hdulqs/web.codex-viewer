<template>
  <nav>
    <div class="logo">
      <img
        v-party-mode-activator
        src="../../assets/logos/codex/gold.svg"
        @click="$router.push({ name: 'collection' })"
      >
    </div>
    <div class="button-container">
      <b-link
        :key="index"
        :to="navItem.to"
        v-if="navItem.condition"
        v-for="(navItem, index) in navItems"
        @click.prevent="navItem.action ? navItem.action() : TOGGLE_NAV(false)"
      >
        <img :src="navItem.icon">{{ navItem.text }}
        <b-badge
          variant="danger"
          v-if="navItem.text === 'Transfers' && incomingTransfers.length > 0"
        >
          {{ incomingTransfers.length }}
        </b-badge>
      </b-link>
      <span class="spacer"></span>
      <footer class="sidebar-footer" v-if="isLoaded && user">
        <div>
          <h4>Logged in as</h4>
          <DisplayName :userObject="user" />
        </div>
        <CODXBalanceControl v-if="isNotSavvyUser || feesEnabled" />
      </footer>
    </div>
  </nav>
</template>

<script>
import {
  mapState,
  mapGetters,
  mapActions,
} from 'vuex'

import DisplayName from '../util/DisplayName'
import CODXBalanceControl from '../CODXBalanceControl'

import config from '../../util/config'

import iconHome from '../../assets/icons/home.svg'
import starIcon from '../../assets/icons/star.svg'
import logoutIcon from '../../assets/icons/logout.svg'
import codxIcon from '../../assets/icons/codx-token.svg'
import galleryIcon from '../../assets/icons/gallery.svg'
import settingsIcon from '../../assets/icons/settings.svg'
import iconTransfers from '../../assets/icons/transfers.svg'
import iconCollection from '../../assets/icons/collection.svg'

export default {

  components: {
    DisplayName,
    CODXBalanceControl,
  },

  data() {
    return {
      feesEnabled: config.feesEnabled,
      showCodexGallery: config.showCodexGalleryInSideBar,
    }
  },

  computed: {
    ...mapState('auth', ['user']),
    ...mapState('app', ['isLoaded']),
    ...mapState('records', {
      incomingTransfers: (state) => {
        return state.lists.incomingTransfers
      },
    }),
    ...mapGetters('auth', ['isAuthenticated', 'isNotSavvyUser']),

    showManageTokensPage() {
      return this.user && this.user.type === 'savvy' && config.showManageTokensPage
    },

    navItems() {
      return [
        {
          to: '/login',
          condition: !this.isAuthenticated,
          icon: iconHome,
          text: 'Home',
        },
        {
          to: '/collection',
          condition: this.isAuthenticated,
          icon: iconCollection,
          text: 'Collection',
        },
        {
          to: '/transfers',
          condition: this.isAuthenticated,
          icon: iconTransfers,
          text: 'Transfers',
        },
        {
          to: '/manage-tokens',
          condition: this.showManageTokensPage,
          icon: codxIcon,
          text: 'ManageTokens',
        },
        {
          to: '/get-codx',
          icon: codxIcon,
          text: 'Get CODX',
          condition: this.isNotSavvyUser || config.feesEnabled,
        },
        {
          to: '/extensions',
          condition: this.isAuthenticated,
          icon: starIcon,
          text: 'Extensions',
        },
        {
          to: '/galleries',
          condition: this.showCodexGallery,
          icon: galleryIcon,
          text: 'Galleries',
        },
        {
          to: '/settings',
          condition: this.isAuthenticated,
          icon: settingsIcon,
          text: 'Settings',
        },
        {
          to: '/logout',
          action: this.logout,
          condition: this.isAuthenticated,
          icon: logoutIcon,
          text: 'Logout',
        },
        {
          to: '/login',
          condition: !this.isAuthenticated,
          icon: logoutIcon,
          text: 'Login',
        },
      ]
    },
  },

  methods: {
    ...mapActions('app', ['TOGGLE_NAV']),
    logout() {
      this.TOGGLE_NAV(false)
      this.$store.dispatch('auth/LOGOUT_USER')
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "../../assets/variables.styl"

nav
  width: 100%
  flex-grow: 1
  display: none
  overflow-y: auto
  position: relative
  flex-direction: column
  background-color: rgba(white, .05)

  @media screen and (min-width: $breakpoint-md)
    width: $side-nav-width
    min-width: @width
    max-width: @width
    display: flex

a
  padding: 1rem
  display: block
  line-height: 1rem
  color: $color-light
  box-sizing: border-box

  img
    margin-right: .5rem

  &:hover
    text-decoration: none
    background-color: rgba(white, .1)

  &.active
    font-weight: bold
    background-color: rgba(white, .25)

.logo
  height: 4rem
  padding: 1em 0
  text-align: center
  box-sizing: content-box

  img
    height: 100%

    &:hover
      cursor: pointer

.button-container
  flex-grow: 1
  display: flex
  align-items: center
  flex-direction: column

  @media screen and (min-width: $breakpoint-md)
    align-items: normal

  a
    width: 100%
    text-align: center

    @media screen and (min-width: $breakpoint-md)
      text-align: left

.badge
  margin-left: .25em
  border-radius: .25em

.sidebar-footer
  width: 100%
  padding: 1rem
  font-size: small
  background-color: rgba(white, .01)
  border-top: 1px solid rgba(white, .05)

  // every top level element inside the sidebar footer that's preceeded by
  //  another top level element...
  > * + *
    margin-top: 1rem

</style>

<style lang="stylus">

// @NOTE: we're using an unscoped style tag here so the styles apply to all
//  components in the sidebar footer

@import "../../assets/variables.styl"

.sidebar-footer
  h4
    font-size: small
    color: $color-primary
    margin: 1rem 0 .25rem 0

    &:first-of-type
      margin-top: 0

</style>
