import FileCache from '../lib/fileCache.js'
import request from './request.js'

const cacheDir = '.cache'
const maxCacheSize = 1024 * 5 // 5gb

const cache = new FileCache(cacheDir, { maxCacheSize })

function lastfmUrlParser(url) {
    const array = url.split('/')
    const fileParts = array[6].split('.')

    const data = {
        size: array[5],
        file: fileParts[0],
        extension: fileParts[1]
    }

    return data
}

function generateBaseFilename(media_type, { track, album, artist }) {
    const sanitize = str => str.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    if (media_type === 'tracks') {
        if (track && album) {
            return `${sanitize(album)}_${sanitize(artist)}`
        }
        if (track) {
            return `${sanitize(track)}_${album ? sanitize(album) + '_' : ''}${sanitize(artist)}`
        }
        return null
    }

    if (media_type === 'albums') {
        return album ? `${sanitize(album)}_${sanitize(artist)}` : null
    }

    if (media_type === 'artists') {
        return artist ? sanitize(artist) : null
    }

    return null
}

function generateFilename(media_type, url, mediaDetails) {
    const url_infos = lastfmUrlParser(url)
    const baseFilename = generateBaseFilename(media_type, mediaDetails)

    return baseFilename
        ? `${baseFilename}.${url_infos.extension}`
        : `${url_infos.file}.${url_infos.extension}`
}

async function downloadImageToBuffer(image_url) {
    try {
        console.log('-> ⬇️ Imagem baixada:', image_url)
        const response = await request({ url: image_url, timeout: 5000 })

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

function getCacheSize() {
    const size = cache.getCacheSize()

    const gigabytes = size / (1024 ** 3)

    return gigabytes.toFixed(2)
}

async function saveImageToCache(media_type, url, lastfm_info) {
    try {

        const filename = generateFilename(media_type, url, lastfm_info)

        // Baixar e salvar imagem
        const image_buffer = await downloadImageToBuffer(url)
        const cached_image = await cache.save(filename, image_buffer)

        return cached_image

    } catch (error) {
        console.error(error)
        return url
    }
}

async function getFile(filename) {
    const local_file = await cache.get(filename)
    return local_file

}

async function findCachedImage(media_type, { track, album, artist }) {

    try {
        const base_filename = generateBaseFilename(media_type, { track, album, artist })
        if (!base_filename) return null

        const cached_file = await cache.findImage(base_filename)
        //if (cached_file) console.log('-> 🗃️ Imagem em cache:', cached_file)
        return cached_file
    } catch (error) {
        throw error
    }
}

export { findCachedImage, generateFilename, getCacheSize, getFile, lastfmUrlParser, saveImageToCache }

