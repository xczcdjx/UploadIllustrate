import SparkMD5 from "spark-md5";
//@ts-ignore
import CryptoJS from "crypto-js";

async function calculateFileSparkHash(file: File, chunkSize: number): Promise<string> {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            fileReader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target) {
                    resolve(event.target.result as ArrayBuffer);
                }
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(chunk);
        });
        spark.append(arrayBuffer);  // 每次处理部分文件
    }

    return spark.end();  // 返回最终的哈希值
}
async function calculateBlobHash(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();
        const spark = new SparkMD5.ArrayBuffer();

        // 读取 Blob 数据
        fileReader.onload = (event: ProgressEvent<FileReader>) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            spark.append(arrayBuffer);  // 追加 ArrayBuffer 格式的数据
            const hash = spark.end();   // 获取最终的哈希值
            resolve(hash);              // 返回哈希值
        };

        fileReader.onerror = (error) => {
            reject(error);              // 处理读取错误
        };

        // 将 Blob 读取为 ArrayBuffer
        fileReader.readAsArrayBuffer(blob);
    });
}
async function calculateFileHash(file:File|Blob) {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const hash = CryptoJS.SHA256(wordArray);
    return hash.toString(CryptoJS.enc.Hex);
}

export {
    calculateFileHash,calculateFileSparkHash,calculateBlobHash
}
