<script setup lang="ts">
import useHttp, {errorMessage} from '~/api';
const http = useHttp();
const props = defineProps<{multiple?: boolean}>();
const files = ref<File[]>([]);
const busy = ref(false);
const links = ref<string[]>([]);
let controller: AbortController | null = null;
function select(event: Event) {
  files.value = Array.from((event.target as HTMLInputElement).files ?? []);
  links.value = [];
}
async function upload() {
  if (busy.value) return;
  const limits: Record<string, number> = {image: 5, audio: 10, video: 50, application: 100};
  const selected = files.value;
  if (!selected.length || selected.length > (props.multiple ? 10 : 1)) { ElMessage.error('请选择文件，多文件上传最多 10 个'); return; }
  const types = selected.map(file => (file.type || 'application/octet-stream').split('/')[0]);
  if (new Set(types).size !== 1 || selected.some((file, index) => !limits[types[index]] || file.size > limits[types[index]] * 1024 * 1024)) {
    ElMessage.error('文件类型或大小不符合限制，多文件必须为同一种类型'); return;
  }
  if (selected.reduce((sum, file) => sum + file.size, 0) > 200 * 1024 * 1024) { ElMessage.error('总大小不能超过 200 MiB'); return; }
  busy.value = true;
  links.value = [];
  controller = new AbortController();
  try {
    const data = new FormData();
    for (const file of selected) data.append(props.multiple ? 'files' : 'file', file, file.name);
    const response = await http.post(`/v1/upload/${props.multiple ? 'multiple' : 'single'}`, data, {signal: controller.signal});
    const paths: string[] = props.multiple ? response.data.paths : [response.data.path];
    links.value = paths.map(path => http.resourceUrl(response.data.prefix, path));
    ElMessage.success('上传成功');
  } catch (error) {
    console.log(error)
    ElMessage.error(errorMessage(error));
  }
  finally { busy.value = false; }
}
onBeforeUnmount(() => controller?.abort());
</script>
<template>
  <div class="my-3">
    <input type="file" :multiple="multiple" :disabled="busy" @change="select" />
    <el-button type="primary" :loading="busy" :disabled="!files.length" @click="upload">上传</el-button>
    <ul class="mt-2 break-all"><li v-for="link in links" :key="link"><a :href="link" target="_blank" rel="noopener noreferrer">{{ link }}</a></li></ul>
  </div>
</template>
