// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: check-circle;

const { tr } = importModule("Localization");
const { FileUtil } = importModule("File Util");
const { modal, ModalRule, showWarning, showError } = importModule("Modal");
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

    if (selectedScript) {

        const tableBuilder = new FeaturesTable(selectedScript);
        const table = await tableBuilder.build();
        await table.present();
    }
}


class FeatureType {

    static Bool = "boolean";
    static Text = "string";
    static Number = "number";
}


class ScriptSelector {

    static async selectScript() {

        const debugDirectories = FileUtil.findFeatureDirectories()
            .sort();
        const actions = [];

        for (let directoryName of debugDirectories) {

            if (!FileUtil.featureFileExists(directoryName)) {
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

class FeaturesTable {

    static #FEATURE_NAME_FIELD = "featureName";
    static #FEATURE_STATE_FIELD = "__enabled";
    static #FEATUTE_TYPE_FIELD = "__type";
    static #FEATURE_VALUE_FIELD = "value";

    static #NUMBER_FEATURE_FALLBACK_VALUE = "123";

    #selectedScript;

    #featureNameDataField = new TextDataField(FeaturesTable.#FEATURE_NAME_FIELD, "feature");
    #featureStateDataField = new BoolDataField(FeaturesTable.#FEATURE_STATE_FIELD, false);
    #featureTypeDataField = new TextDataField(FeaturesTable.#FEATUTE_TYPE_FIELD, FeatureType.Number);
    #featureValueDataField = new TextDataField(FeaturesTable.#FEATURE_VALUE_FIELD, FeaturesTable.#NUMBER_FEATURE_FALLBACK_VALUE);

    constructor(selectedScript) {
        this.#selectedScript = selectedScript;
    }

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

    async #onFieldChange(feature, field, updatedValue, previousValue) {

        const featureType = feature[FeaturesTable.#FEATUTE_TYPE_FIELD];
        const featureValue = feature[FeaturesTable.#FEATURE_VALUE_FIELD];

        const isFeatureTypeField = field.getName() === FeaturesTable.#FEATUTE_TYPE_FIELD;
        const isFeatureValueField = field.getName() === FeaturesTable.#FEATURE_VALUE_FIELD;

        // Remove previous value when feature type changes to bool
        // we don't need a value for boolean fields since feature state
        // would be used as value.
        if (isFeatureTypeField && updatedValue === FeatureType.Bool) {
            feature[FeaturesTable.#FEATURE_VALUE_FIELD] = undefined;
        }

        // When type changes to number need to check whether value is
        // a number, if not then we should update feature value.
        if (isFeatureTypeField && updatedValue === FeatureType.Number) {

            // Don't validate only when user changes type to number
            // but set it to fallback value in case if current
            // value is not a number.
            if (!ModalRule.Number.validate(featureValue)) {
                feature[FeaturesTable.#FEATURE_VALUE_FIELD] = FeaturesTable.#NUMBER_FEATURE_FALLBACK_VALUE;
            }
        }

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

    #getFeatureValueFieldLabel(feature) {

        const isBool = feature[FeaturesTable.#FEATUTE_TYPE_FIELD] === FeatureType.Bool;

        if (isBool) {
            return tr("featureUI_boolFieldValuePlaceholder");
        }

        return feature[FeaturesTable.#FEATURE_VALUE_FIELD];
    }

    #getFeatureStateFieldLabel(feature) {
        return feature[FeaturesTable.#FEATURE_STATE_FIELD] ?
            tr("featureUI_featureStateOnLabel") : 
            tr("featureUI_featureStateOffLabel");
    }

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

    #retrieveDebugConfiguration() {

        const formattedData = [];
        const debugConfiguration = FileUtil.readFeatureFile(this.#selectedScript);
        let id = 1;

        for (let featureName of Object.keys(debugConfiguration)) {

            let feature = debugConfiguration[featureName];

            let featureValue = feature[FeaturesTable.#FEATURE_VALUE_FIELD];
            let featureState = feature[FeaturesTable.#FEATURE_STATE_FIELD];
            let featureType = feature[FeaturesTable.#FEATUTE_TYPE_FIELD];

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

    #getOnLocaleModificationCallback() {

        const that = this;

        return (featuresList) => {

            const featuresObject = {};

            for (let feature of featuresList) {
                
                let featureName = feature[FeaturesTable.#FEATURE_NAME_FIELD];
                let featureValue = feature[FeaturesTable.#FEATURE_VALUE_FIELD];
                let isEnabled = feature[FeaturesTable.#FEATURE_STATE_FIELD];
                let featureType = feature[FeaturesTable.#FEATUTE_TYPE_FIELD];

                if (featureType === FeatureType.Number) {
                    featureValue = Number(featureValue);
                }

                featuresObject[featureName] = {
                    [FeaturesTable.#FEATURE_VALUE_FIELD]: featureValue,
                    [FeaturesTable.#FEATURE_STATE_FIELD]: isEnabled,
                    [FeaturesTable.#FEATUTE_TYPE_FIELD]: featureType
                };
            }

            FileUtil.updateFeatureFile(that.#selectedScript, featuresObject);
        };
    }
}


await main();
Script.complete();