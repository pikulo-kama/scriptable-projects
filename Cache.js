// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: hdd;

const { FileUtil } = importModule("File Util");


/**
 * Enum for cache data type
 *
 * @class CacheDataType
 */
class CacheDataType {
    
    /**
     * Represents regular data that could be stored
     * directly.
     * 
     * Such as strings, number, dates, etc.
     *
     * @static
     * @memberof CacheDataType
     */
    static Data = "Data";

    /**
     * Represents image data that can't be stored directly
     * instead image is stored locally on device in
     * cache directory while path to the image is being 
     * stored.
     *
     * @static
     * @memberof CacheDataType
     */
    static Image = "Image";

    /**
     * Used to represent fields that are
     * collection of data.
     *
     * @static
     * @memberof CacheDataType
     */
    static List = "List";
}


/**
 * Builder for metadata.
 * Used to build metadata for simple types
 * such as Data and Image.
 *
 * @class PropertyMetadata
 */
class PropertyMetadata {

    /**
     * Creates an instance of PropertyMetadata.
     * 
     * @param {ListMetadata|Metadata} builder parent builder, could be list builder or main root builder
     * @param {CacheDataType} type type of property
     * @param {Function} callback function that should be invoked when property build is finished
     * @memberof PropertyMetadata
     */
    constructor(builder, type, callback) {
        this.__builder = builder;
        this.__callback = callback;
        this.__propertyType = type
        this.__property = undefined;
        this.__propertyAlias = undefined;
        this.__transformFunction = (value) => value;
    }

    /**
     * Used to set property name.
     * Should be chain of JSON field names
     * joined by dot (.)
     * 
     * Make sure that list type fields are not included.
     * They should be used only with ListMetadata.
     *
     * @param {String} property property name
     * @return {PropertyMetadata} current instance of builder
     * @memberof PropertyMetadata
     */
    property(property) {
        this.__property = property;
        return this;
    }

    /**
     * Used to set alias for property name.
     *
     * @param {String} alias alias for property
     * @return {PropertyMetadata} current instance of builder
     * @memberof PropertyMetadata
     */
    alias(alias) {
        this.__propertyAlias = alias;
        return this;
    }

    /**
     * Used to set value transform function
     * in case if value should be modified before
     * persisted into cache.
     *
     * @param {Function} transofrmFunction transforming function
     * @return {PropertyMetadata} current instance of builder
     * @memberof PropertyMetadata
     */
    transformFunction(transofrmFunction) {
        this.__transformFunction = transofrmFunction;
        return this;
    }

    /**
     * Used to compose collected data.
     *
     * @return {ListMetadata|Metadata} parent metadata builder
     * @memberof PropertyMetadata
     */
    add() {
        this.__callback(this._getPropertyMetadata());
        return this.__builder;
    }

    /**
     * Used to get object with field 
     * metadata
     *
     * @return {Object} field metadata
     * @memberof PropertyMetadata
     */
    _getPropertyMetadata() {
        return {
            property: this.__property,
            alias: this.__propertyAlias,
            type: this.__propertyType,
            transformFunction: this.__transformFunction
        };
    }
}

/**
 * Builder for metadata.
 * Used to build List objects.
 *
 * @class ListMetadata
 * @extends {PropertyMetadata}
 */
class ListMetadata extends PropertyMetadata {

    /**
     * Creates an instance of ListMetadata.
     * 
     * @param {ListMetadata|Metadata} builder parent builder, could be list builder or main root builder
     * @param {Function} callback function that should be invoked when property build is finished
     * @memberof ListMetadata
     */
    constructor(parentBuilder, callback) {
        super(parentBuilder, CacheDataType.List, callback);
        this.__listPropertyMetadata = [];
    }

    /**
     * Used to build metadata for Data type.
     *
     * @return {PropertyMetadata} metadata builder for Data field
     * @memberof ListMetadata
     */
    data() {
        return new PropertyMetadata(this, 
            CacheDataType.Data, 
            (fieldMetadata) => this.__listPropertyMetadata.push(fieldMetadata)
        );
    }

    /**
     * Used to build metadata for Image type.
     *
     * @return {PropertyMetadata} metadata builder for Image field
     * @memberof ListMetadata
     */
    image() {
        return new PropertyMetadata(this, 
            CacheDataType.Image, 
            (fieldMetadata) => this.__listPropertyMetadata.push(fieldMetadata)
        );
    }

