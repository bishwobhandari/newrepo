import {observable, action, computed, toJS} from "mobx";
import _ from "lodash";

class DataStore {
    @observable config = {};
    @observable modal = false;
    @observable modelDetailModal = false;

    @observable showForm = false;
    @observable dataFormType = "";
    @observable executionOutputs = null;

    @observable prior_weight = 0;
    @observable prior_weight_models = [];

    @observable savedDataset = [];

    @action saveOptions = (name, value, id) => {
        this.usersInput.options[id][name] = value;
    };

    @action deleteOptions = val => {
        this.usersInput.options.splice(val, 1);
    };

    @action deleteDataRow = val => {
        this.inputForm.datasets.splice(val, 1);
    };

    @action saveRowData = (name, value, id) => {
        console.log(name, value, id);
        if (isNaN(value)) {
            this.inputForm[name] = value;
        } else {
            this.inputForm.datasets[id][name] = value;
        }

        console.log("dfs", toJS(this.inputForm));
    };

    @action saveDataset() {
        var output = {};
        this.inputForm.datasets.forEach(newset => {
            for (var prop in newset) {
                if (prop in newset) {
                    if (!(prop in output)) {
                        output[prop] = [];
                    }
                }
                output[prop].push(newset[prop]);
            }
        });
        output["dataset_name"] = this.inputForm.dataset_name;
        output["dataset_description"] = this.inputForm.dataset_description;
        output["id"] = this.savedDataset.length;
        output["enabled"] = false;
        output["model_type"] = this.dataFormType;
        this.savedDataset.push(output);
    }

    @action saveAdverseDirection = (name, value, id) => {
        this.savedDataset.map((item, i) => {
            if (item.id == id) {
                item[name] = value;
            }
        });
    };

    @action deleteDataset = id => {
        var index = this.savedDataset.findIndex(item => item.id == id);

        if (index > -1) {
            this.savedDataset.splice(index, 1);
        }
    };

    @action updateDataset(setId, name, value, id) {
        this.savedDataset[setId][name][id] = value;
    }

    @action toggleDataset = idx => {
        var obj = this.savedDataset.find(item => item.id == idx);
        obj["enabled"] = !obj["enabled"];
    };

    @action deleteForm() {
        this.inputForm.datasets = [];
        this.inputForm.model_type = "";
        this.inputForm.dataset_name = "";
    }

    @action toggleModal() {
        this.modal = !this.modal;
    }

    @observable output = {};
    @observable goodnessFit = {};
    @observable cdfValues = [];
    @observable infoTable = {
        model_name: "",
        dataset_name: "",
        user_notes: "",
        dose_response_model: "",
    };
    @observable optionSettings = {}
    
    @observable modelData = {
        dependent_variable: "",
        independent_variable: "",
        number_of_observations: "",
    };
    @observable benchmarkDose = {
        bmd: "",
        bmdl: "",
        bmdu: "",
        aic: "",
        p_value: "",
        df: "",
        chi_square: "",
    };

    @observable bmrType={
        1:"Extra Risk",
        2:"Added Risk"
    }

    @action toggleModelDetailModal(output, model_index) {
        this.modelDetailModal = !this.modelDetailModal;
        if (this.modelDetailModal) {
            this.mapOutputModal(output, model_index);
        }
    }

    @action.bound
    mapOutputModal(output, model_index) {
        let selectedModel = output.models.find(row => row.model_index == model_index);

        //unpack infoTable data
        this.infoTable.model_name = selectedModel.model_name;
        this.infoTable.dataset_name = output.dataset.dataset_name;
        this.infoTable.user_notes = output.dataset.dataset_description;
        this.infoTable.dose_response_model = this.getResponseModel;

        //unpack model Options
        delete selectedModel.settings['degree']
        this.optionSettings =  selectedModel.settings
        this.optionSettings=this.getmodelOptions;


        //unpack model_data
        this.modelData.dependent_variable = "Dose";
        this.modelData.independent_variable = "Response";
        this.modelData.number_of_observations = selectedModel.results.gof.n;

        //unpack benchmark dose
        this.benchmarkDose.bmd = selectedModel.results.bmd;
        this.benchmarkDose.bmdl = selectedModel.results.bmdl;
        this.benchmarkDose.bmdu = selectedModel.results.bmdu;
        this.benchmarkDose.aic = selectedModel.results.aic;
        this.benchmarkDose.p_value = selectedModel.results.gof.p_value;
        this.benchmarkDose.df = selectedModel.results.gof.df;
        this.benchmarkDose.chi_square = selectedModel.results.gof.chi_square;

        //godness of fit
        this.goodnessFit = selectedModel.results.gof.rows;

        let percentileValue = _.range(0.01, 1, [(step = 0.01)]);
        let cdf = selectedModel.results.cdf;
        pValue = percentileValue.map(function(each_element) {
            return Number(each_element.toFixed(2));
        });

        this.cdfValues = _.zipWith(pValue, cdf, (pValue, cdf) => ({pValue, cdf}));
    }
    @computed get getResponseModel() {
        switch (this.infoTable.model_name) {
            case "Dichotomous-Hill":
                return "P[dose] = g +(v-v*g)/[1+exp(-a-b*Log(dose))]";
            case "Gamma":
                return "P[dose]= g+(1-g)*CumGamma[b*dose,a]";
        }
    }

