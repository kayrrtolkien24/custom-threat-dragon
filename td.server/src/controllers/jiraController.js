/**
 * Jira Controller for Custom Threat Dragon
 * Handles integration with Atlassian Cloud Jira API
 */
import axios from 'axios';
import loggerHelper from '../helpers/logger.helper.js';

// Controller-level logger instance
const logger = loggerHelper.get('jiraController.js');

/**
 * Creates a Jira ticket from threat data
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing threat data
 * @param {string} req.body.title - Threat title
 * @param {string} req.body.description - Threat description
 * @param {string} req.body.strideCategory - STRIDE category of the threat
 * @param {string} req.body.severity - Severity of the threat (High, Medium, Low)
 * @param {string} req.body.modelName - Name of the threat model
 * @param {string} req.body.diagramName - Name of the diagram
 * @param {Object} res - Express response object
 */
async function createJiraTicket(req, res) {
    // Extract threat data from request body
    const { 
        title, 
        description, 
        strideCategory, 
        severity = 'Medium', 
        modelName, 
        diagramName,
        mitigation = ''
    } = req.body;

    // Validate required fields
    if (!title || !description || !strideCategory) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: title, description, or strideCategory' 
        });
    }

    // Get Jira configuration from environment variables
    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraApiToken = process.env.JIRA_API_TOKEN;
    const jiraProjectKey = process.env.JIRA_PROJECT_KEY;

    // Validate Jira configuration
    if (!jiraBaseUrl || !jiraEmail || !jiraApiToken || !jiraProjectKey) {
        logger.error('Missing Jira configuration in environment variables');
        return res.status(500).json({ 
            success: false, 
            message: 'Jira integration is not properly configured' 
        });
    }

    // Create Basic Auth token
    const base64Auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');

    // Map STRIDE category to appropriate Jira labels
    const strideLabels = {
        'Spoofing': ['security', 'spoofing', 'authentication'],
        'Tampering': ['security', 'tampering', 'integrity'],
        'Repudiation': ['security', 'repudiation', 'non-repudiation'],
        'Information Disclosure': ['security', 'information-disclosure', 'confidentiality'],
        'Denial of Service': ['security', 'denial-of-service', 'availability'],
        'Elevation of Privilege': ['security', 'elevation-of-privilege', 'authorization']
    };

    // Map severity to Jira priority
    const priorityMap = {
        'High': '1',
        'Medium': '2',
        'Low': '3'
    };

    try {
        // Prepare the Jira issue payload
        const issuePayload = {
            fields: {
                project: {
                    key: jiraProjectKey
                },
                summary: `[Security] ${title}`,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "heading",
                            attrs: { level: 2 },
                            content: [{ type: "text", text: "Threat Details" }]
                        },
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: description }]
                        },
                        {
                            type: "heading",
                            attrs: { level: 3 },
                            content: [{ type: "text", text: "Threat Model Information" }]
                        },
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: `Model: ${modelName || 'N/A'}` }]
                        },
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: `Diagram: ${diagramName || 'N/A'}` }]
                        },
                        {
                            type: "heading",
                            attrs: { level: 3 },
                            content: [{ type: "text", text: "STRIDE Category" }]
                        },
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: strideCategory }]
                        }
                    ]
                },
                issuetype: {
                    name: "Bug" // Using "Bug" type for security issues
                },
                priority: {
                    id: priorityMap[severity] || '2' // Default to Medium if not specified
                },
                labels: strideLabels[strideCategory] || ['security']
            }
        };

        // Add mitigation information if provided
        if (mitigation && mitigation.trim() !== '') {
            issuePayload.fields.description.content.push(
                {
                    type: "heading",
                    attrs: { level: 3 },
                    content: [{ type: "text", text: "Suggested Mitigation" }]
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: mitigation }]
                }
            );
        }

        // Make API call to create Jira issue
        const response = await axios({
            method: 'POST',
            url: `${jiraBaseUrl}/rest/api/3/issue`,
            headers: {
                'Authorization': `Basic ${base64Auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: issuePayload
        });

        // Return success response with Jira ticket details
        return res.status(201).json({
            success: true,
            message: 'Jira ticket created successfully',
            ticketId: response.data.key,
            ticketUrl: `${jiraBaseUrl}/browse/${response.data.key}`
        });

    } catch (error) {
        // Log the error (but not sensitive information)
        logger.error('Error creating Jira ticket:', error.message);
        
        // Return appropriate error response
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            return res.status(error.response.status).json({
                success: false,
                message: 'Failed to create Jira ticket',
                error: error.response.data.errorMessages || error.message
            });
        } else if (error.request) {
            // The request was made but no response was received
            return res.status(503).json({
                success: false,
                message: 'No response from Jira API',
                error: 'Service unavailable'
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            return res.status(500).json({
                success: false,
                message: 'Failed to create Jira ticket',
                error: 'Internal server error'
            });
        }
    }
}

export default {
    createJiraTicket
};
