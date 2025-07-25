<template>
    <div>
        <b-modal
            v-if="!!threat"
            id="threat-edit"
            size="lg"
            ok-variant="primary"
            header-bg-variant="primary"
            header-text-variant="light"
            :title="modalTitle"
            ref="editModal"
        >
            <b-form>
                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="title-group"
                            :label="$t('threats.properties.title')"
                            label-for="title">
                            <b-form-input
                                id="title"
                                v-model="threat.title"
                                type="text"
                                required
                            ></b-form-input>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="threat-type-group"
                            :label="$t('threats.properties.type')"
                            label-for="threat-type">
                            <b-form-select
                                id="threat-type"
                                v-model="threat.type"
                                :options="threatTypes">
                            </b-form-select>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col md=5>
                        <b-form-group
                            id="status-group"
                            class="float-left"
                            :label="$t('threats.properties.status')"
                            label-for="status">
                            <b-form-select
                                id="status"
                                v-model="threat.status"
                                :options="statuses">
                            </b-form-select>
                        </b-form-group>
                    </b-col>
                    <b-col md=7>
                        <b-form-group
                            id="severity-group"
                            class="float-left"
                            :label="$t('threats.properties.severity')"
                            label-for="severity">
                            <b-form-select
                                id="severity"
                                v-model="threat.severity"
                                :options="severities">
                            </b-form-select>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="description-group"
                            :label="$t('threats.properties.description')"
                            label-for="description">
                            <b-form-textarea
                                id="description"
                                v-model="threat.description"
                                rows="3"
                                max-rows="10"
                            ></b-form-textarea>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="mitigation-group"
                            :label="$t('threats.properties.mitigation')"
                            label-for="mitigation">
                            <b-form-textarea
                                id="mitigation"
                                v-model="threat.mitigation"
                                rows="3"
                                max-rows="10"
                            ></b-form-textarea>
                        </b-form-group>
                    </b-col>
                </b-form-row>

                <b-form-row>
                    <b-col>
                        <b-form-group
                            id="modelname-group"
                            :label="$t('threats.properties.modelname')"
                            label-for="modelname">
                            <b-form-input
                                id="modelname"
                                v-model="threat.modelType"
                                type="text"
                            ></b-form-input>
                        </b-form-group>
                    </b-col>
                </b-form-row>
            </b-form>

            <template #modal-footer>
                <div class="w-100">
                    <!-- Jira Integration Component -->
                    <jira-integration
                        :threat="threat"
                        :model-name="modelName"
                        :diagram-name="diagramName"
                    ></jira-integration>
                    
                    <hr class="my-3" />
                    
                <b-button
                    v-if="!newThreat"
                    variant="danger"
                    class="float-left"
                    @click="confirmDelete"
                >
                    {{ $t('forms.delete') }}
                </b-button>
                <b-button
                    variant="primary"
                    class="float-right"
                    @click="saveThreat"
                >
                    {{ $t('forms.save') }}
                </b-button>
                <b-button
                    variant="secondary"
                    class="float-right mr-2"
                    @click="hideModal()"
                >
                    {{ $t('forms.cancel') }}
                </b-button>
                </div>
            </template>
        </b-modal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

import { getModelTitle } from '@/service/threats/threat.service.js';
import threatActions from '@/store/actions/threat.js';
import JiraIntegration from '@/components/JiraIntegration.vue';

export default {
    name: 'ThreatEditDialog',
    components: {
        JiraIntegration
    },
    props: {
        cellData: {
            type: Object,
            default: () => ({})
        },
        diagramId: {
            type: String,
            default: ''
        },
        newThreat: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            threat: null,
            threatTypes: [],
            statuses: [],
            severities: []
        };
    },
    computed: {
        ...mapGetters([
            'selectedThreat',
            'threatTypes',
            'threatStatuses',
            'threatSeverities',
            'selectedDiagram',
            'threatModel'
        ]),
        modalTitle() {
            return this.newThreat
                ? this.$t('threats.newThreat')
                : this.$t('threats.editThreat');
        },
        // Get the model name for Jira integration
        modelName() {
            return this.threatModel?.summary?.title || '';
        },
        // Get the diagram name for Jira integration
        diagramName() {
            return this.selectedDiagram?.title || '';
        }
    },
    watch: {
        selectedThreat(val) {
            if (val) {
                this.threat = Object.assign({}, val);
            }
        }
    },
    mounted() {
        this.threatTypes = this.threatTypes;
        this.statuses = this.threatStatuses;
        this.severities = this.threatSeverities;

        if (this.newThreat) {
            this.threat = {
                id: this.cellData.id + '-' + Date.now(),
                title: '',
                type: this.threatTypes[0],
                status: this.statuses[0],
                severity: this.severities[0],
                description: '',
                mitigation: '',
                modelType: getModelTitle(this.cellData)
            };
        } else {
            this.threat = Object.assign({}, this.selectedThreat);
        }
    },
    methods: {
        hideModal() {
            this.$refs.editModal.hide();
        },
        saveThreat() {
            if (this.newThreat) {
                this.$store.dispatch(threatActions.addThreat, {
                    threat: this.threat,
                    cellId: this.cellData.id,
                    diagramId: this.diagramId
                });
            } else {
                this.$store.dispatch(threatActions.updateThreat, {
                    threat: this.threat,
                    cellId: this.cellData.id,
                    diagramId: this.diagramId
                });
            }
            this.hideModal();
        },
        deleteThreat() {
            this.$store.dispatch(threatActions.removeThreat, {
                threatId: this.threat.id,
                cellId: this.cellData.id,
                diagramId: this.diagramId
            });
        },
        async confirmDelete() {
            const confirmed = await this.$bvModal.msgBoxConfirm(this.$t('threats.confirmDeleteMessage'), {
                title: this.$t('threats.confirmDeleteTitle'),
                okTitle: this.$t('forms.delete'),
                cancelTitle: this.$t('forms.cancel'),
                okVariant: 'danger'
            });

            if (!confirmed) { return; }

            this.deleteThreat();
            this.hideModal();
        },
        async immediateDelete() {
            this.deleteThreat();
            this.hideModal();
        }
    }
};
</script>