    /**
     * Used to build metadata for List type.
     *
     * @return {ListMetadata} metadata builder for List field
     * @memberof ListMetadata
     */
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

/**
 * Metadata builder.
 * Used to build request metadata,
 * which is later used to transform response.
 *
 * @class Metadata
 */
class Metadata {

    /**
     * Creates an instance of Metadata.
     * 
     * @param {ListMetadata|Metadata} parentBuilder parent builder, only not null if invoked from List builder
     * @param {Function} callback function that should be invoked when property build is finished
     * @memberof Metadata
     */
    constructor(parentBuilder, callback) {
        this.__parentBuilder = parentBuilder;
        this.__callback = callback;
        this.__fields = [];
    }

    /**
     * Used to build metadata for Data type.
     *
     * @return {PropertyMetadata} metadata builder for Data field
     * @memberof Metadata
     */
    data() {
        return new PropertyMetadata(this, 
            CacheDataType.Data, 
            (fieldMetadata) => this.__fields.push(fieldMetadata)
        );
    }

    /**
     * Used to build metadata for Image type.
     *
     * @return {PropertyMetadata} metadata builder for Image field
     * @memberof Metadata
     */
    image() {
        return new PropertyMetadata(this, 
            CacheDataType.Image, 
            (fieldMetadata) => this.__fields.push(fieldMetadata)
        );
    }

    /**
     * Used to build metadata for List type.
     *
     * @return {ListMetadata} metadata builder for List field
     * @memberof Metadata
     */
    list() {
        return new ListMetadata(this,
            (fieldMetadata) => this.__fields.push(fieldMetadata)
        );
    }

    /**
     * Used to create metadata.
     *
     * @return {Object} list of fields' metadata
     * @memberof Metadata
     */
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

/**
 * Main component.
 * Uses metadata to process data
 * and then store it in cache.
 *
 * @class CacheRequest
 */
class CacheRequest {

    static __FILE_NAME = "cache.json";
    static __manager = FileManager.local();

    constructor(metadata) {
        this.__metadata = metadata;
    }

    /**
     * Used to send GET request to provided resource.
     * Metadata is being used to process and store response.
     *
     * @param {String} url URL from which data should be retrieved
     * @return {Object} processed data that was retrieved from resource
     * @memberof CacheRequest
     */
    async get(url) {

        let processedResponse = null;

        try {
            let responseData = await new Request(url).loadJSON();

            processedResponse = await this.__processResponse(this.__metadata, responseData);
            await this.__cacheResponse(url, processedResponse);

        } catch (error) {
            console.log(error);
            console.warn("Getting data from cache");
            processedResponse = this.__getResponseFromCache(url);
        }

        return processedResponse;
    }

    /**
     * Used to process response with provided metadata.
     *
     * @param {Object} metadata metadata
     * @param {Object} responseData response data
     * @return {Object} processed response data
     * @memberof CacheRequest
     */
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

    /**
     * Used to download and store image on
     * device file system.
     *
     * @param {String} imageURI image that should be downloaded
     * @return {String} path where image is stored
     * @memberof CacheRequest
     */
    async __processImage(imageURI) {

        let imagePath = CacheRequest.__manager.joinPath(
            CacheRequest.__manager.cacheDirectory(), 
            `CIMG-${UUID.string()}.jpeg`
        );
        
        CacheRequest.__manager.writeImage(imagePath, await new Request(imageURI).loadImage());
        return imagePath;
    }

    /**
     * Used to process all child elements of List
     * type data.
     *
     * @param {Object} listMetadata metadata of provided collection
     * @param {List<Object>} collection list data
     * @return {List<Object>} list of processed data
     * @memberof CacheRequest
     */
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

    /**
     * Used to get field value from response
     * corresponding to provided composed property.
     *
     * @param {String} composedProperty composed property
     * @param {Object} response JSON response
     * @return {Object} field that corresponds to composed property
     * @memberof CacheRequest
     */
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

    /**
     * Used to cache response for later use.
     *
     * @param {String} key string that identifies response
     * @param {Object} response response processed using metadata
     * @memberof CacheRequest
     */
    async __cacheResponse(key, response) {

        let cache = FileUtil.readLocalJson(CacheRequest.__FILE_NAME, [])
            .filter(entry => entry.id != key);

        cache.push({
            id: key,
            value: response
        });

        FileUtil.updateLocalJson(CacheRequest.__FILE_NAME, cache);
    }

    /**
     * Used to retrieve data from cache.
     * Used when there was an issue downloading data.
     *
     * @param {String} key string that identifies response
     * @return {Object} response from cache
     * @memberof CacheRequest
     */
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
