// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: language;

const { FileUtil } = importModule("File Util");

/**
 * Helper class used to get translations
 * for the key based on the current system language.
 *
 * @class Locale
 */
class Locale {

    static #DEFAULT_LOCALE = "en";
    static #translations = null;

    /**
     * Used to retrieve translation for provided key 
     * based on the current system language.
     *
     * @static
     * @param {String} key text resource key
     * @param {String} args text resource argument list
     * @return {String} translation corresponding provided key
     * @memberof Locale
     */
    static tr(key, args) {
        this.#ensureTranslationsLoaded();
        let translation = this.#translations[key];

        if (translation === undefined) {
            console.warn(`Translation with key '${key}' doesn't exist.`);
            return "";
        }

        // Update all value placeholders.
        for (let argId = 0; argId < args.length; argId++) {
            translation = translation.replaceAll(`%${argId + 1}`, args[argId]);
        }

        return translation;
    }

    /**
     * Loads all available translations
     * for user locale (or default - en - if doesn't exists).
     * 
     * This is invoked only once after that all translations
     * would be in memory until script is completed or stopped.
     *
     * @static
     * @memberof Locale
     */
    static #ensureTranslationsLoaded() {

        if (this.#translations) {
            return;
        }

        this.#translations = {};
        const languageCode = this.#getLanguageCode();
        const localeDirectories = FileUtil.findLocaleDirectories();
        
        for (let directory of localeDirectories) {

            let localeContent = {};
            const customLocaleExists = FileUtil.localeExists(directory, languageCode);
            const defaultLocaleExists = FileUtil.localeExists(directory, this.#DEFAULT_LOCALE);

            if (customLocaleExists) {
                localeContent = FileUtil.readLocale(directory, languageCode);
            
            } else if (defaultLocaleExists) {
                localeContent = FileUtil.readLocale(directory, this.#DEFAULT_LOCALE);
            }

            this.#translations = {
                ...this.#translations,
                ...localeContent
            };
        }
    }
    
    /**
     * Used to get current system
     * language code.
     * 
     * Value is taken by analyzing user preferred
     * languages.
     *
     * @static
     * @return {String} language code
     * @memberof Locale
     */
    static #getLanguageCode() {
        
        const locale = Device.preferredLanguages()[0];
        return locale.substring(0, locale.indexOf('-'));
    }
}


function tr(key, ...args) {
    return Locale.tr(key, args);
}


module.exports = {
    tr
};
