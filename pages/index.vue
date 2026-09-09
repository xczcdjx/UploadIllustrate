<template>
 <div class="upload">
   <client-only>
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
             <UploadFiles :multiple="u.p.endsWith('multiple')" />
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
           <pre><code class="language-javascript">{{ v1Example }}</code></pre>
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
           <pre><code class="language-javascript">{{ v2Example }}</code></pre>
         </div>
       </div>
     </div>
   </client-only>
 </div>
</template>

<script setup lang="ts">
import {copyToClipboard} from "~/utils/copy";
import UploadSlice from "~/components/UploadSlice.vue";
const copyCode=async (str:string)=>{
  try { await copyToClipboard(str); ElMessage.success('复制成功') }
  catch { ElMessage.error('复制失败') }
}
const singleUpload=[
  {t:'单',p:'/v1/upload/single',extra:'(图片5 MiB、音频10 MiB、视频50 MiB、application文件100 MiB)'},
  {t:'多',p:'/v1/upload/multiple',extra:'(同类型最多10个，合计200 MiB；单文件限制同上)'}
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
const v1Example = `// 同一任务按序上传，单片最多 20 MiB；name 在整个任务中保持一致。
const data = new FormData();
data.set('name', name + '-0');
data.set('slice', file.slice(0, chunkSize));
await http.post('/v1/upload/sliceMul', data);
// 全部分片完成后，size 必须为原文件准确字节数。
await http.get('/v1/upload/sliceMerge', { name, size: file.size });`;
const v2Example = `// 分块计算完整文件摘要；SHA-256 / MD5 均不按文件大小切换。
const hash = await calculateHash(file, 'sha256');
const { data: task } = await http.post('/v2/upload/sliceHash', { name: file.name, hash });
// 对所有分片按序执行；index 从 0 开始。
const data = new FormData();
data.set('sliceName', task.sliceName + '$' + file.name + '-' + index);
data.set('slice', chunk);
await http.post('/v2/upload/sliceMul', data);
// 全部分片完成后合并，后端按提交的摘要校验。
await http.get('/v2/upload/sliceMerge', { sliceName: task.sliceName });`;
</script>
<style scoped>
.upload{
  box-sizing: border-box;
  margin: 20px;
}

</style>
