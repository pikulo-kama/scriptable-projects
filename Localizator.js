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

class ScriptSelector {

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

class LocalizatorTable {

    static __DEFAULT_LOCALE = "en";

    constructor(scriptName) {
        this.__scriptName = scriptName;
        this.__translations = [];
        this.__languageCode = this.__getLanguageCode();

        this.__translationValueField = new TextDataField("value");
    }

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

    __translationKeyToText(translationKey) {

        let keyParts = translationKey.split("_");
        let key = keyParts[keyParts.length - 1];

        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, character => character.toUpperCase());
    }
    
    __getLanguageCode() {
        
        const locale = Device.preferredLanguages()[0];
        return locale.substring(0, locale.indexOf('-'));
    }

    async __readTranslationFile() {

        const localeExists = FileUtil.localeExists(this.__scriptName, this.__languageCode);
        
        if (!localeExists) {
            
            let mainLocaleFile = FileUtil.readLocale(this.__scriptName, LocalizatorTable.__DEFAULT_LOCALE);
            await FileUtil.updateLocale(this.__scriptName, this.__languageCode, mainLocaleFile);
        }

        return FileUtil.readLocale(this.__scriptName, this.__languageCode);
    }
}

const selectedScript = await ScriptSelector.selectScript();

if (selectedScript) {

    const tableBuilder = new LocalizatorTable(selectedScript);
    const table = await tableBuilder.build();
    await table.present();
}
