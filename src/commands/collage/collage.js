import { getUserTopAlbums } from "../../controller/lastfm.js"
import { getLastfmUser } from "../../database/user.js"
import errorHandler from '../../handlers/errorHandler.js'
import checkSendMediaPermission from '../../helpers/checkSendMediaPermission.js'
import { htmlToImage } from "../../scripts/htmlToImage.js"
import { getRandomColor } from "../story/generateBackground.js"
import { acceptedPeriods, mediaMap, periodInTextMap, periodMap } from "./collageMaps.js"

const hexToRgb = (hex) => {
    const rgbToParse = hex.match(/[^#]{1,2}/g);
    const rgb = [
        parseInt(rgbToParse[0], 16),
        parseInt(rgbToParse[1], 16),
        parseInt(rgbToParse[2], 16)
    ]
    return rgb
}

const generateHtml = (res, color, infos) => {

    const {
        COLUMNS,
        ROWS,
        MAX_SUBARRAY_SIZE,
        MIN_CELL_SIZE,
        BODY_WIDTH,
        BODY_HEIGHT
    } = infos

    const FONT_BASE_SIZE = Math.round(MIN_CELL_SIZE * 0.07)
    const FONT_SIZE_MULTIPLICATOR = Math.ceil(FONT_BASE_SIZE * 0.1)
    const PADDING_BASE_SIZE = Math.round(MIN_CELL_SIZE * 0.05)

    const hasMain = (COLUMNS >= 3 && ROWS >= 2) || (COLUMNS >= 2 && ROWS >= 3)

    let main
    if (hasMain) {

        const firtItem = res.shift()

        main = `<td rowspan="2" colspan="2">
            <div style="position: relative; width: 100%; height: 100%;">
            <div class="gradient"></div>
            <div class="text main">
                <h1>${firtItem.text[0]}</h1>
                ${firtItem.text[1] ? `<h2>${firtItem.text[1]}</h2>` : ''}
                <h3>${Number(firtItem.scrobbles).toLocaleString('pt-BR')} ${firtItem.scrobbles == 1 ? 'scrobble' : 'scrobbles'}</h3>
            </div>
                <img style="width: 100%; height: 100%;" src="${firtItem.image}" alt="">
            </div>
            </td>`
    }

    const tds = res.map(item => {

        const { image, text, scrobbles } = item

        const td = `<td>
            <div style="position: relative; width: 100%; height: 100%;">
            <div class="gradient"></div>
            <div class="text">
                <h1>${text[0]}</h1>
                ${text[1] ? `<h2>${text[1]}</h2>` : ''}
                <h3>${Number(scrobbles).toLocaleString('pt-BR')} ${scrobbles == 1 ? 'scrobble' : 'scrobbles'}</h3>
            </div>
                <img src="${image}" alt="">
            </div>
            </td>`

        return td
    })

    let firtRow
    let secondRow
    if (hasMain) {
        firtRow = tds.splice(0, COLUMNS - 2)
        secondRow = tds.splice(0, COLUMNS - 2)
    }

    const trs = []

    for (let i = 0; i < tds.length; i += MAX_SUBARRAY_SIZE) {
        trs.push(tds.slice(i, i + MAX_SUBARRAY_SIZE))
    }

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
                    padding: 0;
                }
        
                body {
                    position: relative;
                    width: ${BODY_WIDTH}px;
                    height: ${BODY_HEIGHT}px;
                    font-family: 'Open Sans';
                    color: #fff;
                    text-align:left;
                }

                table {
                    border-collapse: collapse;
                }

                td {
                    height: ${MIN_CELL_SIZE}px;
                    width: ${MIN_CELL_SIZE}px;
                }

                img {
                    width: 100%;
                    height: 100%;
                }

                .gradient{
                    background: linear-gradient(rgba(${color.join(',')}, 0), rgba(${color.join(',')}, 0.8));
                    width: 100%;
                    height: 50%;
                    position: absolute;
                    bottom: 0;
                }

                .text {
                    position: absolute;
                    bottom: 0;
                    padding: ${PADDING_BASE_SIZE}px;
                }
        
                .main h1 {
                    text-align: left;
                    font-weight: 800;
                    font-size: ${FONT_BASE_SIZE + (FONT_SIZE_MULTIPLICATOR * 6)}px;
                }

                .main h2 {
                    text-align: left;
                    font-weight: 700;
                    font-size: ${FONT_BASE_SIZE + (FONT_SIZE_MULTIPLICATOR * 4)}px;
                }
        
                .main h3 {
                    text-align: left;
                    font-weight: 400;
                    font-size: ${FONT_BASE_SIZE + (FONT_SIZE_MULTIPLICATOR * 2)}px;
                }
        
                h1 {
                    text-align: left;
                    font-weight: 800;
                    font-size: ${FONT_BASE_SIZE + (FONT_SIZE_MULTIPLICATOR * 2)}px;
                }

                h2 {
                    text-align: left;
                    font-weight: 700;
                    font-size: ${FONT_BASE_SIZE + FONT_SIZE_MULTIPLICATOR}px;
                }
        
                h3 {
                    text-align: left;
                    font-weight: 400;
                    font-size: ${FONT_BASE_SIZE}px;
                }
            </style>
        </head>
        
        <body>
            <table border="0">
                ${hasMain
            ? `<tr>${main}${firtRow.join('')}</tr><tr>${secondRow.join('')}</tr>`
            : ''
        }                
                ${table.join('')}
            </table>
        
        </body>
        
        </html>`

    return html
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

const generateCollage = (ctx, lastfm_user, matriz, first_name, media_type, period) => {
    return new Promise(async (resolve, reject) => {
        try {

            const [COLUMNS, ROWS] = matriz

            const MAX_SUBARRAY_SIZE = COLUMNS
            const MIN_CELL_SIZE = COLUMNS > ROWS ? (1000 / COLUMNS) : (1000 / ROWS)
            const BODY_WIDTH = Math.round(MIN_CELL_SIZE * COLUMNS)
            const BODY_HEIGHT = Math.round(MIN_CELL_SIZE * ROWS)

            const res = await getUserTopAlbums(lastfm_user, period, COLUMNS * ROWS)
            const color = hexToRgb(getRandomColor())

            const response = await ctx.reply(
                '🖼️ Generating your collage...\n' +
                'It may take a while'
            )
            const { message_id } = response

            const html = generateHtml(res, color, {
                COLUMNS,
                ROWS,
                MAX_SUBARRAY_SIZE,
                MIN_CELL_SIZE,
                BODY_WIDTH,
                BODY_HEIGHT
            })

            const ssOptions = {
                type: 'jpeg',
                quality: 100,
                fullPage: false,
                clip: { x: 0, y: 0, width: BODY_WIDTH, height: BODY_HEIGHT },
                path: ''
            }

            await ctx.replyWithChatAction('upload_photo')

            generateImage(html, ssOptions)
                .then((imageBuffer) => {
                    ctx.replyWithPhoto(
                        { source: imageBuffer },
                        { caption: `${first_name}, your ${matriz.join('x')} ${mediaMap[media_type]} collage of ${periodInTextMap[period]}` }
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
    let [command, matriz, period] = text.split(' ')

    try {
        await ctx.replyWithChatAction('typing')

        if (!matriz) matriz = '4x4'
        if (!period) period = '7d'

        //verifica se os argumetnos são válidos
        let col_x_row = matriz.split('x')

        if (col_x_row === matriz || col_x_row.length != 2) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        col_x_row = col_x_row.map(item => Math.round(Number(item)))

        if (typeof col_x_row[0] != 'number' || Number.isNaN(col_x_row[0]) || col_x_row[0] > 10 || col_x_row[0] < 1) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')
        if (typeof col_x_row[1] != 'number' || Number.isNaN(col_x_row[1]) || col_x_row[1] > 10 || col_x_row[1] < 1) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        if (!acceptedPeriods.includes(period)) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        const canSendPhoto = await checkSendMediaPermission(ctx)
        if (!canSendPhoto) return errorHandler(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

        const lastfm_user = await getLastfmUser(telegram_id)

        //gera a colagem
        period = periodMap[period]
        generateCollage(ctx, lastfm_user, col_x_row, first_name, 'album', period)
            .catch(error => {
                errorHandler(ctx, error)
            })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default collage