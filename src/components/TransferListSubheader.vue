<template>
    <div class="sub-heading">
      <span :class="{ 'active': transferDirection === 'incoming' }">
        <b-link
          to="/transfers/incoming"
          v-if="transferDirection !== 'incoming'"
        >
          Incoming
        </b-link>
        <span v-else>Incoming</span>
      </span>
      <span :class="{ 'active': transferDirection === 'outgoing' }">
        <b-link
          to="/transfers/outgoing"
          v-if="transferDirection !== 'outgoing'"
        >
          Outgoing
        </b-link>
        <span v-else>Outgoing</span>
      </span>
    </div>
</template>

<script>
export default {
  props: {
    transferDirection: {
      type: String,
      required: true,
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "../assets/variables.styl"

.sub-heading
  font-weight: 600
  margin-bottom: 1rem

  >span+span
    margin-left: 1rem

  a
  span
    display: inline-block

  a:hover
  .active
    font-weight: 600
    text-decoration: none
    color: $color-secondary-accent
    border-bottom: 3px solid $color-secondary-accent

</style>
