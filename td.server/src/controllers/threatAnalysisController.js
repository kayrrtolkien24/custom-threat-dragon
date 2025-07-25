/**
 * Threat Analysis Controller for Custom Threat Dragon
 * 
 * Provides endpoints for analyzing diagrams and generating threats
 * using both standard and enhanced threat rules.
 */
import loggerHelper from '../helpers/logger.helper.js';
import threatEngine from '../threats/threatEngine.js';

// Get logger instance
const logger = loggerHelper.get('threatAnalysisController.js');

/**
 * Analyze a diagram and generate threats
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing the diagram
 * @param {Object} res - Express response object
 */
const analyzeDiagram = async (req, res) => {
    try {
        const diagram = req.body;
        
        // Validate request
        if (!diagram) {
            return res.status(400).json({
                success: false,
                message: 'No diagram provided'
            });
        }
        
        // Ensure diagram has required properties
        if (!diagram.cells) {
            return res.status(400).json({
                success: false,
                message: 'Invalid diagram format: missing cells array'
            });
        }

        logger.info(`Analyzing diagram with ${diagram.cells.length} cells`);
        
        // Initialize threat engine if not already initialized
        if (!threatEngine.initialized) {
            logger.info('Initializing threat engine');
            await threatEngine.initialize();
        }
        
        // Analyze the diagram
        const analyzedDiagram = threatEngine.analyzeDiagram(diagram);
        
        // Count generated threats
        let threatCount = 0;
        analyzedDiagram.cells.forEach(cell => {
            threatCount += (cell.threats && Array.isArray(cell.threats)) ? cell.threats.length : 0;
        });
        
        logger.info(`Analysis complete. Generated ${threatCount} threats.`);
        
        // Return the analyzed diagram
        return res.status(200).json({
            success: true,
            diagram: analyzedDiagram,
            threatCount,
            message: `Analysis complete. Generated ${threatCount} threats.`
        });
    } catch (error) {
        logger.error(`Error analyzing diagram: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze diagram',
            error: error.message
        });
    }
};

/**
 * Get information about the threat engine configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getThreatEngineInfo = async (req, res) => {
    try {
        // Initialize threat engine if not already initialized
        if (!threatEngine.initialized) {
            logger.info('Initializing threat engine');
            await threatEngine.initialize();
        }
        
        // Get rule counts
        const standardRuleCount = threatEngine.rules.standard.length;
        const enhancedRuleCount = threatEngine.rules.enhanced.length;
        const enhancedRulesEnabled = threatEngine.isEnhancedRulesEnabled();
        
        return res.status(200).json({
            success: true,
            engineInfo: {
                initialized: threatEngine.initialized,
                standardRuleCount,
                enhancedRuleCount,
                enhancedRulesEnabled,
                totalRuleCount: standardRuleCount + (enhancedRulesEnabled ? enhancedRuleCount : 0)
            }
        });
    } catch (error) {
        logger.error(`Error getting threat engine info: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to get threat engine info',
            error: error.message
        });
    }
};

export default {
    analyzeDiagram,
    getThreatEngineInfo
};
