import SparkMD5 from 'spark-md5';
import CryptoJS from 'crypto-js';

export type HashAlgorithm = 'sha256' | 'md5';

// 分块增量计算完整文件摘要，算法与文件大小、上传分片大小无关。
export async function calculateHash(file: Blob, algorithm: HashAlgorithm = 'sha256', chunkSize = 2 * 1024 * 1024): Promise<string> {
    if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) throw new Error('无效的 hash 分块大小');
    if (algorithm !== 'sha256' && algorithm !== 'md5') throw new Error('不支持的 hash 算法');
    const md5 = algorithm === 'md5' ? new SparkMD5.ArrayBuffer() : null;
    const sha256 = algorithm === 'sha256' ? CryptoJS.algo.SHA256.create() : null;
    for (let offset = 0; offset < file.size; offset += chunkSize) {
        const bytes = await file.slice(offset, offset + chunkSize).arrayBuffer();
        if (md5) md5.append(bytes);
        else sha256!.update(CryptoJS.lib.WordArray.create(bytes));
    }
    return md5 ? md5.end() : sha256!.finalize().toString(CryptoJS.enc.Hex);
}
export const calculateFileHash = (file: Blob) => calculateHash(file, 'sha256');
export const calculateBlobHash = (file: Blob) => calculateHash(file, 'md5');
export const calculateFileSparkHash = (file: Blob, chunkSize: number) => calculateHash(file, 'md5', chunkSize);
