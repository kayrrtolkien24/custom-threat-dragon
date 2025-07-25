<template>
  <div class="text-to-diagram">
    <h3>Text to Diagram Generator</h3>
    <p class="text-muted">
      Create a diagram using Mermaid syntax instead of drawing it manually.
    </p>

    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label for="mermaidInput">Mermaid Syntax</label>
          <textarea
            id="mermaidInput"
            v-model="mermaidText"
            class="form-control"
            rows="15"
            placeholder="Enter Mermaid flowchart syntax here..."
            :disabled="isProcessing"
          ></textarea>
        </div>

        <div class="mb-3">
          <b-button
            variant="primary"
            @click="generateDiagram"
            :disabled="isProcessing || !mermaidText.trim()"
          >
            <span v-if="isProcessing">
              <b-spinner small></b-spinner>
              Generating...
            </span>
            <span v-else>
              <i class="fas fa-magic mr-1"></i>
              Generate Diagram
            </span>
          </b-button>
          <b-button
            variant="outline-secondary"
            class="ml-2"
            @click="loadExample"
            :disabled="isProcessing"
          >
            <i class="fas fa-lightbulb mr-1"></i>
            Load Example
          </b-button>
        </div>

        <!-- Error Alert -->
        <b-alert
          v-if="error"
          show
          variant="danger"
          dismissible
          @dismissed="error = null"
        >
          <h5><i class="fas fa-exclamation-triangle mr-2"></i>Error</h5>
          <div>{{ errorMessage }}</div>
          <div v-if="errorDetails" class="mt-2">
            <small>{{ errorDetails }}</small>
          </div>
        </b-alert>

        <!-- Help Section -->
        <div class="mt-3">
          <b-button v-b-toggle.mermaid-help variant="link" class="p-0">
            <i class="fas fa-question-circle mr-1"></i>
            How to use Mermaid syntax
          </b-button>
          <b-collapse id="mermaid-help" class="mt-2">
            <div class="p-3 bg-light border rounded">
              <h5>Basic Mermaid Syntax Examples:</h5>
              <pre class="mb-2">flowchart LR
  user[User] --> webapp(Web Application)
  webapp --> database[(Database)]</pre>
              <p class="mb-1"><strong>Node Types:</strong></p>
              <ul class="mb-2">
                <li><code>name[Text]</code> - Actor (user, external system)</li>
                <li><code>name(Text)</code> - Process (application, service)</li>
                <li><code>name[(Text)]</code> - Store (database, file)</li>
              </ul>
              <p class="mb-1"><strong>Flow Types:</strong></p>
              <ul class="mb-0">
                <li><code>A --> B</code> - Basic flow</li>
                <li><code>A -->|Label| B</code> - Labeled flow</li>
              </ul>
            </div>
          </b-collapse>
        </div>
      </div>

      <div class="col-md-6">
        <div class="form-group">
          <label>Preview</label>
          <div
            ref="mermaidPreview"
            class="mermaid-preview border rounded p-3 bg-light"
          >
            <div v-if="!mermaidText.trim()" class="text-center text-muted py-5">
              <i class="fas fa-chart-network fa-3x mb-3"></i>
              <p>Enter Mermaid syntax to see a preview</p>
            </div>
            <div v-else ref="mermaidContainer" class="mermaid-container"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mermaid from 'mermaid';

