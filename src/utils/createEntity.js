function createEntity(offset, length, type, url = null) {
    const entity = { offset, length, type }
    if (url) {
        entity.url = url
    }
    return entity
}

export default createEntity