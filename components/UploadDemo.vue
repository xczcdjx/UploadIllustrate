<template>
  <UploadSlice :version="1" @on-copy="copy" />
</template>
<script setup lang="ts">
import {copyToClipboard} from '~/utils/copy';
async function copy(value: string) {
  try { await copyToClipboard(value); ElMessage.success('已复制'); }
  catch { ElMessage.error('复制失败'); }
}
</script>
