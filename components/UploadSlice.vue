<script setup lang="ts">
import useHttp, {errorMessage} from '~/api';

const http = useHttp();
import {calculateHash, type HashAlgorithm} from '~/utils/calcHash';

const props = withDefaults(defineProps<{ version?: 1 | 2 }>(), {version: 2});
const emit = defineEmits<{ (e: 'onCopy', value: string): void }>();
const file = ref<File | null>(null);
const algorithm = ref<HashAlgorithm>('sha256');
const hash = ref('');
const chunkSize = ref(2 * 1024 * 1024);
const taskName = ref('');
const saveName = ref('');
const uploaded = ref(0);
const busy = ref(false);
const hashing = ref(false);
const resultUrl = ref('');
const status = ref('请选择文件');
const total = computed(() => file.value ? Math.ceil(file.value.size / chunkSize.value) : 0);
const progress = computed(() => total.value ? Math.floor(uploaded.value / total.value * 100) : 0);
let generation = 0;
let controller: AbortController | null = null;
const reset = () => {
  taskName.value = '';
  hash.value = '';
  uploaded.value = 0;
  resultUrl.value = '';
  status.value = '';
};

async function computeHash() {
  const current = ++generation;
  hash.value = '';
  if (!file.value || props.version === 1) return;
  hashing.value = true;
  try {
    const value = await calculateHash(file.value, algorithm.value);
    if (current === generation) hash.value = value;
  } catch (error) {
    if (current === generation) ElMessage.error(errorMessage(error));
  } finally {
    if (current === generation) hashing.value = false;
  }
}

async function selectFile(event: Event) {
  reset();
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null;
  if (file.value?.size === 0) {
    file.value = null;
    ElMessage.error('空文件请使用普通上传');
  }
  await computeHash();
}

async function createTask() {
  if (!file.value || !hash.value || busy.value || taskName.value) return;
  busy.value = true;
  controller = new AbortController();
  try {
    const response = await http.post('/v2/upload/sliceHash', {
      name: file.value.name,
      hash: hash.value
    }, {signal: controller.signal});
    taskName.value = response.data.sliceName;
    status.value = '任务已创建，请上传分片（任务闲置 3 小时后过期）';
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    busy.value = false;
  }
}

async function uploadChunks() {
  if (!file.value || busy.value || (props.version === 2 && !taskName.value)) return;
  if (!Number.isSafeInteger(chunkSize.value) || chunkSize.value < 1 || chunkSize.value > 20 * 1024 * 1024) {
    ElMessage.error('分片大小应为 1～20971520 字节的整数');
    return;
  }
  busy.value = true;
  controller = new AbortController();
  // V1 使用唯一文件名，避免同名任务或目标文件冲突；失败后保留名称用于重试。
  if (props.version === 1 && !taskName.value) taskName.value = `${crypto.randomUUID()}_${file.value.name}`;
  try {
    while (uploaded.value < total.value) {
      const index = uploaded.value;
      const data = new FormData();
      data.set(props.version === 1 ? 'name' : 'sliceName', props.version === 1
          ? `${taskName.value}-${index}` : `${taskName.value}$${file.value.name}-${index}`);
      data.set('slice', file.value.slice(index * chunkSize.value, (index + 1) * chunkSize.value), 'chunk');
      await http.post(`/v${props.version}/upload/sliceMul`, data, {signal: controller.signal});
      uploaded.value++;
      status.value = `已上传 ${uploaded.value}/${total.value} 片`;
    }
    status.value = '分片上传完成，可以合并';
  } catch (error) {
    status.value = `${errorMessage(error)}；可点击上传分片重试`;
    ElMessage.error(status.value);
  } finally {
    busy.value = false;
  }
}

async function merge() {
  if (!file.value || busy.value || uploaded.value !== total.value || !taskName.value || resultUrl.value) return;
  busy.value = true;
  controller = new AbortController();
  try {
    const params = props.version === 1 ? {name: taskName.value, size: file.value.size}
        : {sliceName: taskName.value, saveName: saveName.value.trim() || undefined};
    const response = await http.get(`/v${props.version}/upload/sliceMerge`, params, {signal: controller.signal});
    resultUrl.value = http.resourceUrl(response.data.prefix, response.data.path);
    status.value = '上传并合并成功';
    ElMessage.success(status.value);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    busy.value = false;
  }
}

onBeforeUnmount(() => {
  generation++;
  controller?.abort();
});
</script>

<template>
  <el-card class="my-3">
    <div class="flex flex-wrap gap-3 items-center mb-4">
      <input type="file" :disabled="busy || hashing" @change="selectFile"/>
      <el-select v-if="version === 2" v-model="algorithm" style="width: 160px" :disabled="busy || hashing || !!taskName"
                 @change="computeHash">
        <el-option label="SHA-256" value="sha256"/>
        <el-option label="MD5" value="md5"/>
      </el-select>
      <span v-if="file">{{ file.name }} · {{ (file.size / 1024 / 1024).toFixed(2) }} MiB</span>
    </div>
    <p v-if="version === 2" class="mb-3 break-all">{{ algorithm.toUpperCase() }}：{{
        hashing ? '计算中…' : hash || '—'
      }}</p>
    <el-form label-width="140px">
      <el-form-item label="分片大小（字节）">
        <el-input-number v-model="chunkSize" :min="1" :max="20 * 1024 * 1024" :precision="0"
                         :disabled="busy || !!taskName"/>
      </el-form-item>
      <el-form-item v-if="version === 2" label="保存名称（可选）">
        <el-input v-model="saveName" placeholder="不含扩展名；留空使用默认名称" :disabled="busy || !!resultUrl"/>
      </el-form-item>
    </el-form>
    <p class="mb-3 break-all">任务名称：{{ taskName || '—' }}</p>
    <el-progress :percentage="progress"/>
    <p class="my-3">{{ status }}</p>
    <div class="flex flex-wrap gap-2">
      <el-button v-if="version === 2" :disabled="!hash || hashing || busy || !!taskName" @click="createTask">上传 hash /
        创建任务
      </el-button>
      <el-button type="primary" :loading="busy"
                 :disabled="!file || hashing || busy || (version === 2 && !taskName) || (!!total && uploaded === total)"
                 @click="uploadChunks">上传分片 / 重试
      </el-button>
      <el-button type="success" :disabled="busy || !total || uploaded !== total || !!resultUrl" @click="merge">
        合并分片
      </el-button>
    </div>
    <div v-if="resultUrl" class="mt-4 break-all">
      <a :href="resultUrl" target="_blank" rel="noopener noreferrer">{{ resultUrl }}</a>
      <el-button class="ml-3" @click="emit('onCopy', resultUrl)">复制链接</el-button>
    </div>
  </el-card>
</template>
