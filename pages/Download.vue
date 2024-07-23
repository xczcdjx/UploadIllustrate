<script setup lang="ts">
import {ref} from 'vue'
import http from "~/api";
import {Upload} from "~/api/api";
import { useIndexedDB } from '~/utils/indexDb';
import {getStorage, setStorage} from "~/utils/storage";
// indexDb 存储支持
const config=useRuntimeConfig()
const isClient=computed(()=>!config.isServer)
const indexedDB = isClient.value ? useIndexedDB('fileDB', 'tempFiles') : null;
const sliceDownload = [
  {t: '后', p: '/v1/download/fileSizeB', extra: ''},
]
const f = reactive({
  path: '/static/sliceMedia/willow.mp4',
  size: 256
})
const currentChunk=ref<number>(0)
// let fileTemp:Blob[]=[]
const isDownload=ref<boolean>(false)
const fileInfo=reactive({
  mPath:'',
  totalSize:0,
  totalChunk:1
})
const onStart=()=>{
  // 获取文件信息
  http.get(Upload.fileInfo,f).then(v=>{
    const {totalSize,sliceNum,sliceSize,mPath,path}=v.data
    fileInfo.totalSize=totalSize
    fileInfo.totalChunk=sliceNum
    fileInfo.mPath=mPath
    isDownload.value=true
    setStorage('fileInfo',{
      totalSize,
      size:f.size,
      totalChunk:sliceNum,
    })
    downFile()
  }).catch(r=>{
    console.log(r)
  })
}
const onPause = () => {
  isDownload.value=false
}
const onResume = () => {
  isDownload.value=true
  downFile()
}
const onStop = async () => {
  if (isClient.value) await indexedDB!.clearAllData();
  isDownload.value = false;
  currentChunk.value = 0;
}
async function downFile() {
  if (currentChunk.value>=fileInfo.totalChunk) return
  const res=await http.get(Upload.fileLoad,{mPath:fileInfo.mPath,start:currentChunk.value},{responseType:'blob'})
  currentChunk.value++
  // IndexDb save
  if (isClient.value) await indexedDB!.setItem(`chunk-${currentChunk.value}`, res);

  if (isDownload.value&&currentChunk.value<fileInfo.totalChunk){
    downFile()
  }else if(currentChunk.value>=fileInfo.totalChunk){
    finishFile()
  }
}
async function finishFile() {
  if (!isClient.value) return
  const fileTemp: Blob[] = [];

  for (let i = 1; i <= currentChunk.value; i++) {
    const chunk = await indexedDB!.getItem<Blob>(`chunk-${i}`);
    if (chunk) {
      fileTemp.push(chunk);
    }
  }
  const blob = new Blob(fileTemp, { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.path.split('/').pop() as string;
  a.click();
  URL.revokeObjectURL(url);
  await indexedDB!.clearAllData();
  removeStorage('fileInfo')
}
// 初始化值
onMounted(async () => {
  if (isClient.value){
    const keys = await indexedDB!.getAllKeys();
    const dInfo=getStorage('fileInfo')
    if (dInfo!==null){
      fileInfo.totalSize=dInfo.totalSize
      fileInfo.totalChunk=dInfo.totalChunk
      f.size=dInfo.size
      if (keys.length > 0) {
        currentChunk.value = keys.length;
        isDownload.value = true;
      }
    }
  }
});
</script>

<template>
  <div class="download">
    <div class="border-b border-gray-900/10 pb-12">
      <h2 class="text-base font-semibold leading-7 text-gray-900">文件下载</h2>
      <div class="mt-5">
        <div class="col-span-full">
          <div class="mb-4">
            <label for="photo" class="block mb-1 text-sm font-medium leading-6 text-gray-900">
              大文件切片下载（主后）
            </label>
            <el-input readonly :value="sliceDownload[0].p">
              <template #append>
                <el-button type="primary">Copy</el-button>
              </template>
            </el-input>
          </div>
          <el-card>
            <el-form>
              <el-form-item label="文件切割大小">
                <el-input-number v-model="f.size" :min="50"></el-input-number>
              </el-form-item>
              <el-form-item label="文件路径">
                <el-input v-model="f.path"></el-input>
              </el-form-item>
            </el-form>
            <div class="mt-2">
              <el-button-group>
                <el-button type="primary" @click="onStart">Start Download</el-button>
                <el-button type="success" @click="onPause">Pause Download</el-button>
                <el-button type="warning" @click="onResume">Resume Download</el-button>
                <el-button type="danger" @click="onStop">Stop Download</el-button>
              </el-button-group>
              <h2 class="text-2xl text-gray-700 m-3 text-center">Download Status</h2>
              <div>
                <el-progress :text-inside="true" :stroke-width="26" :percentage="parseInt((currentChunk/fileInfo.totalChunk)*100+'')"/>
                <p class="mt-3">File Size: {{(fileInfo.totalSize/1024/1024).toFixed(2)}} MB</p>
                <p>Downloaded Size: {{ (currentChunk * f.size/1024).toFixed(2)}} MB</p>
              </div>
            </div>
          </el-card>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.download {
  box-sizing: border-box;
  margin: 20px;
}
</style>
