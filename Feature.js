// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: toggle-off;

const { FileUtil } = importModule("File Util");


/**
 * Singleton class.
 * Used to operate with script features.
 *
 * @class FeatureUtil
 */
class FeatureUtil {

    static #VALUE_PROPERTY = "value";
    static #DEBUG_PROPERTY = "__debug";
    static #ENABLED_PROPERTY = "__enabled";
    static #instance;

    #featureConfig;

    constructor() {
        this.#featureConfig = FileUtil.readLocalFeatureFile();
    }

    /**
     * Used to get instance of FeatureUtil.
     *
     * @static
     * @return {FeatureUtil} instance of util class
     * @memberof FeatureUtil
     */
    static getInstance() {

        if (!this.#instance) {
            this.#instance = new FeatureUtil();
        }

        return this.#instance;
    }

    /**
     * Used to check state of feature.
     * Feature would be enabled only if debug
     * is enabled as well.
     *
     * @param {String} featureName feature name
     * @return {Boolean} True if debug and feature are enabled otherwise false
     * @memberof FeatureUtil
     */
    isDebugFeatureEnabled(featureName) {
        return this.isDebugEnabled() && this.isFeatureEnabled(featureName);
    }

    /**
     * Used to check whether debug (__debug)
     * feature is enabled.
     *
     * @return {Boolean} True if debug feature enabled otherwise false
     * @memberof FeatureUtil
     */
    isDebugEnabled() {
        return this.isFeatureEnabled(FeatureUtil.#DEBUG_PROPERTY);
    }

    /**
     * Used to check state of feature.
     * Debug feature (__debug) doesn't 
     * affect state of feature when using
     * this method.
     *
     * @param {String} featureName feature name
     * @return {Boolean} true if feature enabled otherwise false
     * @memberof FeatureUtil
     */
    isFeatureEnabled(featureName) {
        const feature = this.#featureConfig[featureName];
        return feature?.[FeatureUtil.#ENABLED_PROPERTY];
    }

    /**
     * Used to get value of the feature.
     *
     * @param {String} featureName feature name
     * @return {Object} value of feature
     * @memberof FeatureUtil
     */
    getFeature(featureName) {
        const feature = this.#featureConfig[featureName];
        return feature?.[FeatureUtil.#VALUE_PROPERTY];
    }
}


function debugEnabled() {
    return FeatureUtil.getInstance().isDebugEnabled();
}


function debugFeatureEnabled(featureName) {
    return FeatureUtil.getInstance().isDebugFeatureEnabled(featureName);
}


function featureEnabled(featureName) {
    return FeatureUtil.getInstance().isFeatureEnabled(featureName);
}


function getFeature(featureName) {
    return FeatureUtil.getInstance().getFeature(featureName);
}


module.exports = {
    debugEnabled,
    debugFeatureEnabled,
    featureEnabled,
    getFeature
};
