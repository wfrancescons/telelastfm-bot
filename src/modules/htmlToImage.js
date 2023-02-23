import puppeteer from 'puppeteer'

const ssOptions = {
    type: 'jpeg',
    quality: 100,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
}

let browser
const pages = []

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

const closeBrowser = async () => {
    try {
        await browser.close()
        browser = null
        console.log('PUPPETEER: Browser closed!')
    } catch (error) {
        console.error(error)
    }
}

const verifyIfBrowserIsInactiveAndClose = () => {
    if (!pages.length && browser) {
        closeBrowser()
        console.log('PUPPETEER: Browser closed due to inactivity!')
    }
}

const isBrowserInactive = () => {
    verifyIfBrowserIsInactiveAndClose()
    setInterval(() => {
        verifyIfBrowserIsInactiveAndClose()
    }, 60 * 60 * 1000) // every 1 hour
}

isBrowserInactive()

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

        pages.push(1)

        if (!browser) await launchBrowser()

        const page = await browser.newPage()

        try {
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

            resolve(image)

        } catch (error) {

            reject(error)

        } finally {

            await page.close()
            pages.pop()

        }
    })

}

export { htmlToImage, launchBrowser }

