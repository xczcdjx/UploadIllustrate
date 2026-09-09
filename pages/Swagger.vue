<script setup lang="ts">
const config = useRuntimeConfig();
const docsUrl = computed(() => String(config.public.baseUrl).replace(/\/$/, '') + '/doc-l');
</script>

<template>
<div class="swagger my-2">
  <iframe :src="docsUrl" title="Upload Service API 文档" width="100%" style="height: 560px" border="0" frameborder="0"></iframe>
</div>
</template>

<style scoped>
.swagger{
  width: 100%;
  min-height: 560px;
}
</style>
