const limitText = (text, limit = 30) => {
    text.trim()
    if (text.length > limit) {
        text = text.substring(0, limit - 2) + '...'
    }
    return text
}

export default limitText