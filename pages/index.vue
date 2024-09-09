<template>
 <div class="upload">
   <div class="border-b border-gray-900/10 pb-12">
     <h2 class="text-xl font-semibold leading-7 text-gray-900">单多文件上传</h2>
     <div class="mt-5">
       <div class="col-span-full">
        <div v-for="u in singleUpload" :key="u.p" class="mb-4">
          <label for="photo" class="block mb-1 text-sm font-medium leading-6 text-gray-900">
            {{u.t}}文件上传 (此接口较为简单，直接调用即可)
          <span class="pl-2 text-red-500">{{u.extra}}</span>
          </label>
          <el-input readonly :value="u.p">
            <template #append>
              <el-button type="primary" @click="copyCode(u.p)">Copy</el-button>
            </template>
          </el-input>
        </div>
       </div>
     </div>
     <h2 class="text-xl font-semibold leading-7 text-gray-900">切片上传</h2>
     <h5 class="text-center mt-3 font-semibold leading-7 text-gray-900">V1 版本</h5>
     <div class="slice mt-5">
       <template v-for="l in sliceUpload" :key="l.p">
       <div class="flex gap-4 align-center mb-2">
         <label for="photo" style="width: 120px" class="block text-right font-medium leading-6 text-gray-900">
           {{l.t}}
         </label>
         <el-input readonly :value="l.p">
           <template #append>
             <el-button type="primary"  @click="copyCode(l.p)">Copy</el-button>
           </template>
         </el-input>
       </div>
       </template>
       <p class="m-1">示例</p>
       <UploadDemo/>
       <div v-highlight>
         <pre><code class="language-javascript">var a=123</code></pre>
       </div>
     </div>

     <h5 class="text-center mt-3 mb-2 font-semibold leading-7 text-gray-900">V2 版本</h5>
     <div class="slice">
       <template v-for="l in sliceUploadV2" :key="l.p">
         <div class="flex gap-4 align-center mb-2">
       <label for="photo" style="width: 120px;" class="block text-right font-medium leading-6 text-gray-900">
         {{l.t}}
       </label>
        <el-input readonly :value="l.p">
          <template #append>
            <el-button type="primary" @click="copyCode(l.p)">Copy</el-button>
          </template>
        </el-input>
         </div>
      </template>
       <p class="m-1">示例</p>
       <UploadSlice @onCopy="copyCode"/>
       <div v-highlight>
         <pre><code class="language-javascript">var a=123</code></pre>
       </div>
     </div>
   </div>
 </div>
</template>

<script setup lang="ts">
import { PhotoIcon, UserCircleIcon } from '@heroicons/vue/24/solid'
import {copyToClipboard} from "~/utils/copy";
import UploadSlice from "~/components/UploadSlice.vue";
const dropUploadRef=ref<HTMLDivElement|null>(null)
const copyCode=async (str:string)=>{
  await copyToClipboard(str)
  ElMessage.success(`${str} 复制成功`)
}
onMounted(()=>{
  const dropRef=dropUploadRef.value

})
const singleUpload=[
  {t:'单',p:'/v1/upload/single',extra:'(仅限上传img,audio,video,application)'},
  {t:'多',p:'/v1/upload/multiple',extra:'(同上且总数量最大为10,单次大小20mb)'}
]
const sliceUpload=[
  {t:'切片分割上传',p:'/v1/upload/sliceMul',extra:''},
  {t:'合并校验',p:'/v1/upload/sliceMerge',extra:''}
]
const sliceUploadV2=[
  {t:'获取文件hash',p:'/v2/upload/sliceHash',extra:''},
  {t:'分割切片上传',p:'/v2/upload/sliceMul',extra:''},
  {t:'合并校验',p:'/v2/upload/sliceMerge',extra:''}
]
</script>
<style scoped>
.upload{
  box-sizing: border-box;
  margin: 20px;
}

</style>