export default {
  name: 'TextToDiagram',
  data() {
    return {
      mermaidText: '',
      isProcessing: false,
      error: null,
      errorMessage: '',
      errorDetails: '',
      nodeTypes: {
        square: 'tm.Actor',      // [text]
        rounded: 'tm.Process',   // (text)
        cylinder: 'tm.Store'     // [(text)]
      },
      exampleDiagram: `flowchart LR
    user[Customer] -->|HTTP Request| web(Web Server)
    web -->|Query| db[(Database)]
    web -->|Authenticate| auth(Auth Service)
    auth -->|Validate| db
    web -->|Store Files| storage[(File Storage)]`
    };
  },
  mounted() {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  },
  methods: {
    /**
     * Load an example Mermaid diagram
     */
    loadExample() {
      this.mermaidText = this.exampleDiagram;
      this.renderMermaidPreview();
    },

    /**
     * Render the Mermaid preview
     */
    async renderMermaidPreview() {
      if (!this.mermaidText.trim()) return;

      try {
        const container = this.$refs.mermaidContainer;
        if (!container) return;

        // Clear previous content
        container.innerHTML = '';
        
        // Generate unique ID for the diagram
        const id = `mermaid-diagram-${Date.now()}`;
        container.innerHTML = `<div id="${id}">${this.mermaidText}</div>`;
        
        // Render the diagram
        await mermaid.run({
          nodes: [`#${id}`]
        });

        // Clear any previous errors
        this.error = null;
      } catch (error) {
        console.error('Mermaid render error:', error);
        this.setError('Invalid Mermaid syntax', error.message);
      }
    },

    /**
     * Generate a Threat Dragon diagram from Mermaid syntax
     */
    async generateDiagram() {
      if (!this.mermaidText.trim()) {
        this.setError('Empty input', 'Please enter Mermaid syntax to generate a diagram.');
        return;
      }

      this.isProcessing = true;
      this.error = null;

      try {
        // First validate the Mermaid syntax by rendering it
        await this.renderMermaidPreview();

        // Parse the Mermaid syntax
        const diagramData = this.parseMermaidToThreatDragon(this.mermaidText);
        
        // Emit the generated diagram data
        this.$emit('diagram-generated', diagramData);
        
      } catch (error) {
        console.error('Diagram generation error:', error);
        this.setError(
          'Failed to generate diagram',
          error.message || 'An unexpected error occurred while parsing the diagram.'
        );
      } finally {
        this.isProcessing = false;
      }
    },

    /**
     * Parse Mermaid syntax to Threat Dragon JSON format
     * @param {string} mermaidText - The Mermaid syntax to parse
     * @returns {Object} - Threat Dragon diagram JSON
     */
    parseMermaidToThreatDragon(mermaidText) {
      // Basic validation
      if (!mermaidText.trim().startsWith('flowchart')) {
        throw new Error('Only flowchart diagrams are supported. Syntax must start with "flowchart".');
      }

      // Extract nodes and edges
      const nodes = [];
      const flows = [];
      const nodeMap = {};
      
      // Parse the Mermaid text line by line
      const lines = mermaidText.split('\n');
      
      // Skip the first line (flowchart declaration)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Check if this line defines a node
        const nodeMatch = line.match(/^\s*([a-zA-Z0-9_-]+)(\[.*?\]|\(.*?\)|(\[\(.*?\)\]))/);
        if (nodeMatch) {
          const nodeId = nodeMatch[1];
          const nodeText = nodeMatch[2];
          
          // Determine node type based on syntax
          let nodeType = 'tm.Process'; // Default
          let nodeName = '';
          
          if (nodeText.startsWith('[') && nodeText.endsWith(']')) {
            // [Text] format - Actor
            nodeType = 'tm.Actor';
            nodeName = nodeText.substring(1, nodeText.length - 1);
          } else if (nodeText.startsWith('(') && nodeText.endsWith(')')) {
            // (Text) format - Process
            nodeType = 'tm.Process';
            nodeName = nodeText.substring(1, nodeText.length - 1);
          } else if (nodeText.startsWith('[(') && nodeText.endsWith(')]')) {
            // [(Text)] format - Store
            nodeType = 'tm.Store';
            nodeName = nodeText.substring(2, nodeText.length - 2);
          }
          
          // Create the node
          const node = {
            id: nodeId,
            type: nodeType,
            name: nodeName,
            description: '',
            position: this.calculateNodePosition(nodes.length),
            size: { width: 100, height: 60 },
            outOfScope: false,
            reasonOutOfScope: '',
            hasOpenThreats: false,
            threats: []
          };
          
          nodes.push(node);
          nodeMap[nodeId] = node;
          continue;
        }
        
        // Check if this line defines an edge/flow
        const edgeMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*(-->|--)\s*(?:\|(.*?)\|)?\s*([a-zA-Z0-9_-]+)/);
        if (edgeMatch) {
          const sourceId = edgeMatch[1];
          const targetId = edgeMatch[4];
          const flowLabel = edgeMatch[3] || '';
          
          // Ensure both nodes exist
          if (!nodeMap[sourceId] || !nodeMap[targetId]) {
            throw new Error(`Edge references undefined node: ${sourceId} -> ${targetId}`);
          }
          
          // Create the flow
          const flow = {
            id: `flow-${sourceId}-${targetId}`,
            type: 'tm.Flow',
            name: flowLabel,
            description: '',
            source: sourceId,
            target: targetId,
            isEncrypted: false,
            protocol: '',
            isPublicNetwork: false,
            hasOpenThreats: false,
            threats: []
          };
          
          flows.push(flow);
        }
      }
      
      // Create the Threat Dragon diagram JSON
      return {
        summary: {
          title: 'Generated from Mermaid',
          description: 'Automatically generated diagram from Mermaid syntax'
        },
        detail: {
          contributors: [],
          diagrams: [
            {
              id: `diagram-${Date.now()}`,
              title: 'Generated Diagram',
              diagramType: 'Data Flow',
              placeholder: false,
              thumbnail: '',
              version: '2.0',
              description: 'Diagram generated from Mermaid syntax',
              cells: [...nodes, ...flows]
            }
          ]
        }
      };
    },

    /**
     * Calculate position for a node based on its index
     * @param {number} index - Node index
     * @returns {Object} - Position {x, y}
     */
    calculateNodePosition(index) {
      // Simple grid layout
      const columns = 3;
      const columnWidth = 200;
      const rowHeight = 150;
      
      const column = index % columns;
      const row = Math.floor(index / columns);
      
      return {
        x: 100 + (column * columnWidth),
        y: 100 + (row * rowHeight)
      };
    },

    /**
     * Set error state with message
     * @param {string} message - Error message
     * @param {string} details - Error details
     */
    setError(message, details = '') {
      this.error = true;
      this.errorMessage = message;
      this.errorDetails = details;
    }
  },
  watch: {
    mermaidText() {
      // Render preview when text changes
      this.$nextTick(() => {
        this.renderMermaidPreview();
      });
    }
  }
};
</script>

<style scoped>
.text-to-diagram {
  padding: 1rem;
}

.mermaid-preview {
  min-height: 300px;
  overflow: auto;
}

.mermaid-container {
  display: flex;
  justify-content: center;
}
</style>