    @computed get getmodelOptions(){
        let bmrTypeValue=this.optionSettings.bmrType
        this.optionSettings.bmrType=this.bmrType
        return this.optionSettings
    }

    @action addUsersInput = (name, value) => {
        this.usersInput[name] = value;
    };

    @action setConfig = config => {
        this.config = config;
    };

    @action toggleModelsCheckBox = (model, checked, value) => {
        let models = this.getModelTypeList();

        if (model.includes("bayesian_model_average") && checked) {
            this.prior_weight_models.push(model);
        } else if (model.includes("bayesian_model_average") && !checked) {
            let index = this.prior_weight_models.indexOf(model);
            this.prior_weight_models.splice(index, 1);
        }

        if (this.prior_weight_models.length) {
            this.prior_weight = 100;
            this.prior_weight = this.prior_weight / this.prior_weight_models.length;
        }
        models.map(item => {
            item.values.map(val => {
                if (val.name === model && val.isChecked != checked) {
                    val.isChecked = !val.isChecked;
                } else if (
                    model.split("-")[1] == "All" &&
                    model.split("-")[0] == val.name.split("-")[0] &&
                    !val.isDisabled &&
                    val.isChecked != checked
                ) {
                    val.isChecked = !val.isChecked;
                }

                if (this.prior_weight_models.includes(val.name)) {
                    val.prior_weight = this.prior_weight;
                } else if (
                    val.name.includes("bayesian_model_average") &&
                    !this.prior_weight_models.includes(val.name)
                ) {
                    val.prior_weight = 0;
                }
            });
        });
    };

    //returns the dataset which are enabled
    @computed get getEnabledDataset() {
        let obj = toJS(this.savedDataset).filter(item => item.enabled == true);
        return obj;
    }

    //returns enabled model types
    @computed get getModels() {
        let result = {};
        let models = toJS(this.getModelTypeList());

        models.map(item => {
            item.values.map(val => {
                if (val.isChecked) {
                    var [k, v] = val.name.split("-");
                    if (v === "DichotomousHill") {
                        v = "Dichotomous-Hill";
                    }
                    if (k in result) {
                        if (k === "bayesian_model_average") {
                            result[k] = result[k].concat({
                                model: v,
                                prior_weight: parseFloat(val.prior_weight) / 100,
                            });
                        } else {
                            result[k] = result[k].concat(v);
                        }
                    } else {
                        if (k === "bayesian_model_average") {
                            result[k] = [
                                {model: v, prior_weight: parseFloat(val.prior_weight) / 100},
                            ];
                        } else {
                            result[k] = [v];
                        }
                    }
                }
            });
        });

        return result;
    }

    @action
    async saveAnalysis() {
        const url = this.config.editSettings.patchInputUrl,
            getPayload = () => {
                return {
                    editKey: this.config.editSettings.editKey,
                    partial: true,
                    data: {
                        bmds_version: "BMDS312",
                        analysis_name: this.usersInput.analysis_name,
                        analysis_description: this.usersInput.analysis_description,
                        dataset_type: this.usersInput.dataset_type,
                        models: this.getModels,
                        datasets: this.getEnabledDataset,
                        options: this.usersInput.options,
                    },
                };
            };

        await fetch(url, {
            method: "PATCH",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(getPayload()),
        })
            .then(response => {
                if (response.ok) {
                    response.json().then(data => this.updateModelStateFromApi(data));
                } else {
                    this.mainModal = !this.mainModal;
                    response.json().then(data => (this.modalMessage = data));
                }
            })
            .catch(error => {
                this.mainModal = !this.mainModal;
                this.modalMessage = error;
            });
    }

    @observable modalMessage = "";

    @observable mainModal = false;

