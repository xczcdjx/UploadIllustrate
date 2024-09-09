<script setup lang="ts">
import http from "~/api";
import CryptoJS from "crypto-js";
import SparkMD5 from "spark-md5";
defineEmits<{
  (e:'onCopy',str:string):void
}>()
const headers = {accessToken: 'ngsujlCxr2RL4jkZBw9ZA9ZqrSS5AUkUUBN7C11QdjSxHAZM2MUgS/sr4mUm/Ut6'};
const sizeObj = {min: 100 * 1024, max: 1024 * 1024 * 20}
const progressObj = reactive({
  step: 1,
  u2Loading: false,
  u3Loading: false,
  sucLink: null
})
const sinFileSize = ref<number>(100 * 1024)
const showSize = computed(() => calS(sinFileSize.value))
const fileV = ref<File | null>(null)
const fileHash = ref<string | null>(null)
const sliceName = ref<string>('')
const chunk = ref<Blob[]>([])
const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    chunk.value=[]
    Object.assign(progressObj,{
      step: 1,
      u2Loading: false,
      u3Loading: false,
      sucLink: null
    })
    fileV.value = input.files[0]
    const s = input.files[0].size
    // 计算推荐上传大小
    if (s < 1024 * 1024) {
      sinFileSize.value = 1024 * 100
      fileHash.value = await calculateFileHash(input.files[0])
    }
    else {
      sinFileSize.value = sinFileSize.value = 1024 * 1024 * 2
      // 5倍hash读取
      fileHash.value=await calculateFileSparkHash(input.files[0],sinFileSize.value*5)
    }
  }
}
const upHash = () => {
  http.post('/v2/upload/sliceHash', {
    name: fileV.value?.name,
    hash: fileHash.value
  }, {headers}).then(v => {
    progressObj.step = 2
    ElMessage.success(v.msg)
    sliceName.value = v.data.sliceName
  }).catch(r => {
    console.log(r)
  })
}

function calS(s: number) {
  if (s < 1024 * 1024) return (s / 1024).toFixed(2) + ' kb'
  else return (s / 1024 / 1024).toFixed(2) + ' mb'
}

async function calculateFileSparkHash(file: File, chunkSize: number): Promise<string> {
  const spark = new SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target) {
          resolve(event.target.result as ArrayBuffer);
        }
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(chunk);
    });
    spark.append(arrayBuffer);  // 每次处理部分文件
  }

  return spark.end();  // 返回最终的哈希值
}


async function calculateFileHash(file:File) {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const hash = CryptoJS.SHA256(wordArray);
  return hash.toString(CryptoJS.enc.Hex);
}

const uploadProgress = ref<number[]>([]); // 用于保存每个分片的上传进度
const uploadList = ref<string[]>([]); // 用于保存上传的分片信息
const uploadedChunksCount = ref(0); // 用于跟踪已经上传的分片数量
const config = useRuntimeConfig()

