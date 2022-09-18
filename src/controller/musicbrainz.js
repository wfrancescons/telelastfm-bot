import axios from 'axios'

const { get } = axios

const MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2/artist/'

const getArtistImage = (mbid) => {
    return new Promise((resolve, reject) => {
        get(MUSICBRAINZ_API_URL + mbid, {
            params: {
                inc: 'url-rels',
                fmt: 'json'
            },
        })
            .then((response) => {
                const relations = response.data.relations

                let image_wiki_url = []
                relations.forEach(rel => {
                    if (rel.type === 'image') {
                        let image_url = rel.url.resource
                        if (image_url.startsWith('https://commons.wikimedia.org/wiki/File:')) {
                            const filename = image_url.substring(image_url.lastIndexOf('/') + 1)
                            image_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + filename
                            image_wiki_url.push(image_url)
                        } else if (image_url.startsWith('https://pbs.twimg.com/media/')) {
                            image_wiki_url.push(image_url)
                        }
                    }
                })

                resolve(image_wiki_url)
            })
            //.catch((error) => error.response.status === 404 ? resolve([]) : reject(error))
            .catch((error) => resolve([]))
    })
}

export default getArtistImage