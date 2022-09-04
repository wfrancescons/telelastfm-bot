const nodeHtmlToImage = require('node-html-to-image')
const sharp = require('sharp')
const axios = require('axios')
const { join } = require('path')

const makeDataURI = (base64Image) => {
  return 'data:image/jpeg;base64,' + base64Image
}

let top = 390
const makeItem = async (data) => {
  const { rank, image, scrobbles } = data
  let { text } = data

  const { data: imageBuffer } = await axios.get(image, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(imageBuffer).toString('base64')

  if (text.length > 22) {
    text = text.substring(0, 22) + '...'
  }

  const html = `
    <tr>
        <td>
          <div style="width: 100%; top: ${top}px; position: absolute;">
            <div
              style="text-align: center; font-family: 'Open Sans'; font-size: 96px; font-weight: 700; text-transform: uppercase; color: #fff; float: left; padding-left: 100px;">
              #${rank}</div>
            <div><img src="${makeDataURI(buffer)}" alt=""
                style="width: 180px; height: 180px; float: left; padding-left: 50px;"></div>
            <div style="float: left; padding-left: 50px;">
              <div
                style="width: 500px; text-align: left; font-family: 'Open Sans'; font-size: 56px; font-weight: 700; text-transform: uppercase; color: #fff; hyphens: auto">
                ${text}</div>
              <div
                style="text-align: left; font-family: 'Open Sans'; font-size: 42px; font-weight: 500; text-transform: uppercase; color: #fff;">
                ${scrobbles} ${scrobbles == 1 ? 'scrobble' : 'scrobbles'}</div>
            </div>
          </div>
        </td>
    </tr>
    `
  top = top + 240
  return html
}

const makeBackground = (imageURL) => {

  return new Promise(async (resolve, reject) => {


    const { data } = await axios.get(imageURL, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(data, 'base64')

    const randomFilter = Math.ceil(Math.random() * (6))

    sharp(buffer)
      .resize({
        width: 1080,
        height: 1920,
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      })
      .greyscale()
      .blur(20)
      .modulate({ brightness: 0.4 })
      .composite([{ input: join(__dirname, `/filters/filter${randomFilter}.jpg`), left: 0, top: 0, blend: 'soft-light' }])
      .png()
      .toBuffer()
      .then(data => resolve(data))
      .catch(erro => reject(erro))
  })

}

const makeStory = async (lastfmData) => {
  const { period, mediaType } = lastfmData

  const itens = []
  for (const item of lastfmData.data) {
    const itemHtml = await makeItem(item)
    itens.push(itemHtml)
  }
  top = 390

  const background = await makeBackground(lastfmData.data[0].image)
  Buffer.from(imageBuffer).toString('base64')
  const html = `
  <head>
  <style>
    @font-face {
      font-family: 'Open Sans';
      src: url(data:font/truetype;charset=utf-8;base64,${Buffer.from(join(__dirname, `/fonts/700.ttf`)).toString('base64')}) format('truetype');
      font-weight: 700;
    }
    @font-face {
      font-family: 'Open Sans';
      src: url(data:font/truetype;charset=utf-8;base64,${Buffer.from(join(__dirname, `/fonts/500.ttf`)).toString('base64')}) format('truetype');
      font-weight: 500;
    }
    @font-face {
      font-family: 'Open Sans';
      src: url(data:font/truetype;charset=utf-8;base64,${Buffer.from(join(__dirname, `/fonts/400.ttf`)).toString('base64')}) format('truetype');
      font-weight: 400;
    }
  </style>
  </head>
  <body style="width: 1080px; height: 1920px; background-image: url(${makeDataURI(background.toString('base64'))}); background-repeat: no-repeat; background-size: auto; margin: 0; padding: 0">
    <div style="position: relative">
      <table style="width: 1080px; height: 1920px;">
        <tr>
          <td>
            <div
              style="text-align: center; font-family: 'Open Sans'; font-size: 64px; font-weight: 700; text-transform: uppercase; color: #fff; top: 150px; position: absolute; padding-left: 200px; padding-right: 200px;">
              Your Top ${mediaType} of ${period}
            </div>
          </td>
        </tr>

        ${itens.join('')}

        <tr>
          <td>
            <div
              style="text-align: center; font-family: 'Open Sans'; font-size: 28px; font-weight: 400; text-transform: uppercase; color: #fff; top: 1600px; position:absolute; left: 354px;">
              Made by @telelastfmbot
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>w
  `
  const story = await nodeHtmlToImage({ html, puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] } })

  return story
}

module.exports = makeStory