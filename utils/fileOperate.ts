// 文件处理函数
export function filesToBlod(file) {
    // 创建文件对象
    let reader = new FileReader()
    // 文件转为文件流
    reader.readAsDataURL(file)
    // 文件读取完成，根据类型不同显示不同的图标
    reader.onload = e => {
        // 把文件流放入文件流数组中
        fileBlodArr.push(e.target.result)
        // 创建单个文件预览
        let fileDiv = document.createElement('div')
        // 删除按钮
        let removeDiv = document.createElement('div')
        removeDiv.id = 'file' + '-' + fileBlodArr.length
        removeDiv.innerHTML = '×'
        // 文件名
        let fileName = document.createElement('p')
        fileName.innerHTML = file.name
        fileName.title = file.name
        // 缩略图-图片直接展示,其他文件根据文件类型展示不同的缩略图
        let img = document.createElement('img')
        if (/image/.test(file.type)) {
            img.src = e.target.result
        } else {
            switch(file.type) {
                case 'application/msword' :
                    img.src = './static/image/word.png'
                    break
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                    img.src = './static/image/word.png'
                    break
                case 'application/vnd.ms-powerpoint':
                    img.src = './static/image/ppt.png'
                    break
                case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                    img.src = './static/image/ppt.png'
                    break
                case 'application/vnd.ms-excel':
                    img.src = './static/image/excel.png'
                    break
                case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                    img.src = './static/image/excel.png'
                    break
                case 'application/pdf':
                    img.src = './static/image/pdf.png'
                    break
                case 'text/plain':
                    img.src = './static/image/txt.png'
                    break
                case 'text/javascript':
                    img.src = './static/image/js.png'
                    break
                case 'text/html':
                    img.src = './static/image/html.png'
                    break
                case 'text/css':
                    img.src = './static/image/css.png'
                    break
                default:
                    img.src = './static/image/other.png'
            }
        }
        // 组合单个文件并放入dom中
        fileDiv.appendChild(img)
        fileDiv.appendChild(removeDiv)
        fileDiv.appendChild(fileName)
        droptarget.appendChild(fileDiv)
    }
    // 文件读取失败的提示
    reader.onerror = () => {
        switch(reader.error.code) {
            case '1':
                alert('未找到文件')
                break
            case '2':
                alert('安全错误')
                break
            case '3':
                alert('读取被中断')
                break
            case '4':
                alert('文件不可读')
                break
            case '5':
                alert('编码错误')
                break
            default:
                alert('文件读取失败')
        }
    }
    // 文件读取的进度，因为是本地读取所以进度很快，基本看不出来，所以选择打印查看
    reader.onprogress = event => {
        console.log(`${event.loaded}/${event.total}`)
    }
}

