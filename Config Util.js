// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: cogs;

/**
 * Enumeration for color mode.
 *
 * @class ColorMode
 */
class ColorMode {

    static Light = "light";
    static Dark = "dark";

    /**
     * Used to get color mode based on
     * the provided string.
     *
     * @static
     * @param {String} colorModeString color mode as string
     * @return {ColorMode} color mode
     * @memberof ColorMode
     */
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


/**
 * Property with two values.
 * One is used for white mode and
 * another for dark mode.
 *
 * @class ThemedProperty
 */
class ThemedProperty {

    #darkModeProperty;
    #lightModeProperty;

    /**
     * Creates an instance of ThemedProperty.
     * 
     * @param {Object} darkModeProperty dark mode property
     * @param {Object} lightModeProperty light mode property
     * @memberof ThemedProperty
     */
    constructor(darkModeProperty, lightModeProperty) {
        this.#darkModeProperty = darkModeProperty;
        this.#lightModeProperty = lightModeProperty;
    }

    /**
     * Used to get value based on
     * the provided color mode.
     *
     * @param {ColorMode} colorMode color mode
     * @return {Object} value corresponding provided color mode
     * @memberof ThemedProperty
     */
    get(colorMode) {

        switch (colorMode) {
            case ColorMode.Dark:
                return this.#darkModeProperty;

            case ColorMode.Light:
                return this.#lightModeProperty;
        }
    }
}


/**
 * Main component.
 * Used to work with configurations.
 *
 * @class ConfigStore
 */
class ConfigStore {

    #config = {};
    #userConfig = {};
    #colorMode = ColorMode.Dark;

    /**
     * Used to set default config.
     *
     * @param {Object} config default config
     * @memberof ConfigStore
     */
    setConfig(config) {
        this.#config = config;
    }

    /**
     * Used to set user-provided config.
     *
     * @param {Object} config user-provided config
     * @memberof ConfigStore
     */
    overrideConfig(config) {

        if (config) {
            this.#userConfig = config;
        }
    }

    /**
     * Used to set color mode.
     *
     * @param {ColorMode} colorMode color mode
     * @memberof ConfigStore
     */
    setColorMode(colorMode) {
        this.#colorMode = colorMode;
    }

    /**
    * Used to return configuration value.
    * If value is present in config
    * provided by user, it would be used
    * otherwise default one will be returned.
    *
    * @param {String} composedProperty composed proeprty
    * @return {Object} user-provided or default configuration value
    */
    get(composedProperty) {
      
        const propertyChain = composedProperty.split(".");
        
        const configValue = this.#getField(this.#config, propertyChain);
        const userConfigValue = this.#getField(this.#userConfig, propertyChain);

        if (userConfigValue) {
            return userConfigValue;
        }

        return configValue;
    }

    /**
    * Used to get value from provided
    * configuration by iterating through 
    * property chain.
    *
    * @param {Object} config configuration
    * @param {List<String>} propertyChain list of configuration recursive properties
    * @return {Object} field from config
    */
    #getField(config, propertyChain) {

        let configValue = config;

        for (const property of propertyChain) {
          
            const nextValue = configValue[property];
          
            if (nextValue == undefined) {
                configValue = null;
                break;
            } 
        
            configValue = nextValue;
        }
        
        if (configValue instanceof ThemedProperty) {
            return configValue.get(this.#colorMode);
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
