import axios from 'axios'
import debug from 'debug'
import Raven from 'raven-js'

import router from '../../../router'
import User from '../../../util/api/user'
import EventBus from '../../../util/eventBus'

const logger = debug('app:store:auth:actions')

export default {
  INITIALIZE_AUTH({ dispatch, commit, state, rootState }) {
    logger('INITIALIZE_AUTH action being executed')

    const {
      error,
      errorCode,
      authToken,
    } = rootState.route.query

    if (error || errorCode) {
      logger('API returned an error in query string', errorCode, error)

      commit('SET_ERROR', {
        code: errorCode,
        message: error,
      })

      // Clear the error params from the query string
      router.replace({
        name: rootState.route.name,
      })

    } else if (authToken) {
      logger('Fetching user state with the query string authToken')

      // @TODO: evaluate what happens when a bogus auth token is set in the
      //  route params
      commit('SET_AUTH_STATE', {
        authToken,
      })

      return dispatch('FETCH_USER')
    } else if (state.authToken) {
      logger('Fetching user state with the cached authToken')

      return dispatch('FETCH_USER')
    }

    // If no user is present and no errors were triggered during web3 initialization, loading is complete
    commit('SET_IS_LOADED', { isLoaded: true })
    return null
  },

  FETCH_USER({ commit, dispatch, rootState }) {
    logger('FETCH_USER action being executed')

    return User.getUser()
      .then((user) => {
        if (user.type === 'savvy'
          && user.address
          && rootState.web3.account
          && user.address.toLowerCase() !== rootState.web3.account.toLowerCase()) {
          return dispatch('LOGOUT_USER')
        }

        const setUserAndContractState = () => {
          commit('SET_USER', {
            user,
          })

          return dispatch('UPDATE_CONTRACT_STATE')
        }

        // This is to handle where a simple user has a web3 wallet that is in a bad state or on the wrong network
        // We re-register web3 using Infura as a provider instead of the injected one from their web3 wallet
        if (user.type === 'simple' && rootState.web3.error) {
          return dispatch('web3/REGISTER', true, { root: true })
            .then(setUserAndContractState)
        }

        return setUserAndContractState()
      })
      .then(() => {
        if (rootState.route.meta.ifAuthenticatedRedirectTo) {
          router.replace({
            name: rootState.route.meta.ifAuthenticatedRedirectTo,
          })
        } else {

          // If no navigation is happening as a result of authentication, loading is complete
          commit('SET_IS_LOADED', { isLoaded: true })
        }
      })
      .catch((error) => {
        EventBus.$emit('toast:error', `Could not log in: ${error.message}`)
        Raven.captureException(error)
        commit('CLEAR_USER_STATE')

        // If an error happens during user authentication, loading is complete
        commit('SET_IS_LOADED', { isLoaded: true })
      })
  },

  // Dispatched after a user has signed a string via web3.
  // This calls the API to retrieve a JWT and the user object.
  SEND_AUTH_REQUEST({ commit, dispatch }, data) {
    logger('SEND_AUTH_REQUEST action being executed')

    const requestOptions = {
      method: 'post',
      url: '/auth-token',
      data,
    }

    return axios(requestOptions)
      .then((response) => {
        const { result } = response.data

        commit('SET_AUTH_STATE', {
          authToken: result.token,
        })

        commit('SET_USER', {
          user: result.user,
        })

        return dispatch('UPDATE_CONTRACT_STATE')
      })
      .catch((error) => {
        EventBus.$emit('toast:error', `Could not log in: ${error.message}`)
        Raven.captureException(error)
        commit('CLEAR_USER_STATE')
      })
  },

  UPDATE_CONTRACT_STATE({ dispatch, state }) {
    if (!state.user) {
      return null
    }

    logger('UPDATE_CONTRACT_STATE action being executed')

    return Promise.all([
      dispatch('FETCH_TOKEN_BALANCE'),
      dispatch('FETCH_STAKE_BALANCES'),
      dispatch('FETCH_APPROVAL_STATUSES'),
    ])
  },

  FETCH_TOKEN_BALANCE({ commit, rootState, state }) {
    logger('FETCH_TOKEN_BALANCE action being executed')

    const { tokenContract } = rootState.web3
    const { address } = state.user

    return tokenContract.methods.balanceOf(address)
      .call()
      .then((balance) => {
        commit('SET_TOKEN_BALANCE', { balance })
      })
  },

  FETCH_STAKE_BALANCES({ commit, rootState, state }) {
    logger('FETCH_STAKE_BALANCES action being executed')

    const { stakeContract } = rootState.web3
    const { address } = state.user

    return Promise.all([
      stakeContract.methods.getPersonalStakes(address)
        .call()
        .then((personalStakes) => {
          commit('SET_PERSONAL_STAKES', { personalStakes })
        }),
      stakeContract.methods.creditBalanceOf(address)
        .call()
        .then((balance) => {
          commit('SET_CREDIT_BALANCE', { balance })
        }),
    ])
  },

  FETCH_APPROVAL_STATUSES({ commit, rootState }) {
    logger('FETCH_APPROVAL_STATUSES action being executed')

    const {
      recordContract,
      tokenContract,
      stakeContract,
    } = rootState.web3
    const { address } = rootState.auth.user

    return Promise.all([
      tokenContract.methods.allowance(address, recordContract.address)
        .call()
        .then((allowance) => {
          commit('SET_APPROVAL_STATUS', {
            allowance,
            stateProperty: 'registryContractApproved',
          })
        }),
      tokenContract.methods.allowance(address, stakeContract.address)
        .call()
        .then((allowance) => {
          commit('SET_APPROVAL_STATUS', {
            allowance,
            stateProperty: 'stakeContractApproved',
          })
        }),
    ])
  },

  HIDE_SETUP({ commit }) {
    logger('HIDE_SETUP action being executed')

    commit('SET_HIDE_SETUP')
  },

  // This is currently used for handling some Metamask state changes
  //  Changing the route this navigates to will require updating how we handle
  //  the state changes.
  LOGOUT_USER({ commit }) {
    logger('LOGOUT_USER action being executed')

    commit('CLEAR_USER_STATE')

    // if this is an unauthenticated route, clear their auth token (i.e. log
    //  the user out), but do not redirect them to the login page
    if (router.currentRoute.meta && router.currentRoute.meta.allowUnauthenticatedUsers) {
      return
    }

    router.replace('/')
  },
}
