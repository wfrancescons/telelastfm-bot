import fs from 'node:fs/promises';
import { dirname, resolve } from 'path';
import { Canvas, FontLibrary, loadImage } from 'skia-canvas';
import { fileURLToPath } from 'url';
import { downloadImage } from '../utils/request.js';

// Obtém o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);

// Obtém o diretório do arquivo atual
const __dirname = dirname(__filename);

// Assumindo que o arquivo principal está na raiz do projeto,
// você pode definir a raiz como um nível acima do diretório atual
const rootDir = resolve(__dirname, '../..')

// Registrar fontes
FontLibrary.use('Noto Sans JP', ['./src/rendering/fonts/NotoSansJP/*.ttf'])
FontLibrary.use('Train One', ['./src/rendering/fonts/TrainOne/*.ttf'])

const CACHE_DIR = rootDir + '/cache'

// Função auxiliar para quebrar texto em várias linhas
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    let lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

function urlParser(url) {
    const array = url.split('/')

    const data = {
        size: array[5],
        file: array[6]
    }
    return data
}

/**
 * Verifica se um diretório contém um arquivo específico.
 * @param {string} dirPath - O caminho do diretório.
 * @param {string} fileName - O nome do arquivo a ser procurado.
 * @returns {Promise<boolean>} - Retorna uma promessa que resolve em verdadeiro se o arquivo existir, caso contrário, falso.
 */
async function hasFile(dirPath, fileName) {
    try {
        // Lê o conteúdo do diretório
        const files = await fs.readdir(dirPath)

        // Verifica se o arquivo está presente
        return files.includes(fileName)

    } catch (err) {
        console.error(`Erro ao ler o diretório: ${err.message}`)
        return false
    }
}

function loadImageWithTimeout(url, timeout) {
    return new Promise(async (resolve, reject) => {
        if (url.startsWith('http')) {
            const url_infos = urlParser(url)
            if (await hasFile(`${CACHE_DIR}`, `${url_infos.size}-${url_infos.file}`)) {
                url = `${CACHE_DIR}/${url_infos.size}-${url_infos.file}`
                console.log('URL GERADA PELO hasFile', url)
            } else {
                try {
                    await downloadImage(url)
                    url = `${CACHE_DIR}/${url_infos.size}-${url_infos.file}`
                } catch (error) {
                    console.error(error)
                }
            }
        }

        const timer = setTimeout(() => {
            reject(new Error('Tempo limite de carregamento excedido'))
        }, timeout)

        loadImage(url).then(image => {
            clearTimeout(timer)
            resolve(image)
        }).catch(error => {
            clearTimeout(timer)
            reject(error)
        })
    })
}

async function drawImage(ctx, element) {
    try {
        ctx.filter = element.filter || 'none'
        ctx.globalCompositeOperation = element.composite || 'source-over'
        const image = await loadImageWithTimeout(element.src, 2000)
        ctx.drawImage(image, element.x, element.y, element.width, element.height)
        ctx.globalCompositeOperation = 'source-over'
        ctx.filter = 'none'
    } catch (error) {
        console.error('Error on loadImage:', error)
        drawRect(ctx, {
            fillStyle: 'rgba(0, 0, 0, 0.5)',
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        })
    }
}

function drawRect(ctx, element) {
    if (element.fillStyle && element.fillStyle.type === 'linearGradient') {
        const gradient = ctx.createLinearGradient(element.fillStyle.x0, element.fillStyle.y0, element.fillStyle.x1, element.fillStyle.y1)
        for (const colorStop of element.fillStyle.colors) {
            gradient.addColorStop(colorStop.stop, colorStop.color)
        }
        ctx.fillStyle = gradient
    } else {
        ctx.fillStyle = element.fillStyle || 'black'
    }
    ctx.fillRect(element.x, element.y, element.width, element.height)
}

function drawText(ctx, element) {
    ctx.shadowColor = 'transparent'
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0

    ctx.font = element.font || '16px sans-serif'
    ctx.fillStyle = element.fillStyle || 'black'
    ctx.textAlign = element.align || 'left'  // Verifica o alinhamento do texto

    if (element.shadow) {
        ctx.shadowColor = element.shadow.color
        ctx.shadowOffsetX = element.shadow.offsetX
        ctx.shadowOffsetY = element.shadow.offsetY
        ctx.shadowBlur = element.shadow.blur
    }

    const lines = wrapText(ctx, element.text, element.maxWidth)
    lines.forEach((line, i) => {
        ctx.fillText(line, element.x, element.y - (lines.length - 1 - i) * element.lineHeight)
    })
}

async function renderCanvas(data) {
    const canvas = new Canvas(data.width, data.height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = data.background || 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const element of data.elements) {
        if (element.type === 'image') {
            await drawImage(ctx, element)
        }
        if (element.type === 'rectangle') {
            drawRect(ctx, element)
        }
        if (element.type === 'text') {
            drawText(ctx, element)
        }
        if (element.type === 'icon') {
            await drawImage(ctx, element)
        }
    }

    return canvas.toBuffer('jpeg', { quality: 0.95 })
}

export default renderCanvas