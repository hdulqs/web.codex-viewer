<template>
  <MetaMaskNotificationModal
    id="stakeTokensModal"
    title="Stake tokens"
    ok-title="Stake"
    :on-shown="focusModal"
    :ok-disabled="!canSubmit"
    cancel-variant="outline-primary"
    :ok-method="stakeTokens"
    :on-clear="clearModal"
  >
    <div class="text-center">
      <img class="token-icon" src="../../assets/icons/codx-token.svg">
    </div>
    <b-form-group
      label-size="sm"
      label-for="stakeAmount"
      label="Number of tokens to stake"
    >
      <b-form-input
        required
        id="stakeAmount"
        ref="stakeAmount"
        type="number"
        class="mb-4"
        placeholder="Number of tokens"
        v-model="stakeAmount"
      />
    </b-form-group>
  </MetaMaskNotificationModal>
</template>

<script>
import { mapState } from 'vuex'

import callContract from '../../util/web3/callContract'
import EventBus from '../../util/eventBus'

import MetaMaskNotificationModal from './MetaMaskNotificationModal'

export default {

  components: {
    MetaMaskNotificationModal,
  },

  data() {
    return {
      stakeAmount: {
        type: Number,
        default: null,
      },
      modalVisible: false,
    }
  },

  methods: {
    focusModal() {
      this.$refs.stakeAmount.focus()
    },

    stakeTokens() {

      const amount = this.instance.utils.toWei(this.stakeAmount, 'ether')
      const input = [amount, '0x0']

      // @NOTE: we don't .catch here so that the error bubbles up to MetaMaskNotificationModal
      return callContract(this.stakeContract.methods.stake(...input))
        .then(() => {
          EventBus.$emit('events:stake-tokens', this.stakeAmount)
        })
    },

    clearModal() {
      Object.assign(this.$data, this.$options.data.apply(this))
    },
  },

  computed: {
    ...mapState('web3', ['instance', 'stakeContract']),

    canSubmit() {
      return this.stakeAmount
    },
  },
}
</script>

<style lang="stylus" scoped>
.token-icon
  width: 8rem
  margin-bottom: 2rem

</style>