const upSlice = () => {
  uploadProgress.value=[]
  uploadList.value=[]
  const file = fileV.value!
  const chunks = chunk.value
  let startPos = 0;
  uploadedChunksCount.value = 0;
  const totalChunks = Math.ceil(file.size / sinFileSize.value);
  while (startPos < file.size) {
    const endPos = Math.min(startPos + sinFileSize.value, file.size);
    chunks.push(file.slice(startPos, endPos));
    startPos = endPos;
  }
  chunks.forEach((chunk, index) => {
    const data = new FormData();
    data.set('sliceName', sliceName.value + '$' + file.name + '-' + index);
    data.append('slice', chunk);
    /*http.post('/v2/upload/sliceMul',data,{headers}).then(v=>{
      console.log(v)
      ElMessage.success(v.msg)
    }).catch(r=>{
      console.log(r)
    })*/
    // 初始化进度为0
    uploadProgress.value[index] = 0;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${config.public.baseUrl}/v2/upload/sliceMul`);
    xhr.setRequestHeader('accessToken', headers.accessToken);
    // 监听上传进度
    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        uploadProgress.value[index] = Math.round((event.loaded / event.total) * 100);
      }
    };

    // 上传成功后更新列表
    xhr.onload = () => {
      if ([200, 201].includes(xhr.status)) {
        uploadedChunksCount.value++; // 上传成功记录值
        uploadList.value.push(`分片 ${index + 1}/${totalChunks} 上传成功`);
        // 当所有分片都上传成功时取消loading状态
        if (uploadedChunksCount.value === totalChunks) {
          progressObj.u2Loading = false;
          progressObj.step = 3; // 更新step为3
        }
      } else {
        uploadList.value.push(`分片 ${index + 1}/${totalChunks} 上传失败`);
      }
    };

    xhr.onerror = () => {
      uploadList.value.push(`分片 ${index + 1}/${totalChunks} 上传失败`);
    };

    xhr.setRequestHeader('Authorization', headers.accessToken);
    xhr.send(data);
  })
}
const upMergeSlice = () => {
  progressObj.u3Loading = true
  http.get('/v2/upload/sliceMerge', {sliceName: sliceName.value}, {headers}).then(v => {
    console.log(v)
    progressObj.sucLink=v.data.path
    ElMessage.success(v.msg)
  }).catch(r => {
    ElMessage.error(r.message)
  }).finally(() => {
    progressObj.u3Loading = false
  })
}
const onAccess = () => {
  window.open(config.public.baseUrl+`/static${progressObj.sucLink}`,'_blank')
}
</script>

<template>
  <div class="uploadSlice mt-2 mb-4">
    <div class="file">
      <div class="left">
        <p class="f">
          <template v-if="fileV">
            <div class="flex" style="align-items: center">
              <span>文件名：<el-text truncated style="width: 150px;transform: translateY(3px)">{{ fileV.name }}</el-text></span>&nbsp;&nbsp;&nbsp;&nbsp;
              <span>大小: <span class="text-blue-600">{{ calS(fileV.size) }}</span></span>
            </div>
          </template>
          <span v-else class="text-red-500">未选择文件</span>
        </p>
        <p class="hash">文件hash值 <span class="text-orange-400">{{ fileHash ?? '-' }}</span></p>
        <p class="size">
          <span>单尺寸大小 ：{{ showSize }}</span>
          <el-input-number size="small" v-model="sinFileSize" :min="sizeObj.min" :max="sizeObj.max"/>
        </p>
        <client-only>
          <el-slider size="small" v-model="sinFileSize" :min="sizeObj.min" :max="sizeObj.max"/>
        </client-only>
      </div>
      <div class="right">
        <p class="text-center">服务器回传文件名:
          <el-text class="text-green-400" style="max-width: 200px;transform: translateY(3px);margin-left: 10px"
                   truncated>{{ sliceName }}
          </el-text>
        </p>
        <ul class="upList">
          <li v-for="(message, index) in uploadList" :key="index">{{ message }} - {{ uploadProgress[index] }}%</li>
        </ul>
      </div>
    </div>
    <div class="finialPath mb-2 text-center">
      <p>上传成功路径: {{progressObj.sucLink??'-'}}</p>
      <el-button type="primary" size="small" :disabled="!progressObj.sucLink" @click="()=>$emit('onCopy',progressObj.sucLink!)">复制</el-button>
      <el-button type="primary" size="small" :disabled="!progressObj.sucLink" @click="onAccess">访问</el-button>
    </div>
    <div class="btn">
      <input type="file" @change="handleFileChange"/>
      <el-button type="info" @click="upHash" :disabled="!fileV">上传hash值</el-button>
      <el-button type="success" @click="upSlice" :disabled="progressObj.step!==2">上传分片</el-button>
      <el-button type="warning" @click="upMergeSlice" :disabled="progressObj.step!==3" :loading="progressObj.u3Loading">
        合并分片
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.uploadSlice {
  .file {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 10px;
    height: 150px;
    margin: 10px 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);

    .left {
      .hash {
        height: 55px;
      }

      .size {
        display: flex;

        .el-input-number {
          margin-left: 40px;
        }
      }

      .el-slider {
        padding: 0 20px;
      }
    }

    .right {
      .upList {
        margin-top: 5px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        height: 100px;
        overflow: auto;
      }
    }
  }

  .finialPath {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  .btn {
    input[type='file'] {
      width: 300px;
      margin-right: 10px;
    }
  }
}
</style>
