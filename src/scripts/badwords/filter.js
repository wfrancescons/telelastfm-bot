import Filter from 'bad-words'
import badwords from './badwords.js'

const filter = new Filter()

filter.addWords(...badwords)

const hasBadword = text => {
    return filter.isProfane(text)
}

export { hasBadword }
