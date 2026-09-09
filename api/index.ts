export interface Data<T = any> { code: number; data: T; msg: string }
interface RequestOptions {
    headers?: HeadersInit;
    responseType?: 'blob';
    signal?: AbortSignal;
}
export function errorMessage(error: unknown): string {
    const payload = error as { msg?: unknown; message?: any } | null;
    const message = payload?.msg ?? payload?.message?.message ?? payload?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join('；');
    return String(error);
}
export class HttpRequest {
    constructor(private base: string, private token: () => string, private origin: string) {}
    resourceUrl(prefix: string | undefined, path: string): string {
        return `${(prefix || `${this.base}/static`).replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }
    async request(url: string, method: string, data: any, options: RequestOptions = {}): Promise<any> {
        // 相对代理路径（如 /up）以当前页面域名解析，完整服务地址保持不变。
        const target = new URL(`${this.base}${url}`, this.origin);
        const headers = new Headers(options.headers);
        const token = this.token().trim();
        if (token && !headers.has('accessToken')) headers.set('accessToken', token);
        if (/^\/v[12]\/upload\//.test(url) && !headers.get('accessToken')?.trim() && !headers.get('Authorization')?.trim()) {
            throw new Error('请先在页面顶部填写 accessToken 后再上传');
        }
        let body: BodyInit | undefined;
        if (method === 'GET') {
            for (const [key, value] of Object.entries(data ?? {})) {
                if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
            }
        } else if (data instanceof FormData) body = data;
        else if (data !== undefined) {
            headers.set('Content-Type', 'application/json');
            body = JSON.stringify(data);
        }
        let response: Response;
        try {
            response = await fetch(target, {method, headers, body, signal: options.signal});
        } catch (error) {
            if (options.signal?.aborted || (error as Error)?.name === 'AbortError') throw error;
            throw new Error('网络连接中断或服务不可用，请检查连接后重试');
        }
        if (response.ok && options.responseType === 'blob') return response.blob();
        const text = await response.text();
        let payload: any;
        try {
            payload = JSON.parse(text);
        } catch {
            throw new Error(response.ok
                ? '服务返回了无法识别的响应，请稍后重试'
                : `请求失败（HTTP ${response.status}），服务未返回有效的错误信息`);
        }
        if (!response.ok) {
            throw payload?.msg || payload?.message
                ? payload
                : new Error(`请求失败（HTTP ${response.status}）`);
        }
        if (payload.success === false || (payload.code !== undefined && ![200, 201, 206].includes(payload.code))) {
            throw payload;
        }
        return payload;
    }
    get(url: string, params?: any, options?: RequestOptions) { return this.request(url, 'GET', params, options); }
    post(url: string, data?: any, options?: RequestOptions) { return this.request(url, 'POST', data, options); }
}
export default function useHttp() {
    const base = String(useRuntimeConfig().public.baseUrl).replace(/\/$/, '');
    const token = useState<string>('api-access-token', () => '');
    const origin = useRequestURL().origin;
    return new HttpRequest(base, () => token.value, origin);
}
