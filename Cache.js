// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: hdd;

const { FileUtil } = importModule("File Util");
const { Logger } = importModule("Logger");


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

    #transformFunction = (value) => value;

    #builder;
    #callback;
    #propertyType;
    #property;
    #propertyAlias;

    /**
     * Creates an instance of PropertyMetadata.
     * 
     * @param {ListMetadata|Metadata} builder parent builder, could be list builder or main root builder
     * @param {CacheDataType} type type of property
     * @param {Function} callback function that should be invoked when property build is finished
     * @memberof PropertyMetadata
     */
    constructor(builder, type, callback) {
        this.#builder = builder;
        this.#callback = callback;
        this.#propertyType = type
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
        this.#property = property;
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
        this.#propertyAlias = alias;
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
        this.#transformFunction = transofrmFunction;
        return this;
    }

    /**
     * Used to compose collected data.
     *
     * @return {ListMetadata|Metadata} parent metadata builder
     * @memberof PropertyMetadata
     */
    add() {
        this.#callback(this.__getPropertyMetadata());
        return this.#builder;
    }

    /**
     * Used to get object with field 
     * metadata
     *
     * @return {Object} field metadata
     * @memberof PropertyMetadata
     */
    __getPropertyMetadata() {
        return {
            property: this.#property,
            alias: this.#propertyAlias,
            type: this.#propertyType,
            transformFunction: this.#transformFunction
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

    #listPropertyMetadata = [];

    /**
     * Creates an instance of ListMetadata.
     * 
     * @param {ListMetadata|Metadata} builder parent builder, could be list builder or main root builder
     * @param {Function} callback function that should be invoked when property build is finished
     * @memberof ListMetadata
     */
    constructor(parentBuilder, callback) {
        super(parentBuilder, CacheDataType.List, callback);
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
            (fieldMetadata) => this.#listPropertyMetadata.push(fieldMetadata)
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
            (fieldMetadata) => this.#listPropertyMetadata.push(fieldMetadata)
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
            (fieldMetadata) => this.#listPropertyMetadata.push(fieldMetadata)
        );
    }

    __getPropertyMetadata() {

        const metadata = super.__getPropertyMetadata();
        metadata.listPropertyMetadata = this.#listPropertyMetadata;
        
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

    #parentBuilder;
    #callback;
    #fields = [];

    /**
     * Creates an instance of Metadata.
     * 
     * @param {ListMetadata|Metadata} parentBuilder parent builder, only not null if invoked from List builder
     * @param {Function} callback function that should be invoked when property build is finished
     * @memberof Metadata
     */
    constructor(parentBuilder, callback) {
        this.#parentBuilder = parentBuilder;
        this.#callback = callback;
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
            (fieldMetadata) => this.#fields.push(fieldMetadata)
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
            (fieldMetadata) => this.#fields.push(fieldMetadata)
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
            (fieldMetadata) => this.#fields.push(fieldMetadata)
        );
    }

    /**
     * Used to create metadata.
     *
     * @return {Object} list of fields' metadata
     * @memberof Metadata
     */
    create() {

        if (this.#callback) {
            this.#callback(this.#fields);
        }

        if (this.#parentBuilder) {
            return this.#parentBuilder;
        }

        return this.#fields;
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

    static #logger = new Logger(CacheRequest.name);

    static #HOUR_MILLISECONDS = 3_600_000;
    static #FETCH_TIMESTAMP_FIELD = "fetchTimesamp";
    static #FILE_NAME = "cache.user.json";
    static #manager = FileManager.local();
    
    #metadata;
    #cacheRefreshRateMillis = 0;

    /**
     * Creates an instance of CacheRequest.
     * 
     * @param {Object} metadata request metadata
     * @param {Number} cacheRefreshRateHours amount of hours request ca be taken from cache
     * before refreshing it
     * @memberof CacheRequest
     */
    constructor(metadata, cacheRefreshRateHours) {
        this.#metadata = metadata;

        if (cacheRefreshRateHours) {
            this.#cacheRefreshRateMillis = cacheRefreshRateHours * CacheRequest.#HOUR_MILLISECONDS;
        }
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
        const responseFromCache = this.#getResponseFromCache(url);

        // Get data from cache when time since last request is less than
        // defined refresh rate.
        if (!this.#shouldBeRefreshed(responseFromCache)) {
            return responseFromCache;
        }

        // Get value from cache if there was an issue sending request.
        try {
            const responseData = await new Request(url).loadJSON();
            processedResponse = await this.#processResponse(this.#metadata, responseData);
            processedResponse[CacheRequest.#FETCH_TIMESTAMP_FIELD] = Number(new Date());

            await this.#cacheResponse(url, processedResponse);

        } catch (error) {
            CacheRequest.#logger.error(error);
            CacheRequest.#logger.warn("Retrieving data from cache", {url});
            
            return responseFromCache;
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
    async #processResponse(metadata, responseData) {

        const processedResponse = {};

        for (const fieldMetadata of metadata) {

            const property = this.#getPropertyFromResponse(fieldMetadata.property, responseData);
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
                    propertyValue = await this.#processImage(property.value);
                    break;

                case CacheDataType.List:
                    propertyValue = await this.#processList(fieldMetadata.listPropertyMetadata, property.value);
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
    async #processImage(imageURI) {

        const imagePath = CacheRequest.#manager.joinPath(
            CacheRequest.#manager.cacheDirectory(), 
            `CIMG-${UUID.string()}.jpeg`
        );
        
        CacheRequest.#manager.writeImage(imagePath, await new Request(imageURI).loadImage());
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
    async #processList(listMetadata, collection) {

        const processedCollection = [];

        if (!collection) {
            return [];
        }

        for (const entry of collection) {
            processedCollection.push(await this.#processResponse(listMetadata, entry));
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
    #getPropertyFromResponse(composedProperty, response) {

        const propertyChain = composedProperty.split(".");
        let propertyValue = response;

        for (const property of propertyChain) {

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
     * Used to check whether response should be
     * refreshed.
     * 
     * @param {Object} response JSON repsonse
     * @returns {Boolean} True if should be refreshed otherwise false
     */
    #shouldBeRefreshed(response) {

        if (!response) {
            return true;
        }

        const fetchTimestamp = response[CacheRequest.#FETCH_TIMESTAMP_FIELD];
        const currentTimestamp = Number(new Date());

        const timeSinceLastRequest = currentTimestamp - fetchTimestamp;
        return timeSinceLastRequest >= this.#cacheRefreshRateMillis;
    }

    /**
     * Used to cache response for later use.
     *
     * @param {String} key string that identifies response
     * @param {Object} response response processed using metadata
     * @memberof CacheRequest
     */
    async #cacheResponse(key, response) {

        const cache = FileUtil.readLocalJson(CacheRequest.#FILE_NAME, [])
            .filter(entry => entry.id != key);

        cache.push({
            id: key,
            value: response
        });

        FileUtil.updateLocalJson(CacheRequest.#FILE_NAME, cache);
    }

    /**
     * Used to retrieve data from cache.
     * Used when there was an issue downloading data.
     *
     * @param {String} key string that identifies response
     * @return {Object} response from cache
     * @memberof CacheRequest
     */
    #getResponseFromCache(key) {
        
        const entryFromCache = FileUtil.readLocalJson(CacheRequest.#FILE_NAME, [])
            .find(entry => entry.id == key);

        return entryFromCache?.value;
    }
}


function metadata() {
    return new Metadata();
}


function cacheRequest(metadata, refreshRateHours) {
    return new CacheRequest(metadata, refreshRateHours);
}


module.exports = {
    metadata,
    cacheRequest
};
