import puppeteer from 'puppeteer'

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
        console.log('PUPPETEER: Browser launched!')

    } catch (error) {
        console.error(error)

    }
}

const htmlToImage = (html, ssOptions) => {

    if (!ssOptions) {

        ssOptions = {
            type: 'jpeg',
            quality: 100,
            fullPage: false,
            clip: { x: 0, y: 0, width: 1080, height: 1920 },
            path: ''
        }

    }

    return new Promise(async (resolve, reject) => {
        try {
            if (!browser) await launchBrowser()

            const page = await browser.newPage()
            await page.setDefaultNavigationTimeout(10000)
            await page.setViewport({
                width: ssOptions.clip.width,
                height: ssOptions.clip.height,
                deviceScaleFactor: 2
            })
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            })

            const image = await page.screenshot({ ...ssOptions })

            await page.close()

            resolve(image)

        } catch (error) {
            reject(error)
        }
    })

}

export { htmlToImage, launchBrowser }

