<script setup lang="ts">
import useHttp, {errorMessage} from '~/api';
const http = useHttp();
import {Upload} from '~/api/api';
import {useIndexedDB} from '~/utils/indexDb';
import {getStorage, setStorage, removeStorage} from '~/utils/storage';
import {calculateHash, type HashAlgorithm} from '~/utils/calcHash';
import {copyToClipboard} from '~/utils/copy';
interface DownloadTask {
  path: string; size: number; mPath: string; totalSize: number;
  totalChunk: number; fileHash: string; hashAlgorithm: HashAlgorithm;
}
const f = reactive({path: '/static/sliceMedia/2026/09/09/ytsaver_v11.1.2.zip', size: 2048, hashAlgorithm: 'sha256' as HashAlgorithm});
const task = ref<DownloadTask | null>(null);
const currentChunk = ref(0);
const busy = ref(false);
const paused = ref(false);
const ready = ref(false);
const status = ref('请输入文件路径');
const downloadedBytes = ref(0);
const completed = ref(false);
const progress = computed(() => completed.value ? 100 : task.value?.totalSize ? Math.min(100, Math.floor(downloadedBytes.value / task.value.totalSize * 100)) : 0);
let db: ReturnType<typeof useIndexedDB>;
let controller: AbortController | null = null;
let running: Promise<void> | null = null;
let disposed = false;
const cacheKey = 'fileInfo';
async function copy(value: string) {
  try { await copyToClipboard(value); ElMessage.success('已复制'); }
  catch { ElMessage.error('复制失败'); }
}
async function finishFile() {
  const info = task.value!;
  const chunks: Blob[] = [];
  for (let index = 0; index < info.totalChunk; index++) {
    const chunk = await db.getItem<Blob>(`chunk-${index}`);
    if (!chunk) throw new Error('下载分片缺失，请停止后重新下载');
    chunks.push(chunk);
  }
  const blob = new Blob(chunks, {type: 'application/octet-stream'});
  if (blob.size !== info.totalSize) throw new Error('文件大小校验失败，请停止后重新下载');
  status.value = '正在校验文件…';
  const hash = await calculateHash(blob, info.hashAlgorithm);
  if (paused.value || disposed) return;
  if (hash !== info.fileHash.trim().toLowerCase()) throw new Error('文件 hash 校验失败，请停止后重新下载');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = info.path.split('/').pop() || 'download';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  await db.clearAllData();
  removeStorage(cacheKey);
  task.value = null;
  completed.value = true;
  status.value = '校验通过，文件已保存';
}
async function download() {
  while (!paused.value && !disposed && currentChunk.value < task.value!.totalChunk) {
    const info = task.value!;
    const index = currentChunk.value;
    const blob: Blob = await http.get(Upload.fileLoad, {mPath: info.mPath, start: index}, {responseType: 'blob', signal: controller!.signal});
    if (paused.value || disposed) return;
    const expected = Math.min(info.size * 1024, info.totalSize - index * info.size * 1024);
    if (blob.size !== expected) throw new Error('下载分片大小异常，请重试或重新创建任务');
    await db.setItem(`chunk-${index}`, blob);
    currentChunk.value++;
    downloadedBytes.value += blob.size;
    status.value = `已下载 ${currentChunk.value}/${info.totalChunk} 片`;
  }
  if (!paused.value && !disposed) await finishFile();
}
function run(start: boolean) {
  if (busy.value || !ready.value || (!start && !task.value)) return;
  busy.value = true;
  paused.value = false;
  controller = new AbortController();
  running = (async () => {
    try {
      if (start) {
        if (!f.path.trim() || !Number.isSafeInteger(f.size) || f.size < 1 || f.size > 102400) throw new Error('请输入路径及 1～102400 KiB 的整数分片大小');
        completed.value = false;
        status.value = '正在创建下载任务…';
        const {data} = await http.get(Upload.fileInfo, f, {signal: controller!.signal});
        if (paused.value || disposed) return;
        if (!['md5', 'sha256'].includes(data.hashAlgorithm) || typeof data.fileHash !== 'string') throw new Error('服务器未返回有效的 hash 算法或摘要');
        await db.clearAllData();
        task.value = {path: f.path, size: f.size, mPath: data.mPath, totalSize: data.totalSize, totalChunk: data.sliceNum, fileHash: data.fileHash, hashAlgorithm: data.hashAlgorithm};
        currentChunk.value = 0;
        downloadedBytes.value = 0;
        setStorage(cacheKey, {...task.value, cacheVersion: 2});
      }
      await download();
    } catch (error) {
      if (!paused.value && !disposed) { status.value = errorMessage(error); ElMessage.error(status.value); }
    } finally { busy.value = false; }
  })();
}
function pause() {
  paused.value = true;
  controller?.abort();
  status.value = '已暂停';
}
async function stop() {
  pause();
  await running;
  busy.value = true;
  try {
    await db.clearAllData(); removeStorage(cacheKey);
    task.value = null; currentChunk.value = 0; downloadedBytes.value = 0; completed.value = false;
    status.value = '已停止，可重新下载';
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { busy.value = false; }
}
onMounted(async () => {
  db = useIndexedDB('fileDB', 'tempFiles');
  try {
    const saved = getStorage(cacheKey);
    if (saved?.cacheVersion === 2 && saved.mPath && saved.path && ['md5', 'sha256'].includes(saved.hashAlgorithm)) {
      task.value = saved;
      Object.assign(f, {path: saved.path, size: saved.size, hashAlgorithm: saved.hashAlgorithm});
      for (let index = 0; index < saved.totalChunk; index++) {
        const chunk = await db.getItem<Blob>(`chunk-${index}`);
        if (!chunk) break;
        currentChunk.value++;
        downloadedBytes.value += chunk.size;
      }
      status.value = '已恢复下载记录，点击继续；任务过期时请停止后重新下载';
    } else {
      await db.clearAllData();
      removeStorage(cacheKey);
      if (saved) status.value = '旧下载记录缺少任务信息，请重新下载';
    }
    ready.value = true;
  } catch (error) { status.value = `无法读取下载缓存：${errorMessage(error)}`; }
});
onBeforeUnmount(() => { disposed = true; paused.value = true; controller?.abort(); });
const example = `// size 单位 KiB，算法与文件大小无关。
const { data: task } = await http.get('/v1/download/fileSizeB', {
  path, size: 2048, hashAlgorithm: 'sha256'
});
// start 为从 0 开始的分片序号；依次下载并保存分片。
const chunk = await http.get('/v1/download/fileB', {
  mPath: task.mPath, start: index
}, { responseType: 'blob' });
// 按序合并所有分片；校验通过后才保存文件。
const blob = new Blob(chunks);
if (blob.size !== task.totalSize ||
    await calculateHash(blob, task.hashAlgorithm) !== task.fileHash) {
  throw new Error('文件校验失败');
}`;
</script>

<template>
  <div class="m-5">
    <h2 class="text-xl font-semibold mb-4">文件分片下载</h2>
    <el-input :model-value="Upload.fileInfo" readonly class="mb-4">
      <template #append><el-button @click="copy(Upload.fileInfo)">复制接口</el-button></template>
    </el-input>
    <el-card>
      <el-form label-width="150px" :disabled="busy || !!task || !ready">
        <el-form-item label="文件路径"><el-input v-model="f.path" placeholder="/static/media/…" /></el-form-item>
        <el-form-item label="分片大小（KiB）"><el-input-number v-model="f.size" :min="1" :max="102400" :precision="0" /></el-form-item>
        <el-form-item label="校验算法">
          <el-select v-model="f.hashAlgorithm" style="width: 180px"><el-option label="SHA-256" value="sha256" /><el-option label="MD5" value="md5" /></el-select>
        </el-form-item>
      </el-form>
      <p class="break-all mb-4">服务器摘要：{{ task?.fileHash || '—' }}</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <el-button type="primary" :disabled="busy || !!task || !ready" @click="run(true)">开始下载</el-button>
        <el-button :disabled="!busy || paused" @click="pause">暂停</el-button>
        <el-button type="success" :disabled="busy || !task || !ready" @click="run(false)">继续 / 重试</el-button>
        <el-button type="danger" :disabled="!ready || (!task && !busy)" @click="stop">停止并清除</el-button>
      </div>
      <el-progress :percentage="progress" />
      <p class="mt-3">{{ status }}</p>
      <p>文件大小：{{ ((task?.totalSize ?? downloadedBytes) / 1024 / 1024).toFixed(2) }} MiB</p>
      <p>已下载：{{ (downloadedBytes / 1024 / 1024).toFixed(2) }} MiB</p>
    </el-card>
    <div class="mt-5"><el-button @click="copy(example)">复制示例</el-button></div>
    <div v-highlight class="mt-3 overflow-auto"><pre><code class="language-javascript">{{ example }}</code></pre></div>
  </div>
</template>
