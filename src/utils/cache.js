import FileCache from '../lib/fileCache.js'
import request from './request.js'

const cacheDir = '.cache'
const maxCacheSize = 1024 * 5 // 5gb

const cache = new FileCache(cacheDir, { maxCacheSize })

function lastfmUrlParser(url) {
    const array = url.split('/')

    const data = {
        size: array[5],
        file: array[6]
    }
    return data
}

async function downloadImage(imageUrl) {
    try {
        //console.log('Imagem baixada ⬇️:', imageUrl)
        const response = await request({ url: imageUrl, timeout: 5000 })

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        return buffer
    } catch (error) {
        console.error('Error downloading image:', error)
        throw error
    }
}

async function getOrSaveImageInCache(url) {
    if (url.startsWith('http')) {
        try {
            const url_infos = lastfmUrlParser(url)
            let local_file = await cache.get(`${url_infos.size}-${url_infos.file}`)

            if (local_file) {
                //console.log('Imagem em cache 🗃️:', local_file)
                return local_file
            }

            const image_buffer = await downloadImage(url)
            local_file = await cache.save(`${url_infos.size}-${url_infos.file}`, image_buffer)

            return local_file

        } catch (error) {
            console.error(error)
            return url
        }
    }
    return url
}

function getCacheSize() {
    const size = cache.getCacheSize()

    const gigabytes = size / (1024 ** 3)

    return gigabytes.toFixed(2)
}

export { getCacheSize, getOrSaveImageInCache }

