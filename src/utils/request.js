const REQUEST_TIMEOUT = 3000

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

export default request