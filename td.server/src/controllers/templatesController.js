/**
 * Templates Controller for Custom Threat Dragon
 * 
 * Handles loading and serving architecture templates from the filesystem
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loggerHelper from '../helpers/logger.helper.js';
import env from '../env/Env.js';

// Get logger instance
const logger = loggerHelper.get('templatesController.js');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all available architecture templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTemplates = async (req, res) => {
    try {
        // Get templates directory from environment variable or use default
        const templatesDir = env.get().config.TEMPLATES_DIRECTORY || 
            path.join(__dirname, '../../../td.vue/src/assets/templates');
        
        logger.info(`Loading templates from directory: ${templatesDir}`);

        // Check if directory exists
        if (!fs.existsSync(templatesDir)) {
            logger.warn(`Templates directory does not exist: ${templatesDir}`);
            return res.status(200).json({
                success: true,
                templates: []
            });
        }

        // Read directory contents
        const files = fs.readdirSync(templatesDir);
        
        // Filter for JSON files only
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        logger.info(`Found ${jsonFiles.length} template files`);
        
        // Read and parse each template file
        const templates = [];
        for (const file of jsonFiles) {
            try {
                const filePath = path.join(templatesDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const template = JSON.parse(fileContent);
                
                // Add template metadata
                template.id = path.basename(file, '.json');
                template.fileName = file;
                
                // Validate template structure
                if (!template.summary || !template.detail) {
                    logger.warn(`Skipping invalid template file: ${file} - missing required structure`);
                    continue;
                }
                
                templates.push(template);
            } catch (err) {
                logger.error(`Error processing template file ${file}: ${err.message}`);
                // Continue with other files even if one fails
            }
        }
        
        // Return the templates
        return res.status(200).json({
            success: true,
            templates
        });
    } catch (err) {
        logger.error(`Error getting templates: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to load templates',
            error: err.message
        });
    }
};

export default {
    getTemplates
};
