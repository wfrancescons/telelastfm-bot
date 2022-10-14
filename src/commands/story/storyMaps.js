// Medias
const acceptedMedias = [
    'tracks', 'track', 'musics',
    'albums', 'album', 'alb',
    'artists', 'artist', 'art'
]

const mediaMap = {
    'tracks': 'tracks',
    'track': 'tracks',
    'musics': 'tracks',
    'albums': 'albums',
    'album': 'albums',
    'alb': 'albums',
    'artists': 'artists',
    'artist': 'artists',
    'art': 'artists'
}

//Periods
const acceptedPeriods = [
    'overall', 'all',
    '7day', '7d', '7days',
    '1month', '1m', '30d',
    '3month', '3m', '3months',
    '6month', '6m', '6months',
    '12month', '12m', '1y', '1year',
]

const periodMap = {
    'overall': 'overall',
    'all': 'overall',
    '7day': '7day',
    '7d': '7day',
    '7days': '7day',
    '1month': '1month',
    '1m': '1month',
    '30d': '1month',
    '3month': '3month',
    '3m': '3month',
    '3months': '3month',
    '6month': '6month',
    '6m': '6month',
    '6months': '6month',
    '12month': '12month',
    '12m': '12month',
    '1y': '12month',
    '1year': '12month'
}

const periodInTextMap = {
    'overall': 'all time',
    '7day': 'last 7 days',
    '1month': 'last month',
    '3month': 'last 3 months',
    '6month': 'last 6 months',
    '12month': 'last 12 months',
}

export {
    acceptedMedias,
    mediaMap,
    acceptedPeriods,
    periodMap,
    periodInTextMap
}