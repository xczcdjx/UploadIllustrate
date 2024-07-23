export const getStorage = (k: string):any => {
    return JSON.parse(localStorage.getItem(k) as string) || null
}
export const setStorage = (k: string, data: object) => {
    return localStorage.setItem(k, JSON.stringify(data))
}
export const removeStorage = (k: string):void => {
    localStorage.removeItem(k)
}
