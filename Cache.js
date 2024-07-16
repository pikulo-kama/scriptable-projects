// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: hdd;

const root = {
    
    fileImport: importModule("File Util"),
    
    fm: FileManager.local(),
    cacheDir: () => root.fm.cacheDirectory(),
    cacheFileName: "cache.json",

    types: {
        DATA: "data",
        IMAGE: "image",
        LIST: "list"
    },


    getRequest: async (config, url) => {

        let data = null
        let rawData = null

        try {
            rawData = await new Request(url).loadJSON()

            data = await root.formatData(config, rawData)
            await root.cacheData(data, url)

        } catch (error) {
            console.log(error)
            console.log("Getting data from cache")
            data = root.getFromCache(url)
        }

        return data
    },


    formatData: async (config, rawData) => {

        let data = {}

        for (let fieldConfig of config) {
            let fieldData = root.parseProp(fieldConfig.prop, rawData)
            let key = fieldData.defaultAlias
            let value = null

            if (fieldConfig.type == undefined) {
                fieldConfig.type = root.types.DATA
            }

            if (fieldConfig.alias !== undefined) {
                key = fieldConfig.alias
            }

            switch (fieldConfig.type) {
                case root.types.DATA:
                    let rawValue = fieldData.value

                    if (fieldConfig.transform != undefined) {
                        value = fieldConfig.transform(rawValue)
                    } else {
                        value = rawValue
                    }
                    break

                case root.types.IMAGE:
                    value = await root.saveImage(fieldData.value)
                    break

                case root.types.LIST:
                    value = await root.formatList(fieldConfig.mappings, fieldData.value)
                    break
            }

            data[key] = value
        }

        return data
    },


    formatList: async (config, rawData) => {

        let result = []

        if (!rawData) {
            return result;
        }

        for (let record of rawData) {
            result.push(await root.formatData(config, record))
        }

        return result
    },


    parseProp: (prop, data) => {
        let parts = prop.split(".")
        let resultData = data

        for (let part of parts) {

            if (resultData instanceof Array) {
                resultData = null
                break
            }

            resultData = resultData[part]
        }

        return {
            value: resultData,
            defaultAlias: parts[parts.length - 1]
        }
    },


    saveImage: async imageUrl => {
        let imageName = "CIMG-" + UUID.string() + ".jpeg"
        let filePath = root.fm.joinPath(root.cacheDir(), imageName)

        root.fm.writeImage(filePath, await new Request(imageUrl).loadImage())

        return filePath
    },


    cacheData: async (data, key) => {
        let cache = JSON.parse(root.fileImport.getConfiguration(root.cacheFileName, "[]"))

        cache = cache.filter(e => e.id != key)
        cache.push({
            id: key,
            value: data
        })

        root.fileImport.updateConfiguration(root.cacheFileName, JSON.stringify(cache))
    },


    getFromCache: key => {
        let cache = JSON.parse(root.fileImport.getConfiguration(root.cacheFileName, "[]"))
        return cache.find(e => e.id == key).value
    }
}

module.exports.types = root.types
module.exports.getRequest = root.getRequest
