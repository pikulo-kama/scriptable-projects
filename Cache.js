// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: hdd;

const { FileUtil } = importModule("File Util");


class CacheDataType {
    static Data = "Data";
    static Image = "Image";
    static List = "List";
}

class PropertyMetadata {

    constructor(builder, type, callback) {
        this.__builder = builder;
        this.__callback = callback;
        this.__propertyType = type
        this.__property = undefined;
        this.__propertyAlias = undefined;
        this.__transformFunction = (value) => value;
    }

    property(property) {
        this.__property = property;
        return this;
    }

    alias(alias) {
        this.__propertyAlias = alias;
        return this;
    }

    transformFunction(transofrmFunction) {
        this.__transformFunction = transofrmFunction;
        return this;
    }

    add() {
        this.__callback(this._getPropertyMetadata());
        return this.__builder;
    }

    _getPropertyMetadata() {
        return {
            property: this.__property,
            alias: this.__propertyAlias,
            type: this.__propertyType,
            transformFunction: this.__transformFunction
        };
    }
}

class ListMetadata extends PropertyMetadata {

    constructor(parentBuilder, callback) {
        super(parentBuilder, CacheDataType.List, callback);
        this.__listPropertyMetadata = [];
    }

    data() {
        return new PropertyMetadata(this, 
            CacheDataType.Data, 
            (fieldMetadata) => this.__listPropertyMetadata.push(fieldMetadata)
        );
    }

    image() {
        return new PropertyMetadata(this, 
            CacheDataType.Image, 
            (fieldMetadata) => this.__listPropertyMetadata.push(fieldMetadata)
        );
    }

    list() {
        return new ListMetadata(this,
            (fieldMetadata) => this.__listPropertyMetadata.push(fieldMetadata)
        );
    }

    _getPropertyMetadata() {

        let metadata = super._getPropertyMetadata();
        metadata.listPropertyMetadata = this.__listPropertyMetadata;
        
        return metadata;
    }
}

class Metadata {

    constructor(parentBuilder, callback) {
        this.__parentBuilder = parentBuilder;
        this.__callback = callback;
        this.__fields = [];
    }

    data() {
        return new PropertyMetadata(this, 
            CacheDataType.Data, 
            (fieldMetadata) => this.__fields.push(fieldMetadata)
        );
    }

    image() {
        return new PropertyMetadata(this, 
            CacheDataType.Image, 
            (fieldMetadata) => this.__fields.push(fieldMetadata)
        );
    }

    list() {
        return new ListMetadata(this,
            (fieldMetadata) => this.__fields.push(fieldMetadata)
        );
    }

    create() {

        if (this.__callback) {
            this.__callback(this.__fields);
        }

        if (this.__parentBuilder) {
            return this.__parentBuilder;
        }

        return this.__fields;
    }
}

class CacheRequest {

    static __FILE_NAME = "cache.json";
    static __manager = FileManager.local();

    constructor(metadata) {
        this.__metadata = metadata;
    }

    async get(url) {

        let processedResponse = null;

        try {
            let responseData = await new Request(url).loadJSON();

            processedResponse = await this.__processResponse(this.__metadata, responseData);
            await this.__cacheResponse(url, processedResponse);

        } catch (error) {
            console.log(error);
            console.log("Getting data from cache");
            processedResponse = this.__getResponseFromCache(url);
        }

        return processedResponse;
    }

    async __processResponse(metadata, responseData) {

        let processedResponse = {};

        for (let fieldMetadata of metadata) {

            let property = this.__getPropertyFromResponse(fieldMetadata.property, responseData);
            let propertyName = property.name;
            let propertyValue;

            if (fieldMetadata.alias) {
                propertyName = fieldMetadata.alias;
            }

            switch (fieldMetadata.type) {

                case CacheDataType.Data:
                    propertyValue = fieldMetadata.transformFunction(property.value);
                    break;

                case CacheDataType.Image:
                    propertyValue = await this.__processImage(property.value);
                    break;

                case CacheDataType.List:
                    propertyValue = await this.__processList(fieldMetadata.listPropertyMetadata, property.value);
                    break;
            }

            processedResponse[propertyName] = propertyValue;
        }

        return processedResponse;
    }

    async __processImage(imageURI) {

        let imagePath = CacheRequest.__manager.joinPath(
            CacheRequest.__manager.cacheDirectory(), 
            `CIMG-${UUID.string()}.jpeg`
        );
        
        CacheRequest.__manager.writeImage(imagePath, await new Request(imageURI).loadImage());
        return imagePath;
    }

    async __processList(listMetadata, collection) {

        let processedCollection = [];

        if (!collection) {
            return [];
        }

        for (let entry of collection) {
            processedCollection.push(await this.__processResponse(listMetadata, entry));
        }

        return processedCollection;
    }

    __getPropertyFromResponse(composedProperty, response) {

        let propertyChain = composedProperty.split(".");
        let propertyValue = response;

        for (let property of propertyChain) {

            // There should be no list objects
            // on the way.
            if (propertyValue instanceof Array) {
                propertyValue = null;
                break;
            }

            propertyValue = propertyValue[property];
        }

        return {
            name: propertyChain.pop(),
            value: propertyValue
        };
    }

    async __cacheResponse(url, response) {

        let cache = FileUtil.readLocalJson(CacheRequest.__FILE_NAME, [])
            .filter(entry => entry.id != url);

        cache.push({
            id: url,
            value: response
        });

        FileUtil.updateLocalJson(CacheRequest.__FILE_NAME, cache);
    }

    __getResponseFromCache(key) {
        
        const entryFromCache = FileUtil.readLocalJson(CacheRequest.__FILE_NAME, [])
            .find(entry => entry.id == key);

        return entryFromCache?.value;
    }
}

function metadata() {
    return new Metadata();
}

function cacheRequest(metadata) {
    return new CacheRequest(metadata);
}

module.exports = {
    metadata,
    cacheRequest
};
