<script setup lang="ts">
const swaggerRef=ref<HTMLDivElement|null>(null)
onMounted(()=>{
  console.log(swaggerRef.value)
})
</script>

<template>
<div class="swagger my-2" ref="swaggerRef">
  <iframe src="http://192.168.124.27:3333/doc-l" width="100%" style="height: 560px" border="0" frameborder="0"></iframe>
</div>
</template>

<style scoped>
.swagger{
  width: 100%;
  min-height: 560px;
}
</style>
