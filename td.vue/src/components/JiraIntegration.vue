<template>
  <div class="jira-integration">
    <b-button
      v-if="!ticketCreated"
      :disabled="isLoading"
      variant="outline-primary"
      size="sm"
      class="mt-2"
      @click="createJiraTicket"
      :title="buttonTitle"
    >
      <span v-if="isLoading">
        <b-spinner small></b-spinner>
        Creating ticket...
      </span>
      <span v-else>
        <i class="fas fa-ticket-alt mr-1"></i>
        Create Jira Ticket
      </span>
    </b-button>

    <div v-else class="jira-ticket-info mt-2">
      <b-alert show variant="success" class="p-2 mb-0">
        <div class="d-flex align-items-center">
          <i class="fas fa-check-circle mr-2"></i>
          <div>
            <strong>Jira ticket created:</strong>
            <a :href="ticketUrl" target="_blank" class="ml-1">{{ ticketId }}</a>
          </div>
        </div>
      </b-alert>
    </div>

    <!-- Error Alert -->
    <b-alert
      v-if="error"
      show
      variant="danger"
      class="mt-2 p-2"
      dismissible
      @dismissed="error = null"
    >
      <div class="d-flex">
        <i class="fas fa-exclamation-circle mr-2 mt-1"></i>
        <div>
          <strong>Error creating ticket:</strong>
          <div>{{ errorMessage }}</div>
        </div>
      </div>
    </b-alert>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'JiraIntegration',
  props: {
    // The threat object to create a Jira ticket for
    threat: {
      type: Object,
      required: true
    },
    // The name of the threat model
    modelName: {
      type: String,
      default: ''
    },
    // The name of the diagram
    diagramName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isLoading: false,
      ticketCreated: false,
      ticketId: null,
      ticketUrl: null,
      error: null,
      errorMessage: '',
      jiraConfigured: false
    };
  },
  computed: {
    buttonTitle() {
      if (!this.jiraConfigured) {
        return 'Jira integration is not configured. Please check your environment variables.';
      }
      return 'Create a Jira ticket for this threat';
    }
  },
  mounted() {
    // Check if Jira integration is configured
    this.checkJiraHealth();
  },
  methods: {
    /**
     * Check if Jira integration is properly configured
     */
    async checkJiraHealth() {
      try {
        const response = await axios.get('/api/jira/health');
        this.jiraConfigured = response.data.status === 'configured';
      } catch (error) {
        console.error('Error checking Jira health:', error);
        this.jiraConfigured = false;
      }
    },

    /**
     * Create a Jira ticket for the threat
     */
    async createJiraTicket() {
      if (!this.jiraConfigured) {
        this.setError('Jira integration is not configured');
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        // Prepare the payload for the Jira ticket
        const payload = {
          title: this.threat.title || 'Untitled Threat',
          description: this.threat.description || 'No description provided',
          strideCategory: this.threat.type || this.threat.stride || 'Unspecified',
          severity: this.threat.severity || 'Medium',
          modelName: this.modelName,
          diagramName: this.diagramName,
          mitigation: this.threat.mitigation || ''
        };

        // Make the API call to create the Jira ticket
        const response = await axios.post('/api/jira/create-ticket', payload);
        
        // Handle successful response
        if (response.data.success) {
          this.ticketCreated = true;
          this.ticketId = response.data.ticketId;
          this.ticketUrl = response.data.ticketUrl;
          
          // Emit event to notify parent component
          this.$emit('ticket-created', {
            threatId: this.threat.id,
            ticketId: this.ticketId,
            ticketUrl: this.ticketUrl
          });
        } else {
          this.setError(response.data.message || 'Failed to create Jira ticket');
        }
      } catch (error) {
        // Handle error response
        let errorMsg = 'Failed to create Jira ticket';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMsg = error.response.data.message || error.response.data.error || errorMsg;
        } else if (error.request) {
          // The request was made but no response was received
          errorMsg = 'No response from server. Please try again later.';
        } else {
          // Something happened in setting up the request
          errorMsg = error.message || errorMsg;
        }
        
        this.setError(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Set error state with message
     * @param {string} message - Error message to display
     */
    setError(message) {
      this.error = true;
      this.errorMessage = message;
    }
  }
};
</script>

<style scoped>
.jira-integration {
  margin-top: 0.5rem;
}

.jira-ticket-info {
  font-size: 0.9rem;
}

.jira-ticket-info a {
  font-weight: bold;
  text-decoration: underline;
}
</style>
