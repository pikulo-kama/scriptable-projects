// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: check-circle;

const { modal, ModalRule, showWarning, showError } = importModule("Modal");
const { Files } = importModule("Files");
const { tr } = importModule("Localization");
const {
    BoolDataField,
    TextDataField,
    UIForm,
    UIFormAction,
    UIDeleteRowField,
    UIFormField,
    UIDataTable
} = importModule("CRUD Module");


/**
 * ENTRY POINT
 */
async function main() {
    
    const selectedScript = await ScriptSelector.selectScript();

    if (!selectedScript) {
        return;
    }

    const tableBuilder = new FeaturesTable(selectedScript);
    const table = await tableBuilder.build();

    await table.present();
}


/**
 * Enum for feature type.
 *
 * @class FeatureType
 */
class FeatureType {

    /**
     * Boolean type features.
     * These don't have values
     * only feature state should be used.
     *
     * @static
     * @memberof FeatureType
     */
    static Bool = "boolean";

    /**
     * Text type features.
     * Can have both state and value.
     *
     * @static
     * @memberof FeatureType
     */
    static Text = "string";

    /**
     * Number type features.
     * Can have both state and value,
     * value should be positive number.
     *
     * @static
     * @memberof FeatureType
     */
    static Number = "number";
}


/**
 * Used to select script for which
 * features should be created/modified.
 *
 * @class ScriptSelector
 */
class ScriptSelector {

    /**
     * Used to select script for which features
     * should be created/modified.
     *
     * @static
     * @return {String} name of the selected script
     * @memberof ScriptSelector
     */
    static async selectScript() {

        const actions = [];
        const debugDirectories = Files.findFeatureDirectories().sort();

        for (const directoryName of debugDirectories) {

            if (!Files.featureFileExists(directoryName)) {
                console.warn(`Script ${directoryName} doesn't have debug configuration.`);
                continue;
            }

            actions.push(directoryName);
        }

        if (actions.length == 0) {
            await showWarning(tr("featureUI_noScriptsWithFeatureFileWarning"));
            return;
        }

        const result = await modal()
            .title(tr("featureUI_scriptSelectionModalTitle"))
            .actions(actions)
            .present();

        if (result.isCancelled()) {
            return;
        }

        return result.choice();
    }
}


/**
 * Main component.
 * Responsible for creating and
 * maintaining features UI table.
 *
 * @class FeaturesTable
 */
class FeaturesTable {

    static #FEATURE_NAME_FIELD = "featureName";
    static #FEATURE_STATE_FIELD = "__enabled";
    static #FEATUTE_TYPE_FIELD = "__type";
    static #FEATURE_VALUE_FIELD = "value";

    static #NUMBER_FEATURE_FALLBACK_VALUE = "123";
    static #CONFIG_FEATURE_INDICATOR = ".";

    #selectedScript;

    #featureNameDataField = new TextDataField(FeaturesTable.#FEATURE_NAME_FIELD, "feature");
    #featureStateDataField = new BoolDataField(FeaturesTable.#FEATURE_STATE_FIELD, false);
    #featureTypeDataField = new TextDataField(FeaturesTable.#FEATUTE_TYPE_FIELD, FeatureType.Number);
    #featureValueDataField = new TextDataField(FeaturesTable.#FEATURE_VALUE_FIELD, FeaturesTable.#NUMBER_FEATURE_FALLBACK_VALUE);

    /**
     * Creates an instance of FeaturesTable.
     * 
     * @param {String} selectedScript script name for which feature table should be presented
     * @memberof FeaturesTable
     */
    constructor(selectedScript) {
        this.#selectedScript = selectedScript;
    }

