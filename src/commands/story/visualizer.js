import { getAlbumListeningNow, getArtistListeningNow, getTrackListeningNow } from '../../controller/lastfm.js'
import { htmlToImage } from '../../scripts/htmlToImage.js'
import generateBackground from './generateBackground.js'

const getLastfmData = (lastfm_user, media) => {
    return new Promise((resolve, reject) => {
        if (media === 'tracks') {
            getTrackListeningNow(lastfm_user)
                .then(data => {
                    const { track, album, artist, image, userplaycount } = data
                    resolve({ image, userplaycount, text: [track, album, artist] })
                })
                .catch(error => reject(error))
        }

        if (media === 'albums') {
            getAlbumListeningNow(lastfm_user)
                .then(data => {
                    const { album, artist, image, userplaycount } = data
                    resolve({ image, userplaycount, text: [album, artist] })
                })
                .catch(error => reject(error))
        }

        if (media === 'artists') {
            getArtistListeningNow(lastfm_user)
                .then(data => {
                    const { artist, image, userplaycount } = data
                    resolve({ image, userplaycount, text: [artist] })
                })
                .catch(error => reject(error))
        }

    })
}

const generateTagH = (array) => {
    let infos = ''

    for (let i = 0; i < array.length; i++) {
        infos = `${infos} <h${i + 3}>${array[i]}</h${i + 3}>`
    }

    return infos
}

const generateImage = async (lastfmData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { image, userplaycount, text } = lastfmData

            const scrobbles = Number(userplaycount) + 1

            const background = await generateBackground(image, 25)

            const html = `<head>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700;800&&family=Train+One&display=swap" rel="stylesheet">
            <style>
              * {margin: 0; padding: 0}
              body {position: relative;width: 1080px;height: 1920px;font-family: 'Open Sans';color: #fff;text-align: center;}
              img {width: 600px;height: 600px;object-fit: cover;object-position: 20% 10%;border-radius: 25px}
              h1 {text-align: center;font-family: 'Train One';font-size: 162px;padding: 250px 0px 0px 0px;font-weight: normal;}
              h2 {text-align: center;font-weight: 700;font-size: 36px;text-transform: uppercase;padding: 0px 0px 100px 0px}
              h3 {text-align: center;font-weight: 800;font-size: 56px;padding: 50px 100px 0px 100px}
              h4 {text-align: center;font-weight: 700;font-size: 48px;padding: 10px 100px 0px 100px}
              h5 {text-align: center;font-weight: 500;font-size: 36px;padding: 10px 100px 0px 100px}
              #footer {position: absolute;text-transform: uppercase;bottom: 0;left: 0;right: 0;top: 1750px;margin-left: auto;margin-right: auto;font-size: 25px;font-weight: 400}
            </style>
          </head>
          <body>
            <div style="background-image: url(${'data:image/jpeg;base64,' + background.toString('base64')}); background-repeat: no-repeat; width: 1080px; height: 1920px;">
              <h1>${scrobbles.toLocaleString('pt-BR')}</h1>
              <h2>${scrobbles != 1 ? 'scrobbles' : 'scrobble'}</h2>
          
              <div style="width: 100%;">
                <div><img src="${image}" alt=""></div>
                ${generateTagH(text)}
              </div>
          
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

const generateVisualizer = (ctx, lastfm_user, first_name, media_type) => {
    return new Promise(async (resolve, reject) => {
        try {
            const lastfmData = await getLastfmData(lastfm_user, media_type)

            const response = await ctx.reply('🖼️ Generating your image...')
            const { message_id } = response

            await ctx.replyWithChatAction('upload_photo')

            generateImage(lastfmData)
                .then((imageBuffer) => {
                    ctx.replyWithPhoto(
                        { source: imageBuffer },
                        { caption: `${first_name}, your latest scrobble` }
                    ).finally(_ => {
                        ctx.deleteMessage(message_id)
                        resolve()
                    })
                })
                .catch(error => reject(error))
        } catch (error) {
            reject(error)
        }
    })
}

export default generateVisualizer