    @action.bound
    updateModelStateFromApi(data) {
        const inputs = data.inputs;
        if (_.isEmpty(inputs)) {
            return;
        }

        this.isExecuting = data.is_executing;
        console.log("before isready to ");
        this.isReadyToExecute = data.inputs_valid;
        console.log("is ready to after ", this.isReadyToExecute);
        if (data.outputs) {
            this.executionOutputs = data.outputs.outputs;
        }

        // unpack general settings
        this.usersInput.analysis_name = inputs.analysis_name;
        this.usersInput.analysis_description = inputs.analysis_description;
        this.usersInput.dataset_type = inputs.dataset_type;
        this.usersInput.options = inputs.options;

        // unpack datasets
        this.savedDataset = inputs.datasets;

        // unpack selected models
        let modelArr = [];
        Object.keys(inputs.models).map((item, i) => {
            inputs.models[item].map((val, index) => {
                if (item === "bayesian_model_average") {
                    val = val.model;
                }
                if (val == "Dichotomous-Hill") {
                    let [k, v] = val.split("-");
                    val = k + v;
                }
                val = item + "-" + val;
                modelArr.push(val);
            });
        });
        modelArr.forEach((item, i) => {
            let checked = true;
            let value = "";
            this.toggleModelsCheckBox(item, checked, value);
        });
    }

    @action
    async fetchSavedAnalysis() {
        const apiUrl = this.config.apiUrl;
        await fetch(apiUrl, {
            method: "GET",
            mode: "cors",
        })
            .then(response => response.json())
            .then(data => this.updateModelStateFromApi(data))
            .catch(error => {
                console.log("error", error);
            });
    }

    @observable usersInput = {
        analysis_name: "",
        analysis_description: "",
        dataset_type: "",
        models: {},
        options: [],
    };

    @observable inputForm = {
        dataset_name: "",
        dataset_description: "",
        datasets: [],
        model_type: "",
    };

    @observable modelsCheckBoxHeaders = [
        {
            model: "",
            values: [
                {name: "MLE", colspan: "2"},
                {name: "ALternatives", colspan: "2"},
            ],
        },
        {
            model: "",
            values: [
                {name: "Frequntist Restricted", colspan: "1"},
                {name: "Frequentist Unrestricted", colspan: "1"},
                {name: "Bayesian", colspan: "1"},
                {name: "Bayesian Model Average", colspan: "1"},
            ],
        },

        {
            model: "Model Name",
            values: [
                {
                    name: "Enable",
                    model_name: "frequentist_restricted",
                    colspan: "1",
                    type: "checkBox",
                    isChecked: false,
                },
                {
                    name: "Enable",
                    model_name: "frequentist_unrestricted",
                    colspan: "1",
                    type: "checkBox",
                    isChecked: false,
                },
                {
                    name: "Enable",
                    model_name: "bayesian",
                    colspan: "1",
                    type: "checkBox",
                    isChecked: false,
                },
                {
                    name: "Enable",
                    model_name: "bayesian_model_average",
                    colspan: "1",
                    type: "checkBox",
                    isChecked: false,
                    prior_weight: "Prior Weight",
                },
            ],
        },
    ];

