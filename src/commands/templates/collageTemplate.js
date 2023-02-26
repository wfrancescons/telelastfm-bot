import limitText from '../../helpers/limitText.js'

export default (data) => {

    const {
        COLUMNS,
        ROWS,
        MAX_SUBARRAY_SIZE,
        MIN_CELL_SIZE,
        BODY_WIDTH,
        BODY_HEIGHT,
        lastfm_data,
        color,
        param
    } = data

    let FONT_BASE_SIZE = Math.round(MIN_CELL_SIZE * 0.06)
    if (FONT_BASE_SIZE <= 8) FONT_BASE_SIZE = 8
    const FONT_SIZE_MULTIPLICATOR = Math.ceil(FONT_BASE_SIZE * 0.06)
    const PADDING_BASE_SIZE = Math.round(MIN_CELL_SIZE * 0.05)

    const hasMain = (COLUMNS >= 3 && ROWS >= 2) || (COLUMNS >= 2 && ROWS >= 3)

    let main
    if (hasMain) {

        const firtItem = lastfm_data.shift()

        if (!param) {
            main = `<td rowspan="2" colspan="2">
            <div style="position: relative; width: 100%; height: 100%;">
            <div class="gradient"></div>
            <div class="text main">
                <h1>${limitText(firtItem.text[0], 30)}</h1>
                ${firtItem.text[1] ? `<h2>${limitText(firtItem.text[1], 30)}</h2>` : ''}
                <h3>${Number(firtItem.scrobbles).toLocaleString('pt-BR')} ${firtItem.scrobbles == 1 ? 'scrobble' : 'scrobbles'}</h3>
            </div>
                <img style="width: ${MIN_CELL_SIZE * 2}px; height: ${MIN_CELL_SIZE * 2}px;" src="${firtItem.image}" alt="">
            </div>
            </td>`
        }
        if (param === 'nonames') {
            main = `<td rowspan="2" colspan="2">
            <div style="position: relative; width: 100%; height: 100%;">
                <img style="width: ${MIN_CELL_SIZE * 2}px; height: ${MIN_CELL_SIZE * 2}px;" src="${firtItem.image}" alt="">
            </div>
            </td>`
        }
        if (param === 'noplays') {
            main = `<td rowspan="2" colspan="2">
            <div style="position: relative; width: 100%; height: 100%;">
            <div class="gradient"></div>
            <div class="text main">
                <h1>${limitText(firtItem.text[0], 30)}</h1>
                ${firtItem.text[1] ? `<h2>${limitText(firtItem.text[1], 30)}</h2>` : ''}
            </div>
                <img style="width: ${MIN_CELL_SIZE * 2}px; height: ${MIN_CELL_SIZE * 2}px;" src="${firtItem.image}" alt="">
            </div>
            </td>`
        }
    }

    const tds = lastfm_data.map(item => {
        const { image, text, scrobbles } = item

        let td

        if (!param) {
            td = `<td>
            <div style="position: relative; width: 100%; height: 100%;">
            <div class="gradient"></div>
            <div class="text">
                <h1>${limitText(text[0], 30)}</h1>
                ${text[1] ? `<h2>${limitText(text[1], 30)}</h2>` : ''}
                <h3>${Number(scrobbles).toLocaleString('pt-BR')} ${scrobbles == 1 ? 'scrobble' : 'scrobbles'}</h3>
            </div>
                <img src="${image}" alt="">
            </div>
            </td>`
        }
        if (param === 'nonames') {
            td = `<td>
            <div style="position: relative; width: 100%; height: 100%;">
                <img src="${image}" alt="">
            </div>
            </td>`
        }

        if (param === 'noplays') {
            td = `<td>
            <div style="position: relative; width: 100%; height: 100%;">
            <div class="gradient"></div>
            <div class="text">
                <h1>${limitText(text[0], 30)}</h1>
                ${text[1] ? `<h2>${limitText(text[1], 30)}</h2>` : ''}
            </div>
                <img src="${image}" alt="">
            </div>
            </td>`
        }

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
        trs.push(tds.slice(i, MAX_SUBARRAY_SIZE + i))
    }

    const table = trs.map(item => {
        return '<tr>' + item.join('') + '</tr>'
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
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Sans:wght@500;700;800&display=swap" rel="stylesheet">
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
                    font-family: 'Noto Sans','Noto Sans KR', sans-serif;
                    color: #fff;
                    text-align:left;
                    text-shadow: 1px 1px ${FONT_SIZE_MULTIPLICATOR * 3}px black;
                }

                table {
                    border-collapse: collapse;
                }

                td {
                    height: ${MIN_CELL_SIZE}px;
                    width: ${MIN_CELL_SIZE}px;
                }

                img {
                    width: ${MIN_CELL_SIZE}px;
                    height: ${MIN_CELL_SIZE}px;
                }

                .gradient{
                    background: linear-gradient(rgba(${color.join(',')}, 0), rgba(${color.join(',')}, 0.9));
                    width: 100%;
                    height: 40%;
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
                    font-weight: 500;
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
                    font-weight: 500;
                    font-size: ${FONT_BASE_SIZE}px;
                }
            </style>
        </head>
        
        <body>
            <table border="0">
                ${hasMain ? `<tr>${main}${firtRow.join('')}</tr>
                <tr>${secondRow.join('')}</tr>` : ''}                
                ${table.join('')}
            </table>
        
        </body>
        
        </html>`

    return html
}