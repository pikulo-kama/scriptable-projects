// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: cogs;

const root = {
    store: {
        colorMode: "dark",
        config: {},
        userConfig: {}
    },
    
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
    getField: (c, fArr) => {
        configValue = c
        for (field of fArr) {
          let nextValue = configValue[field]
          
          if (nextValue == undefined) {
            configValue = null
            break
          }
        
          configValue = nextValue
        }
        
        if (Array.isArray(configValue) &&
          configValue.length == 2 &&
            configValue[0].hasOwnProperty("cnfgDark") &&
            configValue[1].hasOwnProperty("cnfgLight")) {
          
          configValue = root.store.colorMode == "dark" ?
            configValue[0].cnfgDark : configValue[1].cnfgLight
        }
        
        return configValue
    },
    
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
    conf: fieldStr => {
      
      const fieldArr = fieldStr.split(".")
      
      const configValue = root.getField(root.store.config, fieldArr)
      const userConfigValue = root.getField(root.store.userConfig, fieldArr)
      
      return userConfigValue != null 
        ? userConfigValue : configValue
    },
    
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
    get: (dark, light) => [{cnfgDark: dark}, {cnfgLight: light}]
}


module.exports.store = root.store
module.exports.conf = root.conf
module.exports.get = root.get
