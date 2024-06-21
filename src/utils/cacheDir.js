import fs from 'node:fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Obtém o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url)

// Obtém o diretório do arquivo atual
const __dirname = dirname(__filename)

// Assumindo que o arquivo principal está na raiz do projeto,
// você pode definir a raiz como um nível acima do diretório atual
const rootDir = resolve(__dirname, '../..')
console.log({ rootDir })

async function ensureDirectoryExists(dirPath) {
    try {
        // Verifica se o diretório existe
        await fs.access(dirPath)
        console.log('Directory exists:', dirPath)
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Diretório não existe, então cria o diretório
            await fs.mkdir(dirPath, { recursive: true })
            await fs.mkdir(dirPath + '/300x300', { recursive: true })
            await fs.mkdir(dirPath + '/500x500', { recursive: true })
            await fs.mkdir(dirPath + '/770x0', { recursive: true })
            console.log('Directory created:', dirPath)
        } else {
            // Lança o erro se for um erro diferente
            throw error
        }
    }
}

export default ensureDirectoryExists(rootDir + '/cache')