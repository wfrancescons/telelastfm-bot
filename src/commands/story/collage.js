import { htmlToImage } from '../../scripts/htmlToImage.js'
import sharp from 'sharp'
import axios from 'axios'
import generateFilter from './filters.js'

const { get } = axios

const makeBackground = (imageURL) => {

  return new Promise(async (resolve, reject) => {

    const { data } = await get(imageURL, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(data)

    const filter = await generateFilter()

    /*     const { dominant } = await sharp(buffer).stats()
        console.log("sharp", dominant)
    
        Vibrant.from(buffer).getPalette()
          .then((palette) => console.log('vibrant', palette))
     */
    sharp(buffer)
      .resize({
        width: 1080,
        height: 1920,
        fit: sharp.cover,
        position: sharp.strategy.entropy
      })
      .greyscale()
      .blur(15)
      .modulate({ brightness: 0.2 })
      .composite([{ input: filter, left: 0, top: 0, blend: 'soft-light' }])
      .jpeg()
      .toBuffer()
      .then(data => resolve(data))
      .catch(erro => reject(erro))
  })

}

const makeItems = (lastfmData) => {

  const limitText = (text) => {

    text.trim()
    if (text.length > 20) {
      text = text.substring(0, 18) + '...'
    }
    return text

  }

  const makeP = (textArray) => {
    const formatedArray = textArray.map(t => `<p>${limitText(t)}</p>`)
    return formatedArray
  }

  const makeOneItem = (item) => {
    const { rank, image, text, scrobbles } = item

    const html = `
      <div class="container" style="width: 100%;">
        <span class="rank align"><span class="hashtag">#</span>${rank}</span>
        <div><img src="${image}" alt=""></div>
        <div class="align" style="float: left; padding-left: 50px;">
          ${makeP(text).join('')}
          <p>${Number(scrobbles).toLocaleString('pt-BR')} ${scrobbles == 1 ? 'scrobble' : 'scrobbles'}</p>
        </div>
      </div>`

    return html

  }

  const allItemsHtml = lastfmData.data.map(item => makeOneItem(item))

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
          <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Train+One&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0 }
            body {position: relative;width: 1080px;height: 1920px;font-family: 'Open Sans';text-transform: uppercase;color: #fff;text-align: center;}
            img {width: 180px;height: 180px;float: left;margin-left: 50px;object-fit: cover;object-position: 20% 10%; border-radius: 15px}
            h1 {text-align: center;font-size: 64px;font-weight: 800;padding: 150px 200px 0px 200px}
            p {text-align: left;text-transform: uppercase;justify-content: center;}
            p:nth-child(1) {font-size: 40px;font-weight: 700;}
            p:nth-child(2) {font-size: 35px;font-weight: 500;}
            p:nth-child(3) {font-size: 35px;font-weight: 500;}
            p:nth-child(4) {font-size: 30px;font-weight: 500;}
            .container {display: flex;padding: 80px 150px 0px 100px}
            .rank {font-size: 128px;font-family: 'Train One', cursive;}
            .hashtag {font-size: 64px;font-family: 'Train One', cursive;}
            .align {margin-top: auto;margin-bottom: auto;}
            #footer {position: absolute;bottom: 0;left: 0;right: 0;top: 1750px;margin-left: auto;margin-right: auto;font-size: 25px;font-weight: 400}
          </style>
        </head>
        <body>
          <div style=" background-image: url(${'data:image/jpeg;base64,' + background.toString('base64')}); background-repeat: no-repeat; width: 1080px; height: 1920px;">
            <h1 style="">Your Top ${mediaType} of ${period}</h1>
        
                ${itens.join('')}
        
            <div id="footer">Made by @telelastfmbot</div>
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