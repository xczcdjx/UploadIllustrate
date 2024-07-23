<template>
 <div class="upload">
   <div class="border-b border-gray-900/10 pb-12">
     <h2 class="text-base font-semibold leading-7 text-gray-900">单多文件上传</h2>
     <div class="mt-5">
       <div class="col-span-full">
        <div v-for="u in singleUpload" :key="u.p" class="mb-4">
          <label for="photo" class="block mb-1 text-sm font-medium leading-6 text-gray-900">
            {{u.t}}文件上传 (此接口较为简单，直接调用即可)
          <span class="pl-2 text-red-500">{{u.extra}}</span>
          </label>
          <el-input readonly :value="u.p">
            <template #append>
              <el-button type="primary">Copy</el-button>
            </template>
          </el-input>
        </div>
       </div>
     </div>
     <h2 class="text-base font-semibold leading-7 text-gray-900">切片上传</h2>
     <div class="slice mt-5">
       <label for="photo" class="block mb-1 text-sm font-medium leading-6 text-gray-900">
         切片操作
       </label>
       <el-input readonly :value="sliceUpload[0].p">
         <template #append>
           <el-button type="primary">Copy</el-button>
         </template>
       </el-input>
       <p class="m-1">示例</p>
       <UploadDemo/>
       <div v-highlight>
         <pre><code class="language-javascript">var a=123</code></pre>
       </div>
     </div>
   </div>
 </div>
</template>

<script setup lang="ts">
import { PhotoIcon, UserCircleIcon } from '@heroicons/vue/24/solid'
const dropUploadRef=ref<HTMLDivElement|null>(null)
onMounted(()=>{
  const dropRef=dropUploadRef.value

})
const singleUpload=[
  {t:'单',p:'/upload/single',extra:'(仅限上传img,audio,video,application)'},
  {t:'多',p:'/upload/multiple',extra:'(同上且总数量最大为10,单次大小20mb)'}
]
const sliceUpload=[
  {t:'单',p:'/upload/sliceMul',extra:''},
  {t:'多',p:'/upload/sliceMerge',extra:''}
]
</script>
<style scoped>
.upload{
  box-sizing: border-box;
  margin: 20px;
}

</style>
