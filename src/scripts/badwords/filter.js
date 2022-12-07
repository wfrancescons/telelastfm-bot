import piii from 'piii'
import badwords from './badwords.js'

const filter = new piii({
    filters: [
        badwords
    ],
    aliases: {
        a: ['2', '4', '@'],
        e: ['3', '&'],
        o: ['0']
    },
    repeated: true
})

const hasBadword = text => {
    return filter.has(text)
}

export { hasBadword }
