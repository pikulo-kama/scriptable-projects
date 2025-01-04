// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: cogs;


class ColorMode {
    static Light = "light";
    static Dark = "dark";

    static of(colorModeString) {

        const colorModes = [
            this.Light,
            this.Dark
        ];

        const index = colorModes.indexOf(colorModeString.toLowerCase());

        if (index === -1) {
            throw new Error("Color mode doesn't exist.");
        }

        return colorModes[index];
    }
}

class ThemedProperty {

    constructor(darkModeProperty, lightModeProperty) {
        this.__darkModeProperty = darkModeProperty;
        this.__lightModelProperty = lightModeProperty;
    }

    get(colorMode) {
        switch (colorMode) {

            case ColorMode.Dark:
                return this.__darkModeProperty;

            case ColorMode.Light:
                return this.__lightModelProperty;
        }
    }
}


class ConfigStore {

    constructor() {
        this.__config = {};
        this.__userConfig = {};
        this.__colorMode = ColorMode.Dark;
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
    get(composedProperty) {
      
        const propertyChain = composedProperty.split(".");
        
        const configValue = this.__getField(this.__config, propertyChain);
        const userConfigValue = this.__getField(this.__userConfig, propertyChain);
        
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
        
        if (configValue instanceof ThemedProperty) {
            configValue = configValue.get(this.__colorMode);
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
    return new ThemedProperty(dark, light);
}

module.exports = {
    ConfigStore,
    ColorMode,
    themed
};
