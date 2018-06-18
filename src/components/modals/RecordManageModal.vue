<template>
  <meta-mask-notification-modal
    id="recordManageModal"
    title="Modify Record"
    ok-title="Save"
    cancel-variant="outline-primary"
    size="lg"
    :ok-method="updateMetadata"
    :on-clear="clearModal"
  >
    <b-form-group
      label="Name"
      label-for="name"
    >
      <b-form-input
        id="name"
        v-model="name"
        @input="updateNameHash"
        type="text"
      />
    </b-form-group>
    <b-form-group
      label="Description"
      label-for="description"
    >
      <b-form-textarea
        id="description"
        v-model="description"
        @input="updateDescriptionHash"
        :rows="4"
      />
    </b-form-group>
    <b-form-group
      label="Main Image"
    >
      <b-img
        class="record-image"
        thumbnail
        fluid
        :src="imageStreamUri || mainImage.uri"
        alt="Main Image"
      />
    </b-form-group>
    <b-form-group
      label="Replace Main Image"
    >
      <b-form-file
        class="mt-3"
        accept="image/*"
        @input="displayAndUploadFile"
      />
      <b-progress
        class="mt-2"
        v-if="progressVisible"
        :value="100"
        :animated="!uploadMainImageComplete"
        :variant="progressVariant">
      </b-progress>
    </b-form-group>
    <b-form-group
      v-if="images.length"
      label="Other Images"
    >
      <span
        v-for="image in images"
        v-bind:key="image.id"
        class="other-image"
      >
        <b-img
          class="record-image"
          thumbnail
          fluid
          :src="image.uri"
          alt="Other Image"
        /><br>
        <b-button
          size="sm"
          variant="danger"
          @click.prevent="removeImage(image.id)"
        >
          Delete
        </b-button>
      </span>
    </b-form-group>
    <b-form-group
      label="Upload Images"
    >
      <vue-dropzone
        ref="dropzone"
        id="dropzone"
        :options="dropzoneOptions"
        :destroyDropzone="false"
        v-on:vdropzone-success="fileAdded"
        v-on:vdropzone-removed-file="fileRemoved"
      />
    </b-form-group>
  </meta-mask-notification-modal>
</template>

<script>
import axios from 'axios'
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import EventBus from '../../util/eventBus'

import { apiUrl } from '../../util/config'
import callContract from '../../util/web3/callContract'
import MetaMaskNotificationModal from './MetaMaskNotificationModal'

