import puppeteer from "puppeteer"

const ssOptions = {
    type: 'jpeg',
    quality: 100,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
}

let browser

const launchBrowser = async () => {
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        console.log('Browser launched!')

    } catch (error) {
        console.error(error)

    }
}

const htmlToImage = (html, path = '') => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!browser) await launchBrowser()

            const page = await browser.newPage()
            await page.setDefaultNavigationTimeout(10000)
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 2
            })
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            })

            const image = await page.screenshot({ path: path, ...ssOptions })

            await page.close()

            resolve(image)

        } catch (error) {
            console.error(error)
            reject(error)
        }
    })

}

export { htmlToImage, launchBrowser }