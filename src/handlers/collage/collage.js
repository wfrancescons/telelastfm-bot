import { htmlToImage } from './htmlToImage.js'
import sharp from 'sharp'
import axios from 'axios'
import generateFilter from './filters.js'

const { get } = axios

const makeBackground = (imageURL) => {

  return new Promise(async (resolve, reject) => {

    const { data } = await get(imageURL, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(data)

    const filter = await generateFilter()

    sharp(buffer)
      .resize({
        width: 1080,
        height: 1920,
        fit: sharp.cover,
        position: sharp.strategy.entropy
      })
      .greyscale()
      .blur(20)
      .modulate({ brightness: 0.4 })
      .composite([{ input: filter, left: 0, top: 0, blend: 'soft-light' }])
      .jpeg()
      .toBuffer()
      .then(data => resolve(data))
      .catch(erro => reject(erro))
  })

}

const makeItems = (lastfmData) => {

  let top = 390
  const makeItem = (item) => {
    const { rank, image, scrobbles } = item
    let { text } = item

    text = text.trim()
    if (text.length > 25) {
      text = text.substring(0, 25) + '...'
    }

    const html = `
              <tr>
                  <td>
                    <div style="width: 100%; top: ${top}px; position: absolute;">
                      <div
                        style="text-align: center; font-family: 'Open Sans'; font-size: 96px; font-weight: 700; text-transform: uppercase; color: #fff; float: left; padding-left: 100px; padding-top: 20px;">
                        #${rank}</div>
                      <div><img src="${image}" alt=""
                          style="width: 180px; height: 180px; float: left; padding-left: 50px;"></div>
                      <div style="float: left; padding-left: 50px;">
                        <div
                          style="width: 500px; text-align: left; font-family: 'Open Sans'; font-size: 48px; font-weight: 700; text-transform: uppercase; color: #fff; justify-content: center">
                          ${text}</div>
                        <div
                          style="text-align: left; font-family: 'Open Sans'; font-size: 42px; font-weight: 500; text-transform: uppercase; color: #fff;">
                          ${Number(scrobbles).toLocaleString('pt-BR')} ${scrobbles == 1 ? 'scrobble' : 'scrobbles'}</div>
                      </div>
                    </div>
                  </td>
              </tr>
              `
    top = top + 240
    return html
  }

  const allItemsHtml = lastfmData.data.map(item => makeItem(item))

  top = 390

  return allItemsHtml

}

const makeStory = async (lastfmData) => {

  return new Promise(async (resolve, reject) => {

    try {

      const { period, mediaType } = lastfmData

      const background = await makeBackground(lastfmData.data[0].image)
      const itens = makeItems(lastfmData)

      const html = `<head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700&display=swap" rel="stylesheet">
      </head>
      <body style="width: 1080px; height: 1920px; background-image: url(${'data:image/jpeg;base64,' + background.toString('base64')}); background-repeat: no-repeat; background-size: auto; margin: 0; padding: 0">
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
      </body>`

      const story = await htmlToImage(html)

      resolve(story)

    } catch (error) {

      reject(error)

    }

  })

}

export default makeStory