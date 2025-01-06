// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: globe;

const { FileUtil } = importModule("File Util");
const { modal, ModalRule } = importModule("Modal");
const { tr } = importModule("Localization");

const {
    UIDataTable,
    TextDataField,
    UIFormReadOnly,
    UIForm,
    UIFormField
} = importModule("CRUD Module");


/**
 * ENTRY POINT
 */
async function main() {

    const selectedScript = await ScriptSelector.selectScript();

    if (selectedScript) {

        const tableBuilder = new LocalizatorTable(selectedScript);
        const table = await tableBuilder.build();
        await table.present();
    }
}


/**
 * Used to select script for localization.
 *
 * @class ScriptSelector
 */
class ScriptSelector {

    /**
     * Used to select script for localization.
     *
     * @static
     * @return {Promise<String>} promise with script name
     * @memberof ScriptSelector
     */
    static async selectScript() {

        const result = await modal()
            .title(tr("localizator_scriptSelectionModalTitle"))
            .actions(FileUtil.findLocaleDirectories())
            .present();

        if (result.isCancelled()) {
            return null;
        }
        
        return result.choice();
    }
}


/**
 * Used to build and maintain localization UI table.
 *
 * @class LocalizatorTable
 */
class LocalizatorTable {

    static __DEFAULT_LOCALE = "en";

    /**
     * Creates an instance of LocalizatorTable.
     * @param {String} scriptName name of script which translations should be updated
     * @memberof LocalizatorTable
     */
    constructor(scriptName) {
        this.__scriptName = scriptName;
        this.__translations = [];
        this.__languageCode = this.__getLanguageCode();

        this.__translationValueField = new TextDataField("value");
    }

    /**
     * Used to build UI table 
     * which should be used for translation
     * update.
     *
     * @return {Promise<UITable>} promise of the UI table
     * @memberof LocalizatorTable
     */
    async build() {

        const table = new UIDataTable();
        table.title = tr("localizator_tableTitle", this.__languageCode, this.__scriptName);
        table.rowHeight = 55;

        table.setTableData(await this.__loadTranslations());
        table.onDataModification(this.__getOnLocaleModificationCallback());

        table.setDataFields([this.__translationValueField]);
        table.setUIFields(this.__getUIFields());

        table.setSortingFunction((first, second) => {

            if (first.key < second.key) {
                return -1;
            }

            if (first.key > second.key) {
                return 1;
            }

            return 0;
        })

        return table;
    }

    /**
     * Used to get list of UI table column
     * configurations. These are needed to
     * configure UI data table.
     *
     * @return {List<UIField>} 
     * @memberof LocalizatorTable
     */
    __getUIFields() {
        
        // Translation Key Field
        const translationKeyUIField = new UIFormReadOnly((translation) => translation.label, 50);

        // Translation Value Field
        const translationValueUIField = new UIForm((translation) => translation.value, 50);
        translationValueUIField.setFormTitleFunction((translation) => 
            tr("localizator_translationValueFormTitle", translation.label)
        );
        translationValueUIField.rightAligned();

        const translationValueFormField = new UIFormField(
            this.__translationValueField,
            tr("localizator_translationFormFieldTitle")
        );

        translationValueFormField.addRule(ModalRule.NotEmpty);
        translationValueUIField.addDefaultAction(tr("localizator_translationValueUpdateActionName"));
        translationValueUIField.addFormField(translationValueFormField);

        return [
            translationKeyUIField,
            translationValueUIField
        ];
    }

    /**
     * Used to get onSave callback for UI table.
     * 
     * Before saving changes will transform list data
     * into single object with translations.
     *
     * @return {Function} onSave table callback
     * @memberof LocalizatorTable
     */
    __getOnLocaleModificationCallback() {

        const that = this;

        return (translationList) => {
            const translationsObject = {};

            for (let translation of translationList) {
                translationsObject[translation.key] = translation.value;
            }

            FileUtil.updateLocale(that.__scriptName, that.__languageCode, translationsObject);
        };
    }

    /**
     * Used to read translations from storage
     * and then transform then into list so that
     * table will be able to work with data in
     * tabular format.
     *
     * @return {List<Object>} translations as list
     * @memberof LocalizatorTable
     */
    async __loadTranslations() {

        const translationList = [];
        const translations = await this.__readTranslationFile();
        // Needed so table will not create a sequence
        // which we don't need.
        let id = 1;

        for (let translationKey of Object.keys(translations)) {
            
            translationList.push({
                id: id++,
                key: translationKey,
                value: translations[translationKey],
                label: this.__translationKeyToText(translationKey)
            });
        }

        return translationList;
    }

    /**
     * Will transform translation key
     * to readeable text by stripping script
     * prefix and swapping camelCase to regular
     * text.
     * 
     * Example: testScript_translateKeyToText -> Translate Key To Text
     *
     * @param {String} translationKey translation key to transform
     * @return {String} transformed translation key
     * @memberof LocalizatorTable
     */
    __translationKeyToText(translationKey) {

        let keyParts = translationKey.split("_");
        let key = keyParts[keyParts.length - 1];

        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, character => character.toUpperCase());
    }
    
    /**
     * Used to get current system
     * language code.
     * 
     * Value is taken by analyzing user preferred
     * languages.
     *
     * @return {String} language code
     * @memberof Localizator
     */
    __getLanguageCode() {
        
        const locale = Device.preferredLanguages()[0];
        return locale.substring(0, locale.indexOf('-'));
    }

    /**
     * Used to read and store translation file using
     * selected script and system language.
     * 
     * If file doesn't exists new one would be created
     * using 'en' locale translation as template.
     *
     * @return {Object} translations object
     * @memberof LocalizatorTable
     */
    async __readTranslationFile() {

        const localeExists = FileUtil.localeExists(this.__scriptName, this.__languageCode);
        
        if (!localeExists) {
            
            let mainLocaleFile = FileUtil.readLocale(this.__scriptName, LocalizatorTable.__DEFAULT_LOCALE);
            await FileUtil.updateLocale(this.__scriptName, this.__languageCode, mainLocaleFile);
        }

        return FileUtil.readLocale(this.__scriptName, this.__languageCode);
    }
}


await main();
Script.complete();
