// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: cogs;
const test = importModule("Testing Library")
const assert = importModule("Assertions")
const configUtil = importModule("Config Util")

test.beforeEach(() => {
    configUtil.store.config = {
        "A": "test",
        "S": configUtil.get("d", "l"),
        "groupA": {
            "C": 1,
            "D": "B",
            "groupB": {
                "E": 0
            }
        }
    }
})

test.describe("Config Util", () => {
    
    test.it("Should get property from config", () => {
        
        let configValue = configUtil.conf("A")
        assert.assertEquals("test", configValue)
    })
    
    test.it("Should get nested property from config", () => {
        
        let secondLevelProperty = configUtil.conf("groupA.C")
        let thirdLevelProperty = configUtil.conf("groupA.groupB.E")
        
        assert.assertEquals(1, secondLevelProperty)
        assert.assertEquals(0, thirdLevelProperty)
    })
    
    test.it("Should get property from user config if present", () => {
        
        configUtil.store.userConfig = {
            "A": "best"
        }
        
        let overridenPropery = configUtil.conf("A")
        let defaultProperty = configUtil.conf("groupA.D")
        
        assert.assertEquals("best", overridenPropery)
        assert.assertEquals("B", defaultProperty)
    })
    
    test.it("Should get value based on color mode", () => {
        
        // Dark mode by default
        assert.assertEquals("d", configUtil.conf("S"))
        
        configUtil.store.colorMode = "light"
        
        assert.assertEquals("l", configUtil.conf("S"))
    })
})
