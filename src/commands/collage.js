import { getUserTopAlbums } from "../controller/lastfm.js"
import { getLastfmUser } from "../database/user.js"
import errorHandler from '../handlers/errorHandler.js'
import checkSendMediaPermission from '../helpers/checkSendMediaPermission.js'
import { htmlToImage } from "../scripts/htmlToImage.js"
import { getRandomColor } from "./story/generateBackground.js"

const hexToRgb = (hex) => {
    const rgbToParse = hex.match(/[^#]{1,2}/g);
    const rgb = [
        parseInt(rgbToParse[0], 16),
        parseInt(rgbToParse[1], 16),
        parseInt(rgbToParse[2], 16)
    ]
    return rgb
}

const generateHtml = (res, color) => {
    return new Promise(async (resolve, reject) => {
        const tds = res.map(item => {
            const { image, text, scrobbles } = item

            const td = `<td style="height: 100px; width: 100px;">
            <div style="position: relative; width: 100%; height: 100%;">
            <div style="background: linear-gradient(rgba(${color.join(',')}, 0), rgba(${color.join(',')}, 0.9));width: 100%; height: 50%;position: absolute; bottom: 0;"></div>
            <div style="text-align:left; position: absolute; bottom: 0; padding: 10px;">
                <h1>${text[0]}</h1>
                <h2>${Number(scrobbles).toLocaleString('pt-BR')} ${scrobbles == 1 ? 'scrobble' : 'scrobbles'}</h2>
            </div>
                <img style="width: 100%; height: 100%;" src="${image}" alt="">
            </div>
            </td>`

            return td
        })

        const trs = tds.reduce((acc, val, index) => {
            if (index % 4 === 0) {
                acc.push([val]);
            } else {
                acc[acc.length - 1].push(val);
            }
            return acc;
        }, [])

        const table = trs.map(item => {
            const res = '<tr>' + item.join('') + '</tr>'
            return res
        })

        const html = `</html>
    
        <!DOCTYPE html>
        <html lang="pt-br">
        
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
            <title>teste</title>
            <style>
                * {
                    margin: 0;
                    padding: 0
                }
        
                body {
                    position: relative;
                    width: 1080px;
                    height: 1080px;
                    font-family: 'Open Sans';
                    color: #fff;
                    text-align: center;
                }
        
                .main h1 {
                    text-align: left;
                    font-weight: 800;
                    font-size: 14px;
                }
        
                .main h2 {
                    text-align: left;
                    font-weight: 500;
                    font-size: 12px;
                }
        
                h1 {
                    text-align: left;
                    font-weight: 800;
                    font-size: 21px;
                }
        
                h2 {
                    text-align: left;
                    font-weight: 500;
                    font-size: 16px;
                }
            </style>
        </head>
        
        <body>
            <table border="0" style="border-collapse: collapse; width: 100%; height: 100%;">
                ${table.join('')}
            </table>
        
        </body>
        
        </html>`

        resolve(html)

    })
}

const generateImage = async (html, ssOptions) => {
    return new Promise(async (resolve, reject) => {
        try {

            const story = await htmlToImage(html, ssOptions)
            resolve(story)

        } catch (error) {
            reject(error)

        }
    })
}

const generateVisualizer = (ctx, lastfm_user, first_name) => {
    return new Promise(async (resolve, reject) => {
        try {

            const response = await ctx.reply('🖼️ Generating your collage...')
            const { message_id } = response

            await ctx.replyWithChatAction('upload_photo')

            const res = await getUserTopAlbums(lastfm_user, '7day', 20)

            const color = hexToRgb(getRandomColor())

            const html = await generateHtml(res, color)

            const ssOptions = {
                type: 'jpeg',
                quality: 100,
                fullPage: false,
                clip: { x: 0, y: 0, width: 1080, height: 1080 },
                path: ''
            }

            generateImage(html, ssOptions)
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

const collage = async (ctx) => {

    const { first_name, id: telegram_id } = ctx.update.message.from
    const text = ctx.update.message.text.trim().toLowerCase()
    let [command, media_type, period] = text.split(' ')

    try {
        await ctx.replyWithChatAction('typing')

        const canSendPhoto = await checkSendMediaPermission(ctx)
        if (!canSendPhoto) return errorHandler(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

        const lastfm_user = await getLastfmUser(telegram_id)

        generateVisualizer(ctx, lastfm_user, first_name)
            .catch(error => {
                errorHandler(ctx, error)
            })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default collage
