import fs from 'node:fs/promises'
import path from 'node:path'

class FileCache {
    constructor(cacheDir, { maxCacheSize = 0, fileTTL = 0 }) {
        if (!cacheDir) throw new Error('cacheDir can\'t be empty')
        if (typeof maxCacheSize !== 'number' || typeof fileTTL !== 'number') throw new Error('maxCacheSize or fileTTL must be a number')

        this.cacheDir = cacheDir
        this.maxCacheSize = maxCacheSize * 1024 * 1024 // in mb, 0 means unlimited
        this.fileTTL = fileTTL * 60 * 1000 // in minutes, 0 means unlimited
        this.cacheFiles = new Map() // Store file metadata for quick access

        this.#initializeCache()
    }

    async #initializeCache() {
        // Ensure cache directory exists
        try {
            await fs.mkdir(this.cacheDir, { recursive: true })
        } catch (error) {
            console.error('Error ensuring cache directory exists:', error)
        }

        // Load existing cache files metadata
        await this.#loadCacheMetadata()
    }

    async #loadCacheMetadata() {
        try {
            const files = await fs.readdir(this.cacheDir)
            for (const file of files) {
                const filePath = path.join(this.cacheDir, file)
                const stats = await fs.stat(filePath)
                this.cacheFiles.set(file, {
                    path: filePath,
                    lastAccess: stats.atimeMs,
                    size: stats.size,
                    creationTime: stats.ctimeMs
                })
            }
        } catch (error) {
            console.error('Error loading cache metadata:', error)
        }
    }

    async #updateAccessTime(file) {
        const metadata = this.cacheFiles.get(file)
        if (metadata) {
            metadata.lastAccess = Date.now()
            try {
                await fs.utimes(metadata.path, new Date(), new Date(metadata.lastAccess))
            } catch (error) {
                console.error('Error updating access time:', error)
            }
        }
    }

    async #cleanUpCache() {
        const now = Date.now()

        // Remove expired files if TTL is set
        if (this.fileTTL > 0) {
            for (const [file, metadata] of this.cacheFiles.entries()) {
                if (now - metadata.creationTime > this.fileTTL) {
                    await this.delete(file)
                }
            }
        }

        // Check total cache size if maxCacheSize is set
        if (this.maxCacheSize > 0) {
            let totalSize = [...this.cacheFiles.values()].reduce((acc, metadata) => acc + metadata.size, 0)
            if (totalSize > this.maxCacheSize) {
                // Sort files by last access time (least recently used first)
                const sortedFiles = [...this.cacheFiles.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess)

                // Delete least recently used files until we are within size limit
                for (const [file, metadata] of sortedFiles) {
                    await this.delete(file)
                    totalSize -= metadata.size
                    if (totalSize <= this.maxCacheSize) break
                }
            }
        }
    }

    async findImage(filename) {
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

        try {
            const files = await fs.readdir(this.cacheDir)

            for (const file of files) {
                const ext = path.extname(file)
                const nameWithoutExt = path.basename(file, ext)

                if (nameWithoutExt === filename && validExtensions.includes(ext)) {
                    return path.join(this.cacheDir, file)
                }
            }
        } catch (error) {
            console.error('Error reading cache directory:', error)
        }

        return null
    }

    async isFileOlderThan(fileName, days) {
        const baseFileName = path.basename(fileName)
        const metadata = this.cacheFiles.get(baseFileName)

        if (!metadata) return true // Retorna true se o arquivo não for encontrado

        const fileAgeInDays = (Date.now() - metadata.creationTime) / (1000 * 60 * 60 * 24)
        if (fileAgeInDays > days) {
            console.log(`File ${baseFileName} is older than ${days} days. Deleting...`)
            await this.delete(baseFileName) // Deleta o arquivo
            return true // Indica que o arquivo foi deletado por ser muito antigo
        }

        return false // Arquivo ainda válido
    }

    async get(fileName) {
        const metadata = this.cacheFiles.get(fileName)
        if (metadata) {
            await this.#updateAccessTime(fileName)
            return metadata.path
        }
        return null
    }

    async save(fileName, data) {
        const filePath = path.join(this.cacheDir, fileName)
        try {
            await fs.writeFile(filePath, data)
            const stats = await fs.stat(filePath)
            this.cacheFiles.set(fileName, {
                path: filePath,
                lastAccess: stats.atimeMs,
                size: stats.size,
                creationTime: stats.ctimeMs
            })
            await this.#cleanUpCache()
            return this.get(fileName)
        } catch (error) {
            console.error('Error saving file:', error)
        }
    }

    async delete(fileName) {
        const metadata = this.cacheFiles.get(fileName)
        if (metadata) {
            try {
                await fs.unlink(metadata.path)
                this.cacheFiles.delete(fileName)
            } catch (error) {
                console.error('Error deleting file:', error)
            }
        }
    }

    list() {
        try {
            return [...this.cacheFiles.keys()]
        } catch (error) {
            console.error('Error listing cache files:', error)
            return []
        }
    }

    getCacheSize() {
        return [...this.cacheFiles.values()].reduce((acc, metadata) => acc + metadata.size, 0)
    }

    getCacheFileCount() {
        return this.cacheFiles.size
    }

    getCacheDir() {
        return this.cacheDir
    }
}

export default FileCache