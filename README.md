# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 上传和下载示例

- 服务地址统一读取 `nuxt.config.ts` 的 `runtimeConfig.public.baseUrl`，也可用 `NUXT_PUBLIC_BASE_URL` 覆盖。Swagger 使用相同地址。
- 页面顶部填写自己的 `accessToken`。凭证仅保存在当前页面内存，刷新后需重新填写；分片任务创建、上传、合并应使用同一身份。
- 单文件字段为 `file`，多文件字段为 `files`。图片 5 MiB、音频 10 MiB、视频 50 MiB、application 文件 100 MiB；多文件最多 10 个同类型文件、合计 200 MiB。
- V1 示例按序上传 `slice`，名称为 `文件名-序号`，合并传源文件准确字节数。自动生成唯一名称避免同名冲突。
- V2 可选择 SHA-256（默认）或 MD5；所有文件统一按所选算法增量计算完整摘要。先创建任务，再按序上传，最后合并。分片最多 20 MiB，失败后点击上传分片可从当前片重试。任务闲置 3 小时过期，过期后重新选择文件并创建任务。
- 下载分片大小单位为 KiB。下载任务、路径和摘要算法保存在本地，分片使用 IndexedDB 存储；刷新后点击继续恢复。后端下载任务有效期为 2 小时，过期或源文件变化时停止后重建任务。
- 下载完成后按服务端返回算法校验大小和摘要，成功才触发保存。缺少任务标识的旧下载缓存会清理，需要重新下载。
