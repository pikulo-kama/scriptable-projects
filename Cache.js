// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: hdd;

const { FileUtil } = importModule("File Util");


class CacheDataType {
    static Data = "Data";
    static Image = "Image";
    static List = "List";
}

class CacheRequest {

    static __FILE_NAME = "cache.json";
    static __manager = FileManager.local();

    static async get(url, config) {

        let data = null;
        let rawData = null;

        try {
            rawData = await new Request(url).loadJSON();

            data = await this.__formatData(config, rawData);
            await this.__cacheData(data, url);

        } catch (error) {
            console.log(error);
            console.log("Getting data from cache");
            data = this.__getFromCache(url);
        }

        return data;
    }

    static async __formatData(config, rawData) {

        let data = {};

        for (let fieldConfig of config) {

            let fieldData = this.__parseProperty(fieldConfig.prop, rawData);
            let key = fieldData.defaultAlias;
            let value = null;

            if (fieldConfig.type == undefined) {
                fieldConfig.type = CacheDataType.Data;
            }

            if (fieldConfig.alias !== undefined) {
                key = fieldConfig.alias;
            }

            switch (fieldConfig.type) {
                case CacheDataType.Data:
                    let rawValue = fieldData.value;

                    if (fieldConfig.transform != undefined) {
                        value = fieldConfig.transform(rawValue);

                    } else {
                        value = rawValue;
                    }

                    break;

                case CacheDataType.Image:
                    value = await this.__saveImage(fieldData.value);
                    break;

                case CacheDataType.List:
                    value = await this.__formatList(fieldConfig.mappings, fieldData.value);
                    break;
            }

            data[key] = value;
        }

        return data;
    }

    static async __formatList(config, rawData) {

        let result = [];

        if (!rawData) {
            return result;
        }

        for (let record of rawData) {
            result.push(await this.__formatData(config, record));
        }

        return result;
    }

    static __parseProperty(prop, data) {

        let parts = prop.split(".");
        let resultData = data;

        for (let part of parts) {

            if (resultData instanceof Array) {
                resultData = null;
                break;
            }

            resultData = resultData[part];
        }

        return {
            value: resultData,
            defaultAlias: parts[parts.length - 1]
        };
    }

    static async __saveImage(imageUrl) {

        let imageName = "CIMG-" + UUID.string() + ".jpeg";
        let filePath = this.__manager.joinPath(this.__manager.cacheDirectory(), imageName);

        this.__manager.writeImage(filePath, await new Request(imageUrl).loadImage());
        return filePath;
    }

    static async __cacheData(data, key) {

        let cache = FileUtil.readLocalJson(this.__FILE_NAME, [])
            .filter(entry => entry.id != key);

        cache.push({
            id: key,
            value: data
        });

        FileUtil.updateLocalJson(this.__FILE_NAME, cache);
    }

    static __getFromCache(key) {
        
        let value = null;
        let entryFromCache = FileUtil.readLocalJson(this.__FILE_NAME, [])
            .find(entry => entry.id == key);

        if (entryFromCache) {
            value = entryFromCache.value;
        }
        
        return value;
    }
}

module.exports = {
    CacheRequest,
    CacheDataType
};
