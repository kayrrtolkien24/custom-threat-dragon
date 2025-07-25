<template>
  <div class="new-threat-model">
    <b-container>
      <b-row class="mb-4">
        <b-col>
          <h2>Create New Threat Model</h2>
          <p class="text-muted">Start with a blank canvas or choose a template to get started quickly.</p>
        </b-col>
      </b-row>

      <!-- Loading indicator -->
      <b-row v-if="isLoading">
        <b-col class="text-center py-5">
          <b-spinner variant="primary" label="Loading templates..."></b-spinner>
          <p class="mt-3">Loading templates...</p>
        </b-col>
      </b-row>

      <!-- Template selection -->
      <template v-else>
        <!-- Blank option -->
        <b-row class="mb-4">
          <b-col>
            <b-card 
              class="template-card blank-template" 
              @click="selectTemplate(null)"
              :class="{ 'selected': selectedTemplate === null }"
            >
              <div class="d-flex align-items-center">
                <div class="template-icon">
                  <i class="fas fa-file fa-2x"></i>
                </div>
                <div class="ml-3">
                  <h4>Blank Model</h4>
                  <p class="mb-0">Start with an empty canvas and build your threat model from scratch.</p>
                </div>
              </div>
            </b-card>
          </b-col>
        </b-row>

        <!-- Available templates -->
        <b-row v-if="templates.length > 0">
          <b-col>
            <h4 class="mb-3">Or select a template:</h4>
          </b-col>
        </b-row>
        
        <b-row>
          <b-col cols="12" v-for="template in templates" :key="template.id" class="mb-3">
            <b-card 
              class="template-card" 
              @click="selectTemplate(template)"
              :class="{ 'selected': selectedTemplate === template }"
            >
              <div class="d-flex align-items-center">
                <div class="template-icon">
                  <i class="fas fa-project-diagram fa-2x"></i>
                </div>
                <div class="ml-3">
                  <h4>{{ template.summary.title }}</h4>
                  <p class="mb-0">{{ template.summary.description }}</p>
                </div>
              </div>
            </b-card>
          </b-col>
        </b-row>

        <!-- Error message -->
        <b-row v-if="error">
          <b-col>
            <b-alert show variant="danger">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              Error loading templates: {{ errorMessage }}
            </b-alert>
          </b-col>
        </b-row>

        <!-- Action buttons -->
        <b-row class="mt-4">
          <b-col class="d-flex justify-content-between">
            <b-button 
              variant="outline-secondary" 
              :to="{ name: 'Dashboard' }"
            >
              <i class="fas fa-arrow-left mr-1"></i>
              Cancel
            </b-button>
            
            <b-button 
              variant="primary" 
              @click="createThreatModel"
              :disabled="isCreating"
            >
              <b-spinner small v-if="isCreating" class="mr-1"></b-spinner>
              <i v-else class="fas fa-check mr-1"></i>
              Create Threat Model
            </b-button>
          </b-col>
        </b-row>
      </template>
    </b-container>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import axios from 'axios';
import isElectron from 'is-electron';
import { getProviderType } from '@/service/provider/providers.js';
import tmActions from '@/store/actions/threatmodel.js';

export default {
  name: 'NewThreatModel',
  data() {
    return {
      templates: [],
      selectedTemplate: null,
      isLoading: true,
      isCreating: false,
      error: false,
      errorMessage: ''
    };
  },
  computed: mapState({
    providerType: (state) => getProviderType(state.provider.selected),
    version: (state) => state.packageBuildVersion
  }),
  async mounted() {
    this.$store.dispatch(tmActions.clear);
    await this.loadTemplates();
  },
  methods: {
    /**
     * Load available templates from the filesystem
     */
    async loadTemplates() {
      try {
        this.isLoading = true;
        this.error = false;

        // Get templates directory from environment or use default
        const templatesDir = process.env.VUE_APP_TEMPLATES_DIRECTORY || '/templates';
        
        // Fetch templates from the server
        const response = await axios.get('/api/templates');
        
        if (response.data && response.data.templates) {
          this.templates = response.data.templates;
        } else {
          this.templates = [];
        }
      } catch (err) {
        console.error('Error loading templates:', err);
        this.error = true;
        this.errorMessage = err.message || 'Failed to load templates';
        this.templates = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Select a template
     * @param {Object|null} template - Template object or null for blank model
     */
    selectTemplate(template) {
      this.selectedTemplate = template;
    },

    /**
     * Create a new threat model based on the selected template or blank
     */
    async createThreatModel() {
      this.isCreating = true;
      
      try {
        let newTm;
        
        if (this.selectedTemplate) {
          // Use selected template as base
          newTm = JSON.parse(JSON.stringify(this.selectedTemplate));
          
          // Update version and reset some fields
          newTm.version = this.version;
          newTm.summary.id = 0;
          
          // Append "from template" to the title
          if (!newTm.summary.title.includes('(from template)')) {
            newTm.summary.title += ' (from template)';
          }
        } else {
          // Create blank threat model
          newTm = {
            version: this.version,
            summary: {
              title: 'New Threat Model',
              owner: '',
              description: '',
              id: 0
            },
            detail: {
              contributors: [],
              diagrams: [],
              diagramTop: 0,
              reviewer: '',
              threatTop: 0
            }
          };
        }

        // Update store with the new threat model
        this.$store.dispatch(tmActions.selected, newTm);
        
        // Prepare route params
        const params = Object.assign({}, this.$route.params, {
          threatmodel: newTm.summary.title
        });
        
        // Handle Electron environment
        if (isElectron()) {
          // Tell the desktop server that the model has changed
          window.electronAPI.modelOpened(newTm.summary.title);
        }
        
        // Navigate to the appropriate edit page based on provider type
        if (this.providerType === 'local' || this.providerType === 'desktop') {
          this.$router.push({ name: `${this.providerType}ThreatModelEdit`, params });
        } else {
          this.$router.push({ name: `${this.providerType}ThreatModelCreate`, params });
        }
      } catch (err) {
        console.error('Error creating threat model:', err);
        this.$bvToast.toast('Failed to create threat model: ' + (err.message || 'Unknown error'), {
          title: 'Error',
          variant: 'danger',
          solid: true
        });
      } finally {
        this.isCreating = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.new-threat-model {
  padding: 2rem 0;
}

.template-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: $primary;
    background-color: rgba($primary, 0.05);
  }
}

.template-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;
}

.blank-template .template-icon {
  color: $gray-600;
}
</style>