export default {
  name: 'record-manage-modal',
  props: ['codexRecord'],
  components: {
    vueDropzone: vue2Dropzone,
    MetaMaskNotificationModal,
  },
  data() {
    // Extra image objects
    const images = Array.from(this.codexRecord.metadata.images)

    // Extra image `id`s and `hash`s
    const imageIds = this.codexRecord.metadata.images.map(({ id, hash }) => {
      return { id, hash }
    })

    const filesUrl = `${apiUrl}/users/files`

    return {
      name: this.codexRecord.metadata.name,
      nameHash: this.codexRecord.metadata.nameHash,
      description: this.codexRecord.metadata.description,
      descriptionHash: this.codexRecord.metadata.descriptionHash,
      mainImage: this.codexRecord.metadata.mainImage,
      mainImageFileHash: this.codexRecord.metadata.mainImage.hash,
      mainImageId: this.codexRecord.metadata.mainImage.id,
      uploadedMainImageFile: null,
      imageStreamUri: null,
      progressVisible: false,
      uploadMainImageComplete: false,
      uploadMainImageSuccess: false,
      images,
      imageIds,
      fileHashes: this.codexRecord.metadata.fileHashes,
      tokenId: this.codexRecord.tokenId,
      providerMetadataId: this.codexRecord.metadata.id,
      dropzoneOptions: {
        url: filesUrl,
        paramName: 'files',
        thumbnailWidth: 150,
        maxFilesize: 5,
        addRemoveLinks: true,
        headers: { Authorization: this.$store.state.auth.authToken },
      },
    }
  },
  methods: {
    getMainImageId() {
      return { id: this.mainImageId }
    },
    setMainImageId(id) {
      this.mainImageId = id
    },
    // Record a new extra image which has been added
    addImage(id, uuid, hash) {
      this.imageIds.push({ id, uuid, hash })
      this.addFileHash(hash)
    },
    // Remove a new extra image that was added but not saved
    removeAddedImage(uuid) {
      const indexToRemove = this.imageIds.findIndex((imageId) => {
        return imageId.uuid === uuid
      })

      if (indexToRemove !== -1) {
        this.removeFileHash(this.imageIds[indexToRemove].hash)
        this.imageIds.splice(indexToRemove, 1)
      }
    },
    addFileHash(hash) {
      this.fileHashes.push(hash)
    },
    removeFileHash(hash) {
      this.fileHashes = this.fileHashes.filter((fileHash) => {
        return fileHash !== hash
      })
    },
    // Remove a saved extra image
    removeImage(id) {
      const indexToRemove = this.imageIds.findIndex((imageId) => {
        return imageId.id === id
      })

      if (indexToRemove !== -1) {
        this.removeFileHash(this.imageIds[indexToRemove].hash)
        this.imageIds.splice(indexToRemove, 1)
        this.images.splice(indexToRemove, 1)
      }
    },
    updateNameHash() {
      this.nameHash = this.hash(this.name)
    },
    updateDescriptionHash() {
      this.descriptionHash = this.hash(this.description)
    },
    hash(input) {
      return this.$store.state.web3.instance().sha3(input)
    },
    // Upload a new main image
    displayAndUploadFile(file) {
      if (!file) {
        return
      }

      this.uploadFile(file)

      // display the file in the dialog box
      const fileReader = new FileReader()

      fileReader.addEventListener('loadend', () => {
        this.imageStreamUri = fileReader.result
      })

      fileReader.readAsDataURL(file)

      this.getFileHash(file, (err, hash) => {
        this.removeFileHash(this.mainImageFileHash)
        this.addFileHash(hash)
        this.mainImageFileHash = hash
      })
    },
    getFileHash(file, next) {
      const binaryFileReader = new FileReader()

      binaryFileReader.addEventListener('loadend', () => {
        next(null, this.web3.instance().sha3(binaryFileReader.result))
      })

      binaryFileReader.readAsBinaryString(file)
    },
    // Handle the upload of a new main image
    uploadFile(file) {

      this.progressVisible = true
      this.uploadMainImageSuccess = false
      this.uploadMainImageComplete = false

      const formData = new FormData()
      formData.append('files', file)

      const requestOptions = {

        method: 'post',
        url: '/users/files',

        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        },

        data: formData,
      }

      axios(requestOptions)
        .then((response) => {

          const { result } = response.data

          this.uploadedMainImageFile = result[0]
          this.uploadMainImageSuccess = true
          this.setMainImageId(this.uploadedMainImageFile.id)

        })
        .catch((error) => {
          EventBus.$emit('toast:error', `Could not upload file: ${error.message}`)
          console.error('Could not upload file:', error)
        })
        .finally(() => {
          this.uploadMainImageComplete = true
        })
    },
    getImageIds() {
      return this.imageIds.map((imageId) => {
        return { id: imageId.id }
      })
    },
    fileAdded(file, response) {
      const result = response.result[0]
      const { uuid } = file.upload
      const { id } = result
      this.getFileHash(file, (err, hash) => {
        this.addImage(id, uuid, hash)
      })
    },
    fileRemoved(file, error, xhr) {
      const { uuid } = file.upload
      this.removeAddedImage(uuid)
    },
    focusModal() {
      this.$refs.defaultModalFocus.focus()
    },
    clearModal() {
      Object.assign(this.$data, this.$options.data.apply(this))
    },
    updateMetadata() {

      const requestOptions = {

        method: 'put',
        url: `/users/records/${this.tokenId}/metadata`,

        data: {
          name: this.name,
          images: this.getImageIds(),
          description: this.description,
          mainImage: this.getMainImageId(),
        },
      }

      return axios(requestOptions)
        .then((response) => {
          return this.modifyRecord()
        })
        .catch((error) => {
          throw error
        })
    },
    modifyRecord() {
      const input = [
        this.tokenId,
        this.nameHash,
        this.descriptionHash,
        this.fileHashes,
        '1',
        this.providerMetadataId,
      ]
      return callContract(this.recordContract.modifyMetadataHashes, input, this.web3)
        .catch((error) => {
          console.error('there was an error calling modifyMetadataHashes', error)

          // @NOTE: we must throw the error here so the MetaMaskNotificationModal
          //  can catch() it too
          throw error
        })
    },
  },
  computed: {
    web3() {
      return this.$store.state.web3
    },
    recordContract() {
      return this.web3.recordContractInstance()
    },
    progressVariant() {
      if (!this.uploadMainImageComplete) {
        return 'primary'
      }

      if (this.uploadMainImageSuccess) {
        return 'success'
      }

      return 'danger'
    },
  },
}
</script>

<style lang="stylus" scoped>
.record-image
  max-width: 10rem

.other-image
  max-width: 10rem
  display: inline-block
  text-align: center

</style>