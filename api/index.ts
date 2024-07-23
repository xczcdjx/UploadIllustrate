import {type UseFetchOptions} from "nuxt/app";
import {type FetchContext,type FetchResponse} from "ofetch";
// import {userStore} from "~/store/user";

type Methods = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
const BASE_URL = 'http://192.168.124.27:3333';

export interface Data<T = any> {
    code: number;
    data: T;
    msg: string;
}

export interface errorData {
    message: string,
    error: string,
    statusCode: number
}

class HttpRequest {
    request<T = any>(
        url: string,
        method: Methods,
        data: any,
        options?: UseFetchOptions<T>,
    ): Promise<Data> {
        // const {token} = storeToRefs(userStore())
        return new Promise((resolve, reject) => {
            const newOptions: UseFetchOptions<T> = {
                baseURL: BASE_URL,
                method: method,
                ...options,
            };
            if (method === "GET" || method === "DELETE") {
                newOptions.params = data;
            }
            if (method === "POST" || method === "PUT" || method === "PATCH") {
                newOptions.body = data;
            }
            useFetch(url, {
                ...newOptions, onRequest({request, options}) {
                    // 设置请求头
                    options.headers = {...options.headers,
                        // authorization: token.value
                    };
                }, onResponse(context: FetchContext & {
                    response: FetchResponse<any>
                }): Promise<Data> | void {
                    const data = context.response._data
                    if (![200,201,206].includes(context.response.status)) {
                        reject({
                            ...data,
                            message: typeof data.message === 'object' ? Array.isArray(data.message.message)
                                ? data.message.message.join(',') : data.message.message : data.message
                        })
                    } else {
                        if (context.response.status===206) return resolve(data)
                        resolve({
                            data: data.data,
                            code: 200,
                            msg: data.msg
                        })
                    }
                }, onRequestError({request, options, error}) {
                    // 处理请求错误
                    console.warn(error)
                },
                onResponseError({request, response, options}) {
                    // 处理响应错误
                    console.warn(response)
                }
            })
        });
    }

    // 封装常用方法

    get<T = any>(url: string, params?: any, options?: UseFetchOptions<T>) {
        return this.request(url, "GET", params, options);
    }

    post<T = any>(url: string, data: any, options?: UseFetchOptions<T>) {
        return this.request(url, "POST", data, options);
    }

    put<T = any>(url: string, data: any, options?: UseFetchOptions<T>) {
        return this.request(url, "PUT", data, options);
    }

    patch<T = any>(url: string, data: any, options?: UseFetchOptions<T>) {
        return this.request(url, "PATCH", data, options);
    }

    deleteT<T = any>(url: string, params: any, options?: UseFetchOptions<T>) {
        return this.request(url, "DELETE", params, options);
    }
}

const http = new HttpRequest();

export default http;

