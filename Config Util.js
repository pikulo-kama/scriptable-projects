// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: cogs;

class ConfigStore {

    constructor() {
        this.__config = {};
        this.__userConfig = {};
        this.__colorMode = "dark";
    }

    setConfig(config) {
        this.__config = config;
    }

    overrideConfig(config) {

        if (config) {
            this.__userConfig = config;
        }
    }

    setColorMode(colorMode) {
        this.__colorMode = colorMode;
    }

    /*
    * Used to return configuration value.
    * If value is present in config
    * provided by user, it would be used
    * otherwise default one will be returned
    *
    * @param fieldStr - configuration key
    *
    * @return user-provided or default 
    * configuration value
    */
    get(fieldName) {
      
        const fieldArray = fieldName.split(".");
        
        const configValue = this.__getField(this.__config, fieldArray);
        const userConfigValue = this.__getField(this.__userConfig, fieldArray);
        
        let value = configValue;

        if (userConfigValue) {
            value = userConfigValue;
        }

        return value;
    }

    /*
    * Used to get value from provided
    * object by iterating through nested 
    * properties
    *
    * @param c - config object
    *
    * @param property - list of config recursive
    * properties
    *
    * @return field from config
    */
    __getField(config, propertyChain) {

        let configValue = config;

        for (let property of propertyChain) {
          
            let nextValue = configValue[property];
          
            if (nextValue == undefined) {
                configValue = null;
                break;
            } 
        
            configValue = nextValue;
        }
        
        if (Array.isArray(configValue) &&
            configValue.length == 2 &&
            configValue[0].hasOwnProperty("cnfgDark") &&
            configValue[1].hasOwnProperty("cnfgLight")
        ) {
            let valuePosition = this.__colorMode == "dark" ? 0 : 1;
            let valueKey = this.__colorMode == "dark" ? "cnfgDark" : "cnfgLight";
            configValue = configValue[valuePosition][valueKey];
        }
        
        return configValue;
    }
}

/**
* Used to return value based on current
* device theme
*
* @param dark - parameter that would
* be used when dark theme is enabled
* 
* @param light - parameter that would
* be used when light theme is enabled
* 
*
* @return theme specific value
*/
function themed(dark, light) {
    return [{cnfgDark: dark}, {cnfgLight: light}];
}

module.exports = {
    ConfigStore,
    themed
};
