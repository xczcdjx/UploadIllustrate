<template>
  <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      class="upload-demo"
      name="file"
      :action="getUrl()"
      :before-upload="beforeUpload"
      :limit="1"
      :auto-upload="false"
      :on-change="fileOnChange"
  >
    <template #trigger>
      <el-button type="primary">select file</el-button>
    </template>
    <el-button class="ml-3" type="success" @click="submitUpload">
      upload to server
    </el-button>
    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500KB.
      </div>
    </template>
  </el-upload>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import {ElMessage, ElMessageBox, type UploadRawFile} from 'element-plus'
const config=useRuntimeConfig()
const getUrl=()=>config.public.baseUrl+'/upload/sliceMul'
import type { UploadProps, UploadUserFile } from 'element-plus'

const fileList = ref<UploadUserFile[]>([])
const slicedFiles = ref<{ name: string; size: number; file: Blob }[]>([])
import type { UploadInstance } from 'element-plus'

const uploadRef = ref<UploadInstance>()

const submitUpload = () => {
  if (slicedFiles.value.length === 0) {
    ElMessage.error('No file selected or file not sliced')
    return
  }
  // Upload the sliced files
  uploadSlicedFiles()
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  console.log(rawFile)
  // Prevent default upload behavior
  return false
}

const fileOnChange = (file: UploadUserFile, fileList: UploadUserFile[]) => {
  if (file.raw) {
    sliceFile(file.raw)
  }
}
const sliceFile = (rawFile: UploadRawFile) => {
  const chunkSize = Math.ceil(rawFile.size / 10)
  slicedFiles.value = []
  const randomStr=Math.random().toString().slice(2,8)
  for (let i = 0; i < 10; i++) {
    const start = i * chunkSize
    const end = start + chunkSize
    const blob = rawFile.slice(start, end)
    const partFile = {
      name: randomStr+'_'+rawFile.name + '-' + i,
      size: blob.size,
      file: blob,
    }
    slicedFiles.value.push(partFile)
  }
}

const uploadSlicedFiles = async () => {
  console.log(slicedFiles.value,fileList.value)
  /*const promises = slicedFiles.value.map((partFile, index) => {
    const formData = new FormData()
    formData.append('file', partFile.file, partFile.name)
    return fetch(getUrl(), {
      method: 'POST',
      body: formData,
    })
  })*/

 /* try {
    await Promise.all(promises)
    ElMessage.success('Files uploaded successfully')
  } catch (error) {
    ElMessage.error('Failed to upload files')
  }*/
}

const formatSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}
</script>
