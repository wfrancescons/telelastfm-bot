import limitText from '../../helpers/limitText.js'

export default function (data) {

  const { lastfm_data, background_buffer } = data
  const { image, userplaycount, text } = lastfm_data
  const scrobbles = Number(userplaycount) + 1

  const html = `<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&family=Noto+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Train+One&display=swap" rel="stylesheet">
  <style>
    * {margin: 0; padding: 0}
    body {position: relative;width: 1080px;height: 1920px;font-family:'Noto Sans','Noto Sans KR', sans-serif;color: #fff;text-align: center;}
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
  <div style="background-image: url(${'data:image/jpeg;base64,' + background_buffer.toString('base64')}); background-repeat: no-repeat; width: 1080px; height: 1920px;">
    <h1>${scrobbles.toLocaleString('pt-BR')}</h1>
    <h2>${scrobbles != 1 ? 'scrobbles' : 'scrobble'}</h2>

    <div style="width: 100%;">
      <div><img src="${image}" alt=""></div>
      ${text.map((item, index) => {
    return `<h${index + 3}>${limitText(item, 50)}</h${index + 3}>`
  }).join('')}
    </div>

    <div id="footer">Made by @telelastfmbot</div>
  </div>
</body>`

  return html
}