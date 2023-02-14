import limitText from '../../helpers/limitText.js'
import { mediaMap, periodInTextMap } from '../../helpers/validValuesMap.js'

export default (data) => {

  const {
    lastfm_data,
    background_buffer,
    media_type,
    period
  } = data

  const divs = lastfm_data.map(item => {

    const paragrafs = item.text.map(text => `<p>${limitText(text, 22)}</p>`)

    return ` <div class="container" style="width: 100%;">
      <span class="rank align"><span class="hashtag">#</span>${item.rank}</span>
      <div><img src="${item.image}" alt=""></div>
      <div class="align" style="float: left; padding-left: 50px;">
        ${paragrafs.join('')}
        <p>${Number(item.scrobbles).toLocaleString('pt-BR')} ${item.scrobbles == 1 ? 'scrobble' : 'scrobbles'}</p>
      </div>
    </div>`
  })

  const html = `<head>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&family=Noto+Sans:wght@500;700;800&display=swap" rel="stylesheet">
                <link href="https://fonts.googleapis.com/css2?family=Train+One&display=swap" rel="stylesheet">
                <style>
                  * { margin: 0; padding: 0 }
                  body {position: relative;width: 1080px;height: 1920px;font-family:'Noto Sans','Noto Sans KR', sans-serif;color: #fff;text-align: center;}
                  img {width: 180px;height: 180px;float: left;margin-left: 50px;object-fit: cover;object-position: 20% 10%; border-radius: 15px}
                  h1 {text-align: center;font-size: 64px;font-weight: 800;padding: 150px 200px 0px 200px;text-transform: uppercase}
                  p {text-align: left;justify-content: center;}
                  p:nth-child(1) {font-size: 40px;font-weight: 700;}
                  p:nth-child(2) {font-size: 35px;font-weight: 500;}
                  p:nth-child(3) {font-size: 35px;font-weight: 500;}
                  p:nth-child(4) {font-size: 30px;font-weight: 500;}
                  .container {display: flex;padding: 80px 150px 0px 100px}
                  .rank {font-size: 128px;font-family: 'Train One', cursive;}
                  .hashtag {font-size: 64px;font-family: 'Train One', cursive;}
                  .align {margin-top: auto;margin-bottom: auto;}
                  #footer {position: absolute;bottom: 0;left: 0;right: 0;top: 1750px;margin-left: auto;margin-right: auto;font-size: 25px;font-weight: 400; text-transform: uppercase}
                </style>
              </head>
              <body>
                <div style="background-image: url(${'data:image/jpeg;base64,' + background_buffer.toString('base64')}); background-repeat: no-repeat; width: 1080px; height: 1920px;">
                  <h1>Your Top ${mediaMap[media_type]} of ${periodInTextMap[period]}</h1>
                      ${divs.join('')}
                  <div id="footer">Made by @telelastfmbot</div>
                </div>
              </body>`

  return html
}