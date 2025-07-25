/**
 * Jira Routes for Custom Threat Dragon
 * Defines API endpoints for Jira integration
 */
import express from 'express';
import jiraController from '../controllers/jiraController.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware to validate request body
const validateJiraTicketRequest = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('strideCategory').notEmpty().withMessage('STRIDE category is required'),
  body('severity').optional().isIn(['High', 'Medium', 'Low']).withMessage('Severity must be High, Medium, or Low'),
  body('modelName').optional(),
  body('diagramName').optional(),
  body('mitigation').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * @route   POST /api/jira/create-ticket
 * @desc    Create a Jira ticket from threat data
 * @access  Private (requires authentication)
 */
router.post('/create-ticket', validateJiraTicketRequest, jiraController.createJiraTicket);

/**
 * @route   GET /api/jira/health
 * @desc    Check Jira integration health status
 * @access  Private (requires authentication)
 */
router.get('/health', (req, res) => {
  // Check if Jira configuration exists
  const jiraConfigured = process.env.JIRA_BASE_URL && 
                         process.env.JIRA_EMAIL && 
                         process.env.JIRA_API_TOKEN && 
                         process.env.JIRA_PROJECT_KEY;
  
  res.status(200).json({
    success: true,
    status: jiraConfigured ? 'configured' : 'not_configured',
    message: jiraConfigured ? 'Jira integration is configured' : 'Jira integration is not fully configured'
  });
});

export default router;