    /**
     * Used to build UI data table.
     *
     * @return {UIDataTable} UI table
     * @memberof FeaturesTable
     */
    async build() {

        const dataFields = [
            this.#featureNameDataField,
            this.#featureStateDataField,
            this.#featureTypeDataField,
            this.#featureValueDataField
        ];

        const table = new UIDataTable();
        table.title = tr("featureUI_tableTitle", this.#selectedScript);
        table.rowHeight = 55;

        table.allowCreation();
        table.showSeparators();

        table.setTableData(this.#retrieveDebugConfiguration());
        table.onDataModification(this.#getOnLocaleModificationCallback());
        table.onFieldChange(this.#onFieldChange);

        table.setDataFields(dataFields);
        table.setUIFields(this.#getUIFields());

        return table;
    }

    /**
     * Callback function that is invoked
     * each time feature is being modified.
     * 
     * @param {Object} feature JSON with feature data
     * @param {DataField} field field that was modified
     * @param {String} updatedValue new value of field
     * @param {String} previousValue previous value of field
     */
    async #onFieldChange(feature, field, updatedValue, previousValue) {

        const featureType = feature[FeaturesTable.#FEATUTE_TYPE_FIELD];
        const featureValue = feature[FeaturesTable.#FEATURE_VALUE_FIELD];
        const featureName = feature[FeaturesTable.#FEATURE_NAME_FIELD];

        const isFeatureTypeField = field.getName() === FeaturesTable.#FEATUTE_TYPE_FIELD;
        const isFeatureValueField = field.getName() === FeaturesTable.#FEATURE_VALUE_FIELD;
        const isFeatureNameField = field.getName() === FeaturesTable.#FEATURE_NAME_FIELD;
        const isFeatureStateField = field.getName() === FeaturesTable.#FEATURE_STATE_FIELD;

        const isConfigFeature = (name) => name.startsWith(FeaturesTable.#CONFIG_FEATURE_INDICATOR);

        // Config features should always be enabled.
        if (isFeatureNameField && isConfigFeature(updatedValue)) {
            feature[FeaturesTable.#FEATURE_STATE_FIELD] = true;
        }

        // Show an erorr during attempt to change state of config feature.
        if (isFeatureStateField && isConfigFeature(featureName)) {
            showError(tr("featureUI_cannotChangeConfigFeatureStateMessage"));
            feature[FeaturesTable.#FEATURE_STATE_FIELD] = true;
        }

        // Remove previous value when feature type changes to bool
        // we don't need a value for boolean fields since feature state
        // would be used as value.
        if (isFeatureTypeField && updatedValue === FeatureType.Bool) {
            feature[FeaturesTable.#FEATURE_VALUE_FIELD] = undefined;
        }

        // When type changes to number need to check whether value is
        // a number, if not then we should update feature value.
        // Don't validate only when user changes type to number
        // but set it to fallback value in case if current
        // value is not a number.
        if (isFeatureTypeField && 
            updatedValue === FeatureType.Number &&
            !ModalRule.Number.validate(featureValue)
        ) {
            feature[FeaturesTable.#FEATURE_VALUE_FIELD] = FeaturesTable.#NUMBER_FEATURE_FALLBACK_VALUE;
        }

        // Show an error and remove feature value during attempt
        // to modify value for boolean features.
        if (isFeatureValueField && featureType === FeatureType.Bool) {
            showError(tr("featureUI_cannotModifyValueForBoolFeature"));
            feature[FeaturesTable.#FEATURE_VALUE_FIELD] = undefined;
        }

        // When number feature value changes validate if it's a
        // number, if it's not then change value to previous and
        // show an error to the user.
        if (isFeatureValueField && 
            featureType === FeatureType.Number && 
            !ModalRule.Number.validate(updatedValue)
        ) {
            showError(tr("featureUI_invalidNumberValueErrorMessage"));
            feature[FeaturesTable.#FEATURE_VALUE_FIELD] = previousValue;
        }
    }

    /**
     * Used to get list of UI fields for the table.
     * 
     * @returns {List<UIField>} list of UI fields
     */
    #getUIFields() {

        // Feature Enabled Field
        const featureEnabledUIField = new UIForm(this.#getFeatureStateFieldLabel, 20);
        featureEnabledUIField.setFormTitleFunction(() => tr("featureUI_swapStateConfirmMessage"));
        const swapStateAction = new UIFormAction(tr("featureUI_swapStateActionName"));
        swapStateAction.addCallback(this.#featureStateDataField, (feature) => 
            !feature[FeaturesTable.#FEATURE_STATE_FIELD]
        );

        featureEnabledUIField.addFormAction(swapStateAction);

        // Feature Type Field
        const featureTypeUIField = new UIForm(this.#getFeatureTypeFieldLabel, 20);
        featureTypeUIField.setFormTitleFunction(() => tr("featureUI_featureTypeChangeTypeFormMessage"));

        const changeToTextAction = new UIFormAction(tr("featureUI_changeTypeToTextAction"));
        const changeToBoolAction = new UIFormAction(tr("featureUI_changeTypeToBoolAction"));
        const changeToNumberAction = new UIFormAction(tr("featureUI_changeTypeToNumberAction"));

        changeToTextAction.addCallback(this.#featureTypeDataField, (feature) => 
            feature[FeaturesTable.#FEATUTE_TYPE_FIELD] = FeatureType.Text
        );

        changeToBoolAction.addCallback(this.#featureTypeDataField, (feature) => 
            feature[FeaturesTable.#FEATUTE_TYPE_FIELD] = FeatureType.Bool
        );

        changeToNumberAction.addCallback(this.#featureTypeDataField, (feature) => 
            feature[FeaturesTable.#FEATUTE_TYPE_FIELD] = FeatureType.Number
        );

        featureTypeUIField.addFormAction(changeToTextAction);
        featureTypeUIField.addFormAction(changeToBoolAction);
        featureTypeUIField.addFormAction(changeToNumberAction);

        // Feature Name Field
        const featureNameUIField = new UIForm((feature) => feature.featureName, 70);
        featureNameUIField.setFormTitleFunction(() => tr("featureUI_changeFeatureNameModalTitle"));
        const featureNameFormField = new UIFormField(this.#featureNameDataField, tr("featureUI_featureNameFormFieldPlaceholder"));

        featureNameUIField.addDefaultAction(tr("featureUI_featureNameValueUpdateAction"));
        featureNameUIField.addFormField(featureNameFormField);

        // Feature Value Field
        const featureValueUIField = new UIForm(this.#getFeatureValueFieldLabel, 70);
        featureValueUIField.setFormTitleFunction(() => tr("featureUI_changeFeatureValueModalTitle"));
        featureValueUIField.centerAligned();
        const featureValueFormField = new UIFormField(this.#featureValueDataField, tr("featureUI_featureValueFormFieldPlaceholder"));

        featureValueUIField.addDefaultAction(tr("featureUI_featureNameValueUpdateAction"));
        featureValueUIField.addFormField(featureValueFormField);

        // Delete field
        const deleteUIField = new UIDeleteRowField(() => tr("featureUI_removeFeatureFieldLabel"), 15);
        deleteUIField.setMessage(tr("featureUI_removeFeatureConfirmationMessage"));

        return [
            featureEnabledUIField,
            featureTypeUIField,
            featureNameUIField,
            featureValueUIField,
            deleteUIField
        ];
    }

    /**
     * Used to get label for feature value UI field.
     * 
     * @param {Object} feature JSON with feature data
     * @returns 
     */
    #getFeatureValueFieldLabel(feature) {

        const isBool = feature[FeaturesTable.#FEATUTE_TYPE_FIELD] === FeatureType.Bool;

        if (isBool) {
            return tr("featureUI_boolFieldValuePlaceholder");
        }

        return feature[FeaturesTable.#FEATURE_VALUE_FIELD];
    }

    /**
     * Used to get label for feature toggle state UI field.
     * 
     * @param {Object} feature JSON with feature data
     * @returns 
     */
    #getFeatureStateFieldLabel(feature) {

        const featureName = feature[FeaturesTable.#FEATURE_NAME_FIELD];

        if (featureName.startsWith(FeaturesTable.#CONFIG_FEATURE_INDICATOR)) {
            return tr("featureUI_configFeatureStateLabel");
        }

        return feature[FeaturesTable.#FEATURE_STATE_FIELD] ?
            tr("featureUI_featureStateOnLabel") : 
            tr("featureUI_featureStateOffLabel");
    }

    /**
     * Used to get label for feature toggle type UI field.
     * 
     * @param {Object} feature JSON with feature data
     * @returns 
     */
    #getFeatureTypeFieldLabel(feature) {

        switch (feature[FeaturesTable.#FEATUTE_TYPE_FIELD]) {

            case FeatureType.Text:
                return tr("featureUI_featureTypeTextLabel");

            case FeatureType.Bool:
                return tr("featureUI_featureTypeBoolLabel");

            case FeatureType.Number:
                return tr("featureUI_featureTypeNumberLabel")
        }
    }

    /**
     * Used to read script's feature file and
     * then format it so CRUD Module will be able 
     * to operate with data.
     * 
     * @returns {List<Object>} list of feature records
     */
    #retrieveDebugConfiguration() {

        const formattedData = [];
        const debugConfiguration = Files.readFeatureFile(this.#selectedScript);
        let id = 1;

        for (const featureName of Object.keys(debugConfiguration)) {

            const feature = debugConfiguration[featureName];

            let featureValue = feature[FeaturesTable.#FEATURE_VALUE_FIELD];
            const featureState = feature[FeaturesTable.#FEATURE_STATE_FIELD];
            const featureType = feature[FeaturesTable.#FEATUTE_TYPE_FIELD];

            if (featureValue !== undefined) {
                featureValue = String(featureValue);
            }

            formattedData.push({
                id: id++,
                [FeaturesTable.#FEATURE_NAME_FIELD]: featureName,
                [FeaturesTable.#FEATURE_VALUE_FIELD]: featureValue,
                [FeaturesTable.#FEATURE_STATE_FIELD]: featureState,
                [FeaturesTable.#FEATUTE_TYPE_FIELD]: featureType
            });
        }

        return formattedData;
    }

    /**
     * Used to get callback function which is
     * triggered when any changes in UI table were made.
     * 
     * Will transform data from list to single object
     * and then persist it into features storage.
     * 
     * @returns {Function} callback function
     */
    #getOnLocaleModificationCallback() {
        
        const callback = (featuresList) => {

            const featuresObject = {};

            for (const feature of featuresList) {
                
                const featureName = feature[FeaturesTable.#FEATURE_NAME_FIELD];
                let featureValue = feature[FeaturesTable.#FEATURE_VALUE_FIELD];
                const isEnabled = feature[FeaturesTable.#FEATURE_STATE_FIELD];
                const featureType = feature[FeaturesTable.#FEATUTE_TYPE_FIELD];

                if (featureType === FeatureType.Number) {
                    featureValue = Number(featureValue);
                }

                featuresObject[featureName] = {
                    [FeaturesTable.#FEATURE_VALUE_FIELD]: featureValue,
                    [FeaturesTable.#FEATURE_STATE_FIELD]: isEnabled,
                    [FeaturesTable.#FEATUTE_TYPE_FIELD]: featureType
                };
            }

            Files.updateFeatureFile(this.#selectedScript, featuresObject);
        };

        return callback.bind(this);
    }
}


await main();
Script.complete();