    @observable CmodelType = [
        {
            model: "Exponential",
            values: [
                {
                    name: "frequentist_restricted-Exponential",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Exponential",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: true,
                },
                {
                    name: "bayesian-Exponential",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian_model_average-Exponential",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Hill",
            values: [
                {
                    name: "frequentist_restricted-Hill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Hill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Hill", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Hill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Linear",
            values: [
                {
                    name: "frequentist_restricted-Linear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: true,
                },
                {
                    name: "frequentist_unrestricted-Linear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Linear", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Linear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Polynomial",
            values: [
                {
                    name: "frequentist_restricted-Polynomial",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Polynomial",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian-Polynomial",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian_model_average-Polynomial",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Power",
            values: [
                {
                    name: "frequentist_restricted-Power",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Power",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Power", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Power",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
    ];

    @observable DmodelType = [
        {
            model: "Dichotomous Hill",
            values: [
                {
                    name: "frequentist_restricted-DichotomousHill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-DichotomousHill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian-DichotomousHill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian_model_average-DichotomousHill",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Gamma",
            values: [
                {
                    name: "frequentist_restricted-Gamma",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Gamma",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Gamma", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Gamma",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Logistic",
            values: [
                {
                    name: "frequentist_restricted-Logistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: true,
                },
                {
                    name: "frequentist_unrestricted-Logistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Logistic", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Logistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Log Logistic",
            values: [
                {
                    name: "frequentist_restricted-LogLogistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-LogLogistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian-LogLogistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian_model_average-LogLogistic",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Log Probit",
            values: [
                {
                    name: "frequentist_restricted-LogProbit",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-LogProbit",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-LogProbit", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-LogProbit",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Multistage",
            values: [
                {
                    name: "frequentist_restricted-Multistage",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Multistage",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian-Multistage",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian_model_average-Multistage",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Probit",
            values: [
                {
                    name: "frequentist_restricted-Probit",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: true,
                },
                {
                    name: "frequentist_unrestricted-Probit",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Probit", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Probit",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Quantal Linear",
            values: [
                {
                    name: "frequentist_restricted-QuantalLinear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: true,
                },
                {
                    name: "frequentist_unrestricted-QuantalLinear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian-QuantalLinear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "bayesian_model_average-QuantalLinear",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
        {
            model: "Weibull",
            values: [
                {
                    name: "frequentist_restricted-Weibull",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {
                    name: "frequentist_unrestricted-Weibull",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                },
                {name: "bayesian-Weibull", type: "checkbox", isChecked: false, isDisabled: false},
                {
                    name: "bayesian_model_average-Weibull",
                    type: "checkbox",
                    isChecked: false,
                    isDisabled: false,
                    prior_weight: "0",
                },
            ],
        },
    ];

    @observable CSForm = [
        {label: "Dose", name: "doses", value: "6"},
        {label: "N", name: "ns", value: "5"},
        {label: "Mean", name: "means", value: "7"},
        {label: "St Dev", name: "stdevs", value: "3"},
    ];

    @observable CIForm = [
        {label: "Dose", name: "doses"},
        {label: "Response", name: "responses"},
    ];

    @observable DichotomousForm = [
        {label: "Dose", name: "doses"},
        {label: "N", name: "ns"},
        {label: "Incidence", name: "incidences"},
    ];

    @observable NestedForm = [
        {label: "Dose", name: "doses"},
        {label: "Litter Size", name: "litter_sizes"},
        {label: "Incidence", name: "incidences"},
        {label: "Litter Specific Covariate", name: "litter_specific_covariates"},
    ];

    @observable getDataFormList(dataFormType) {
        let forms = [];
        switch (dataFormType) {
            case "CS":
                forms = this.CSForm;
                break;
            case "D":
                forms = this.DichotomousForm;
                break;
            case "CI":
                forms = this.CIForm;
                break;
            case "NS":
                forms = this.NestedForm;
                break;
        }
        return forms;
    }

    @observable getModelTypeList() {
        let models = [];
        if (this.usersInput.dataset_type === "C") {
            models = this.CmodelType;
        } else if (this.usersInput.dataset_type === "D") {
            models = this.DmodelType;
        }
        return models;
    }

    @action createOptions() {
        if (this.usersInput.dataset_type === "C") {
            this.usersInput.options.push({
                bmr_type: "",
                bmr_value: "",
                tail_probability: "",
                confidence_level: "",
                distribution: "",
                variance: "",
                polynomial_restriction: "",
                background: "",
            });
        }

        if (this.usersInput.dataset_type === "D") {
            this.usersInput.options.push({
                bmr_type: "",
                bmr_value: "",
                confidence_level: "",
                background: "",
            });
        }
    }

    @action createForm(formType) {
        switch (formType) {
            case "CS":
                this.inputForm.datasets.push({
                    doses: "",
                    ns: "",
                    means: "",
                    stdevs: "",
                });

                break;
            case "D":
                this.inputForm.datasets.push({
                    doses: "",
                    ns: "",
                    incidences: "",
                });
                break;
            case "CI":
                this.inputForm.datasets.push({
                    doses: "",
                    responses: "",
                });

                break;
            case "NS":
                this.inputForm.datasets.push({
                    doses: "",
                    litter_sizes: "",
                    incidences: "",
                    litter_Specific_covariates: "",
                });
                break;
        }
    }

    @observable DatasetNamesHeader = ["Enable", "Datasets", "Adverse Direction"];

    @observable AdverseDirectionList = [
        {value: "automatic", name: "Automatic"},
        {value: "up", name: "Up"},
        {value: "down", name: "Down"},
    ];

    @computed get modelTypeLength() {
        return this.modelType.length;
    }

    @computed get getDataLength() {
        return this.savedDataset.length;
    }

    @observable isReadyToExecute = false;
    @observable isExecuting = false;

    @action
    async executeAnalysis() {
        if (!this.isReadyToExecute) {
            // don't execute if we're not ready
            return;
        }
        if (this.isExecuting) {
            // don't execute if we're already executing
            return;
        }
        this.isExecuting = true;
        await fetch(this.config.editSettings.executeUrl, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                editKey: this.config.editSettings.editKey,
            }),
        })
            .then(response => response.json())
            .then(data => {
                // TODO - fix this when we don't block and execution doesn't complete immediately
                this.updateModelStateFromApi(data);
            })
            .catch(error => {
                console.log("error", error);
            });
    }
}

const store = new DataStore();
export default store;
