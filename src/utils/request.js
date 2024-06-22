import fs from 'node:fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Obtém o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);

// Obtém o diretório do arquivo atual
const __dirname = dirname(__filename);

// Assumindo que o arquivo principal está na raiz do projeto,
// você pode definir a raiz como um nível acima do diretório atual
const rootDir = resolve(__dirname, '../..')

const REQUEST_TIMEOUT = 3000
const CACHE_DIR = rootDir + '/cache'

function urlParser(url) {
    const array = url.split('/')

    const data = {
        size: array[5],
        file: array[6]
    }
    return data
}

async function request({ url, options = {}, retries = 3, timeout = REQUEST_TIMEOUT }) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)

            const response = await fetch(url, { ...options, signal: controller.signal })
            clearTimeout(timeoutId)

            if (response.status >= 500 && response.status < 600) {
                throw new Error(`Server Error: ${response.status}`)
            }

            return response
        } catch (error) {
            if (attempt === retries) {
                throw error
            }
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }
}

async function downloadImage(imageUrl) {
    console.log('Função downloadImage chamada', { imageUrl })
    return new Promise(async (resolve, reject) => {
        try {
            const response = await request({ url: imageUrl, timeout: 10000 })

            const url_infos = urlParser(imageUrl)

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const outputFilePath = `${CACHE_DIR}/${url_infos.size}-${url_infos.file}`

            fs.writeFileSync(outputFilePath, buffer)

            resolve(outputFilePath)

            console.log('Image downloaded successfully:', outputFilePath)
        } catch (error) {
            reject(error)
            console.error('Error downloading image:', error)
        }
    })
}

export { downloadImage };

export default request