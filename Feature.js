// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;

const { FileUtil } = importModule("File Util");


class FeatureUtil {

    static #VALUE_PROPERTY = "value";
    static #DEBUG_PROPERTY = "__debug";
    static #ENABLED_PROPERTY = "__enabled";
    static #instance;

    #featureConfig;

    constructor() {
        this.#featureConfig = FileUtil.readLocalFeatureFile();
    }

    static getInstance() {

        if (!this.#instance) {
            this.#instance = new FeatureUtil();
        }

        return this.#instance;
    }

    isDebugFeatureEnabled(featureName) {
        return this.isDebugEnabled() && this.isFeatureEnabled(featureName);
    }

    isDebugEnabled() {
        return this.isFeatureEnabled(FeatureUtil.#DEBUG_PROPERTY);
    }

    isFeatureEnabled(featureName) {
        const feature = this.#featureConfig[featureName];
        return feature?.[FeatureUtil.#ENABLED_PROPERTY];
    }

    getFeature(featureName, defaultValue) {

        let featureValue = this.#featureConfig[featureName]?.[FeatureUtil.#VALUE_PROPERTY];

        if (featureValue === undefined) {
            featureValue = defaultValue;
        }

        return featureValue;
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
