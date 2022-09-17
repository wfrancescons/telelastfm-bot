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
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: {
                width: 1080,
                height: 1920,
                deviceScaleFactor: 2
            }
        })
        console.log('Browser launched!')

    } catch (error) {

        console.error(error)

    }

}

const htmlToImage = async (html, path = '') => {

    try {

        if (!browser) await launchBrowser()

        const page = await browser.newPage()
        await page.setViewport({
            width: 1920,
            height: 1080,
        })
        await page.setContent(html, { waitUntil: "networkidle0" })

        const image = await page.screenshot({ path: path, ...ssOptions })

        await page.close()

        return image

    } catch (error) {

        console.error(error)

    }

}

export { htmlToImage, launchBrowser }