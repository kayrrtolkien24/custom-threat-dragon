/**
 * Enhanced Threat Engine for Custom Threat Dragon
 * 
 * This engine loads both standard threat rules and enhanced rules from enhanced-generic.json.
 * It supplements (not replaces) the existing threat detection capabilities to provide
 * more comprehensive threat analysis.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loggerHelper from '../helpers/logger.helper.js';
import env from '../env/Env.js';

// Get logger instance
const logger = loggerHelper.get('threatEngine.js');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rule types
const RULE_TYPES = {
  STANDARD: 'standard',
  ENHANCED: 'enhanced'
};

class ThreatEngine {
  constructor() {
    this.rules = {
      standard: [],
      enhanced: []
    };
    this.initialized = false;
  }

  /**
   * Initialize the threat engine by loading all rule sets
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load standard rules if they exist
      await this.loadStandardRules();
      
      // Load enhanced rules
      await this.loadEnhancedRules();
      
      this.initialized = true;
      logger.info(`Threat Engine initialized with ${this.rules.standard.length} standard rules and ${this.rules.enhanced.length} enhanced rules`);
    } catch (error) {
      logger.error('Failed to initialize Threat Engine:', error);
      throw error;
    }
  }

  /**
   * Load standard threat rules from various sources
   */
  async loadStandardRules() {
    try {
      const rulesDir = path.join(__dirname, 'rules');
      
      // Check if rules directory exists
      if (!fs.existsSync(rulesDir)) {
        logger.warn('Rules directory not found. Creating it.');
        fs.mkdirSync(rulesDir, { recursive: true });
      }

      // Look for standard rule files (excluding enhanced rules)
      const files = fs.readdirSync(rulesDir)
        .filter(file => file.endsWith('.json') && !file.startsWith('enhanced-'));
      
      for (const file of files) {
        try {
          const filePath = path.join(rulesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const ruleSet = JSON.parse(fileContent);
          
          if (ruleSet.rules && Array.isArray(ruleSet.rules)) {
            this.rules.standard = [...this.rules.standard, ...ruleSet.rules];
            logger.info(`Loaded ${ruleSet.rules.length} standard rules from ${file}`);
          }
        } catch (err) {
          logger.error(`Error loading standard rules from ${file}:`, err);
        }
      }
    } catch (error) {
      logger.error('Failed to load standard rules:', error);
      throw error;
    }
  }

  /**
   * Load enhanced threat rules from enhanced-generic.json
   */
  async loadEnhancedRules() {
    try {
      const enhancedRulesPath = path.join(__dirname, 'rules', 'enhanced-generic.json');
      
      // Check if enhanced rules file exists
      if (!fs.existsSync(enhancedRulesPath)) {
        logger.warn('Enhanced rules file not found. Enhanced threat detection will not be available.');
        return;
      }

      // Load and parse enhanced rules
      const fileContent = fs.readFileSync(enhancedRulesPath, 'utf8');
      const enhancedRuleSet = JSON.parse(fileContent);
      
      if (enhancedRuleSet.rules && Array.isArray(enhancedRuleSet.rules)) {
        this.rules.enhanced = enhancedRuleSet.rules;
        logger.info(`Loaded ${enhancedRuleSet.rules.length} enhanced rules from enhanced-generic.json`);
      } else {
        logger.warn('Enhanced rules file has invalid format. No enhanced rules loaded.');
      }
    } catch (error) {
      logger.error('Failed to load enhanced rules:', error);
      // Don't throw here to allow standard rules to still work
    }
  }

  /**
   * Analyze a diagram and generate threats based on both standard and enhanced rules
   * @param {Object} diagram - The diagram to analyze
   * @returns {Object} - The diagram with generated threats
   */
  analyzeDiagram(diagram) {
    if (!this.initialized) {
      throw new Error('Threat Engine not initialized. Call initialize() first.');
    }

    logger.info(`Analyzing diagram: ${diagram.title || 'Untitled'}`);
    
    // Make a copy of the diagram to avoid modifying the original
    const analyzedDiagram = JSON.parse(JSON.stringify(diagram));
    
    // Get all cells from the diagram
    const cells = analyzedDiagram.cells || [];
    
    // Analyze each cell
    for (const cell of cells) {
      this.analyzeCell(cell, cells);
    }
    
    return analyzedDiagram;
  }

  /**
   * Analyze a single cell and generate threats based on rules
   * @param {Object} cell - The cell to analyze
   * @param {Array} allCells - All cells in the diagram (for context)
   */
  analyzeCell(cell, allCells) {
    // Skip cells that are out of scope
    if (cell.outOfScope) {
      return;
    }

    // Initialize threats array if it doesn't exist
    if (!cell.threats) {
      cell.threats = [];
    }
    
    // First apply standard rules
    this.applyRules(cell, allCells, RULE_TYPES.STANDARD);
    
    // Then apply enhanced rules if enabled
    if (this.isEnhancedRulesEnabled()) {
      this.applyRules(cell, allCells, RULE_TYPES.ENHANCED);
    }
    
    // Update hasOpenThreats flag if there are any threats
    cell.hasOpenThreats = cell.threats.length > 0;
  }

  /**
   * Apply rules of a specific type to a cell
   * @param {Object} cell - The cell to analyze
   * @param {Array} allCells - All cells in the diagram
   * @param {string} ruleType - The type of rules to apply (standard or enhanced)
   */
  applyRules(cell, allCells, ruleType) {
    const rulesToApply = this.rules[ruleType];
    
    for (const rule of rulesToApply) {
      // Skip rules without matches
      if (!rule.matches || !Array.isArray(rule.matches) || rule.matches.length === 0) {
        continue;
      }
      
      // Check if any match condition is satisfied
      const isMatch = this.evaluateMatches(rule.matches, cell, allCells);
      
      if (isMatch) {
        // Generate threat from the rule
        const threat = this.generateThreat(rule, cell);
        
        // Add the threat to the cell
        cell.threats.push(threat);
        
        logger.debug(`Applied ${ruleType} rule "${rule.rule}" to cell ${cell.id}`);
      }
    }
  }

  /**
   * Evaluate match conditions for a rule
   * @param {Array} matches - Array of match conditions
   * @param {Object} cell - The cell to check
   * @param {Array} allCells - All cells in the diagram
   * @returns {boolean} - True if any match condition is satisfied
   */
  evaluateMatches(matches, cell, allCells) {
    // Return true if any match condition is satisfied
    return matches.some(match => this.evaluateMatch(match, cell, allCells));
  }

  /**
   * Evaluate a single match condition
   * @param {string} match - The match condition
   * @param {Object} cell - The cell to check
   * @param {Array} allCells - All cells in the diagram
   * @returns {boolean} - True if the match condition is satisfied
   */
  evaluateMatch(match, cell, allCells) {
    // Handle basic type checks
    if (match === 'isActor' && cell.type === 'tm.Actor') return true;
    if (match === 'isProcess' && cell.type === 'tm.Process') return true;
    if (match === 'isStore' && cell.type === 'tm.Store') return true;
    if (match === 'isFlow' && cell.type === 'tm.Flow') return true;
    if (match === 'isAnyProcess' && (cell.type === 'tm.Process' || cell.type === 'tm.Actor')) return true;
    
    // Handle negation
    if (match.startsWith('not(') && match.endsWith(')')) {
      const innerMatch = match.substring(4, match.length - 1);
      return !this.evaluateMatch(innerMatch, cell, allCells);
    }
    
    // Handle AND conditions
    if (match.startsWith('and(') && match.endsWith(')')) {
      const innerConditions = this.parseConditions(match.substring(4, match.length - 1));
      return innerConditions.every(condition => this.evaluateMatch(condition, cell, allCells));
    }
    
    // Handle OR conditions
    if (match.startsWith('or(') && match.endsWith(')')) {
      const innerConditions = this.parseConditions(match.substring(3, match.length - 1));
      return innerConditions.some(condition => this.evaluateMatch(condition, cell, allCells));
    }
    
    // Handle property checks
    if (match.startsWith('hasProperty(')) {
      const propertyMatch = match.match(/hasProperty\(([^,]+),\s*([^)]+)\)/);
      if (propertyMatch) {
        const [, property, value] = propertyMatch;
        return cell[property] === value.trim();
      }
      
      // Check if property exists (no value specified)
      const propertyExistsMatch = match.match(/hasProperty\(([^)]+)\)/);
      if (propertyExistsMatch) {
        const [, property] = propertyExistsMatch;
        return cell[property] !== undefined && cell[property] !== null;
      }
    }
    
    // Handle source/target type checks for flows
    if (match.startsWith('source(') && cell.type === 'tm.Flow') {
      const sourceTypeMatch = match.match(/source\(([^)]+)\)/);
      if (sourceTypeMatch) {
        const [, sourceType] = sourceTypeMatch;
        const sourceCell = allCells.find(c => c.id === cell.source);
        return sourceCell && this.evaluateMatch(sourceType, sourceCell, allCells);
      }
    }
    
    if (match.startsWith('target(') && cell.type === 'tm.Flow') {
      const targetTypeMatch = match.match(/target\(([^)]+)\)/);
      if (targetTypeMatch) {
        const [, targetType] = targetTypeMatch;
        const targetCell = allCells.find(c => c.id === cell.target);
        return targetCell && this.evaluateMatch(targetType, targetCell, allCells);
      }
    }
    
    // Handle connection checks
    if (match.startsWith('connects(') && cell.type === 'tm.Flow') {
      const connectsMatch = match.match(/connects\(([^,]+),\s*([^)]+)\)/);
      if (connectsMatch) {
        const [, sourceType, targetType] = connectsMatch;
        const sourceCell = allCells.find(c => c.id === cell.source);
        const targetCell = allCells.find(c => c.id === cell.target);
        
        return sourceCell && targetCell && 
               this.evaluateMatch(sourceType, sourceCell, allCells) && 
               this.evaluateMatch(targetType, targetCell, allCells);
      }
    }
    
    // Handle custom properties
    if (match === 'isEncrypted') return cell.isEncrypted === true;
    if (match === 'isPublicNetwork') return cell.isPublicNetwork === true;
    if (match === 'isWebApplication') return cell.type === 'tm.Process' && (cell.name?.toLowerCase().includes('web') || cell.description?.toLowerCase().includes('web'));
    if (match === 'isAPI') return cell.type === 'tm.Process' && (cell.name?.toLowerCase().includes('api') || cell.description?.toLowerCase().includes('api'));
    if (match === 'isOutOfScope') return cell.outOfScope === true;
    if (match === 'isPublicFacing') return cell.type === 'tm.Process' && (cell.isPublicFacing === true || this.hasPublicFlowTo(cell, allCells));
    
    // Default: no match
    return false;
  }

  /**
   * Check if a cell has a public flow to it
   * @param {Object} cell - The cell to check
   * @param {Array} allCells - All cells in the diagram
   * @returns {boolean} - True if the cell has a public flow to it
   */
  hasPublicFlowTo(cell, allCells) {
    return allCells.some(c => 
      c.type === 'tm.Flow' && 
      c.target === cell.id && 
      c.isPublicNetwork === true
    );
  }

  /**
   * Parse comma-separated conditions, respecting nested parentheses
   * @param {string} conditionsString - The conditions string
   * @returns {Array} - Array of parsed conditions
   */
  parseConditions(conditionsString) {
    const conditions = [];
    let current = '';
    let depth = 0;
    
    for (let i = 0; i < conditionsString.length; i++) {
      const char = conditionsString[i];
      
      if (char === '(') {
        depth++;
        current += char;
      } else if (char === ')') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        conditions.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      conditions.push(current.trim());
    }
    
    return conditions;
  }

  /**
   * Generate a threat from a rule
   * @param {Object} rule - The rule to generate a threat from
   * @param {Object} cell - The cell to generate a threat for
   * @returns {Object} - The generated threat
   */
  generateThreat(rule, cell) {
    // Create a unique ID for the threat
    const threatId = `${cell.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the threat object
    const threat = {
      id: threatId,
      title: rule.generates.title || 'Untitled Threat',
      type: rule.generates.stride || rule.generates.type || 'Undefined',
      status: 'Open',
      severity: rule.generates.severity || 'Medium',
      description: rule.generates.description || '',
      mitigation: rule.generates.mitigation || '',
      modelType: cell.name || cell.type,
      generatedBy: rule.rule || 'Threat rule',
      isGenerated: true
    };
    
    return threat;
  }

  /**
   * Check if enhanced rules are enabled
   * @returns {boolean} - True if enhanced rules are enabled
   */
  isEnhancedRulesEnabled() {
    // Check environment variable
    const envValue = env.get().config.ENHANCED_RULES_ENABLED;
    
    // Default to true if not specified
    if (envValue === undefined || envValue === null) {
      return true;
    }
    
    // Parse boolean value
    return envValue === true || envValue === 'true' || envValue === '1';
  }
}

// Create and export a singleton instance
const threatEngine = new ThreatEngine();

export default threatEngine;
