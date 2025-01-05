// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: language;

const { FileUtil } = importModule("File Util");

class Locale {

    static __DEFAULT_LOCALE = "en";
    static __translations = null;

    static tr(key, args) {
        this.__ensureTranslationsLoaded();
        let translation = this.__translations[key];

        if (!translation) {
            console.warn(`Translation with key '${key}' doesn't exist.`);
            return "";
        }

        for (let argId = 0; argId < args.length; argId++) {
            translation = translation.replaceAll(`%${argId + 1}`, args[argId]);
        }

        return translation;
    }

    static __ensureTranslationsLoaded() {

        if (this.__translations) {
            return;
        }

        this.__translations = {};
        const languageCode = this.__getLanguageCode();
        const localeDirectories = FileUtil.findLocaleDirectories();
        
        for (let directory of localeDirectories) {

            let localeContent = {};
            const customLocaleExists = FileUtil.localeExists(directory, languageCode);
            const defaultLocaleExists = FileUtil.localeExists(directory, this.__DEFAULT_LOCALE);

            if (customLocaleExists) {
                localeContent = FileUtil.readLocale(directory, languageCode);
            
            } else if (defaultLocaleExists) {
                localeContent = FileUtil.readLocale(directory, this.__DEFAULT_LOCALE);
            }

            this.__translations = {
                ...this.__translations,
                ...localeContent
            };
        }
    }
    
    static __getLanguageCode() {
        
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
