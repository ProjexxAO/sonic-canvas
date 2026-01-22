import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export interface Integration {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  icon: string;
  category: IntegrationCategory;
  subcategory: string;
  provider: string;
  authType: 'oauth2' | 'api_key' | 'webhook' | 'native';
  status: 'available' | 'coming_soon' | 'beta' | 'connected';
  popularity: number;
  features: string[];
  capabilities: IntegrationCapability[];
  pricing: 'free' | 'freemium' | 'paid';
  setupTime: string;
  docsUrl?: string;
  supportedActions: string[];
  supportedTriggers: string[];
}

export type IntegrationCategory = 
  | 'productivity'
  | 'communication'
  | 'storage'
  | 'calendar'
  | 'finance'
  | 'crm'
  | 'marketing'
  | 'development'
  | 'analytics'
  | 'social'
  | 'ecommerce'
  | 'hr'
  | 'project_management'
  | 'design'
  | 'ai'
  | 'security'
  | 'support'
  | 'automation';

export interface IntegrationCapability {
  name: string;
  type: 'read' | 'write' | 'sync' | 'trigger' | 'action';
  description: string;
}

export interface ConnectedIntegration extends Integration {
  connectedAt: Date;
  lastSyncAt?: Date;
  syncStatus: 'active' | 'paused' | 'error';
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  dataPoints: number;
  permissions: string[];
}

const INTEGRATION_CATALOG: Integration[] = [
  // Communication
  { id: 'gmail', name: 'Gmail', shortDescription: 'Email sync & management', description: 'Sync emails, labels, and contacts. Draft and send emails via Atlas.', icon: '📧', category: 'communication', subcategory: 'email', provider: 'Google', authType: 'oauth2', status: 'available', popularity: 98, features: ['Email sync', 'Label management', 'Contact sync', 'Draft creation'], capabilities: [{ name: 'Read emails', type: 'read', description: 'Access inbox and folders' }, { name: 'Send emails', type: 'write', description: 'Send and draft emails' }], pricing: 'free', setupTime: '2 min', supportedActions: ['send_email', 'create_draft', 'add_label'], supportedTriggers: ['new_email', 'email_opened'] },
  { id: 'outlook', name: 'Outlook', shortDescription: 'Microsoft email & calendar', description: 'Full integration with Microsoft 365 email, calendar, and contacts.', icon: '📬', category: 'communication', subcategory: 'email', provider: 'Microsoft', authType: 'oauth2', status: 'available', popularity: 95, features: ['Email sync', 'Calendar sync', 'Contact sync', 'Meeting scheduling'], capabilities: [{ name: 'Read emails', type: 'read', description: 'Access inbox' }], pricing: 'free', setupTime: '2 min', supportedActions: ['send_email', 'schedule_meeting'], supportedTriggers: ['new_email', 'meeting_reminder'] },
  { id: 'slack', name: 'Slack', shortDescription: 'Team messaging', description: 'Send messages, manage channels, and receive notifications.', icon: '💬', category: 'communication', subcategory: 'messaging', provider: 'Slack', authType: 'oauth2', status: 'available', popularity: 94, features: ['Channel messaging', 'DMs', 'File sharing', 'Notifications'], capabilities: [{ name: 'Send messages', type: 'write', description: 'Post to channels' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['send_message', 'create_channel'], supportedTriggers: ['new_message', 'mention'] },
  { id: 'teams', name: 'Microsoft Teams', shortDescription: 'Enterprise collaboration', description: 'Chat, meetings, and collaboration for Microsoft 365.', icon: '👥', category: 'communication', subcategory: 'messaging', provider: 'Microsoft', authType: 'oauth2', status: 'available', popularity: 91, features: ['Chat', 'Video calls', 'File sharing', 'Channels'], capabilities: [{ name: 'Send messages', type: 'write', description: 'Post to chats' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['send_message', 'schedule_meeting'], supportedTriggers: ['new_message', 'meeting_started'] },
  { id: 'whatsapp', name: 'WhatsApp Business', shortDescription: 'Messaging platform', description: 'Business messaging with customers and team members.', icon: '📱', category: 'communication', subcategory: 'messaging', provider: 'Meta', authType: 'api_key', status: 'available', popularity: 89, features: ['Messaging', 'Templates', 'Media sharing'], capabilities: [{ name: 'Send messages', type: 'write', description: 'Send WhatsApp messages' }], pricing: 'paid', setupTime: '10 min', supportedActions: ['send_message', 'send_template'], supportedTriggers: ['new_message'] },
  { id: 'discord', name: 'Discord', shortDescription: 'Community messaging', description: 'Manage Discord servers, channels, and bots.', icon: '🎮', category: 'communication', subcategory: 'messaging', provider: 'Discord', authType: 'oauth2', status: 'available', popularity: 82, features: ['Server management', 'Bot integration', 'Webhooks'], capabilities: [{ name: 'Send messages', type: 'write', description: 'Post to channels' }], pricing: 'free', setupTime: '3 min', supportedActions: ['send_message', 'create_channel'], supportedTriggers: ['new_message'] },
  { id: 'zoom', name: 'Zoom', shortDescription: 'Video conferencing', description: 'Schedule and manage video meetings.', icon: '📹', category: 'communication', subcategory: 'meetings', provider: 'Zoom', authType: 'oauth2', status: 'available', popularity: 90, features: ['Meeting scheduling', 'Recordings', 'Transcripts'], capabilities: [{ name: 'Create meetings', type: 'write', description: 'Schedule Zoom calls' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_meeting', 'get_recording'], supportedTriggers: ['meeting_started', 'meeting_ended'] },
  
  // Productivity
  { id: 'notion', name: 'Notion', shortDescription: 'Workspace & docs', description: 'Sync pages, databases, and wikis with your workspace.', icon: '📝', category: 'productivity', subcategory: 'docs', provider: 'Notion', authType: 'oauth2', status: 'available', popularity: 93, features: ['Page sync', 'Database integration', 'Block editing'], capabilities: [{ name: 'Read pages', type: 'read', description: 'Access Notion content' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_page', 'update_database'], supportedTriggers: ['page_updated', 'new_database_item'] },
  { id: 'asana', name: 'Asana', shortDescription: 'Project management', description: 'Manage tasks, projects, and team workflows.', icon: '📋', category: 'project_management', subcategory: 'tasks', provider: 'Asana', authType: 'oauth2', status: 'available', popularity: 88, features: ['Task management', 'Project tracking', 'Team collaboration'], capabilities: [{ name: 'Manage tasks', type: 'sync', description: 'Full task sync' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_task', 'update_task'], supportedTriggers: ['task_completed', 'task_assigned'] },
  { id: 'trello', name: 'Trello', shortDescription: 'Kanban boards', description: 'Visual project management with boards and cards.', icon: '📊', category: 'project_management', subcategory: 'kanban', provider: 'Atlassian', authType: 'oauth2', status: 'available', popularity: 86, features: ['Board management', 'Card automation', 'Power-ups'], capabilities: [{ name: 'Manage cards', type: 'sync', description: 'Sync Trello cards' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_card', 'move_card'], supportedTriggers: ['card_moved', 'card_created'] },
  { id: 'jira', name: 'Jira', shortDescription: 'Issue tracking', description: 'Agile project management and issue tracking.', icon: '🎯', category: 'project_management', subcategory: 'issues', provider: 'Atlassian', authType: 'oauth2', status: 'available', popularity: 87, features: ['Issue tracking', 'Sprint planning', 'Roadmaps'], capabilities: [{ name: 'Manage issues', type: 'sync', description: 'Sync Jira issues' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['create_issue', 'update_issue'], supportedTriggers: ['issue_updated', 'sprint_started'] },
  { id: 'linear', name: 'Linear', shortDescription: 'Modern issue tracker', description: 'Fast and beautiful issue tracking for teams.', icon: '⚡', category: 'project_management', subcategory: 'issues', provider: 'Linear', authType: 'oauth2', status: 'available', popularity: 84, features: ['Issue tracking', 'Cycles', 'Roadmaps'], capabilities: [{ name: 'Manage issues', type: 'sync', description: 'Sync Linear issues' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_issue', 'update_issue'], supportedTriggers: ['issue_created', 'cycle_completed'] },
  { id: 'monday', name: 'Monday.com', shortDescription: 'Work management', description: 'Flexible work management platform.', icon: '📅', category: 'project_management', subcategory: 'work', provider: 'Monday', authType: 'oauth2', status: 'available', popularity: 83, features: ['Board management', 'Automations', 'Dashboards'], capabilities: [{ name: 'Manage items', type: 'sync', description: 'Sync Monday items' }], pricing: 'paid', setupTime: '3 min', supportedActions: ['create_item', 'update_item'], supportedTriggers: ['item_created', 'status_changed'] },
  { id: 'clickup', name: 'ClickUp', shortDescription: 'All-in-one productivity', description: 'Tasks, docs, goals, and more in one app.', icon: '✅', category: 'project_management', subcategory: 'all-in-one', provider: 'ClickUp', authType: 'oauth2', status: 'available', popularity: 85, features: ['Task management', 'Docs', 'Goals', 'Time tracking'], capabilities: [{ name: 'Manage tasks', type: 'sync', description: 'Sync ClickUp tasks' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_task', 'update_task'], supportedTriggers: ['task_completed', 'goal_achieved'] },
  
  // Storage
  { id: 'google_drive', name: 'Google Drive', shortDescription: 'Cloud storage', description: 'Access and manage files in Google Drive.', icon: '📁', category: 'storage', subcategory: 'cloud', provider: 'Google', authType: 'oauth2', status: 'available', popularity: 96, features: ['File sync', 'Folder management', 'Sharing'], capabilities: [{ name: 'Access files', type: 'sync', description: 'Full file access' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['upload_file', 'create_folder'], supportedTriggers: ['file_uploaded', 'file_shared'] },
  { id: 'dropbox', name: 'Dropbox', shortDescription: 'File storage', description: 'Cloud file storage and sharing.', icon: '📦', category: 'storage', subcategory: 'cloud', provider: 'Dropbox', authType: 'oauth2', status: 'available', popularity: 88, features: ['File sync', 'Sharing', 'Paper docs'], capabilities: [{ name: 'Access files', type: 'sync', description: 'Full file access' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['upload_file', 'share_file'], supportedTriggers: ['file_uploaded', 'file_deleted'] },
  { id: 'onedrive', name: 'OneDrive', shortDescription: 'Microsoft storage', description: 'Microsoft 365 cloud storage.', icon: '☁️', category: 'storage', subcategory: 'cloud', provider: 'Microsoft', authType: 'oauth2', status: 'available', popularity: 87, features: ['File sync', 'Office integration', 'Sharing'], capabilities: [{ name: 'Access files', type: 'sync', description: 'Full file access' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['upload_file', 'share_file'], supportedTriggers: ['file_uploaded'] },
  { id: 'box', name: 'Box', shortDescription: 'Enterprise storage', description: 'Secure enterprise file management.', icon: '🗃️', category: 'storage', subcategory: 'enterprise', provider: 'Box', authType: 'oauth2', status: 'available', popularity: 78, features: ['File management', 'Workflow automation', 'Governance'], capabilities: [{ name: 'Access files', type: 'sync', description: 'Full file access' }], pricing: 'paid', setupTime: '5 min', supportedActions: ['upload_file', 'create_folder'], supportedTriggers: ['file_uploaded', 'file_approved'] },
  
  // Calendar
  { id: 'google_calendar', name: 'Google Calendar', shortDescription: 'Event management', description: 'Full calendar sync and scheduling.', icon: '📆', category: 'calendar', subcategory: 'scheduling', provider: 'Google', authType: 'oauth2', status: 'available', popularity: 97, features: ['Event sync', 'Meeting scheduling', 'Reminders'], capabilities: [{ name: 'Manage events', type: 'sync', description: 'Full calendar access' }], pricing: 'free', setupTime: '2 min', supportedActions: ['create_event', 'update_event'], supportedTriggers: ['event_created', 'event_starting'] },
  { id: 'calendly', name: 'Calendly', shortDescription: 'Scheduling automation', description: 'Automated meeting scheduling.', icon: '🗓️', category: 'calendar', subcategory: 'booking', provider: 'Calendly', authType: 'oauth2', status: 'available', popularity: 89, features: ['Booking pages', 'Team scheduling', 'Integrations'], capabilities: [{ name: 'Manage bookings', type: 'sync', description: 'Booking management' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['create_event_type', 'cancel_booking'], supportedTriggers: ['booking_created', 'booking_cancelled'] },
  
  // Finance
  { id: 'stripe', name: 'Stripe', shortDescription: 'Payment processing', description: 'Accept payments and manage subscriptions.', icon: '💳', category: 'finance', subcategory: 'payments', provider: 'Stripe', authType: 'api_key', status: 'available', popularity: 92, features: ['Payment processing', 'Subscriptions', 'Invoicing'], capabilities: [{ name: 'Process payments', type: 'action', description: 'Handle transactions' }], pricing: 'paid', setupTime: '5 min', supportedActions: ['create_invoice', 'refund_payment'], supportedTriggers: ['payment_received', 'subscription_created'] },
  { id: 'quickbooks', name: 'QuickBooks', shortDescription: 'Accounting software', description: 'Small business accounting and invoicing.', icon: '📊', category: 'finance', subcategory: 'accounting', provider: 'Intuit', authType: 'oauth2', status: 'available', popularity: 86, features: ['Invoicing', 'Expense tracking', 'Reports'], capabilities: [{ name: 'Manage finances', type: 'sync', description: 'Full accounting sync' }], pricing: 'paid', setupTime: '10 min', supportedActions: ['create_invoice', 'record_expense'], supportedTriggers: ['invoice_paid', 'expense_created'] },
  { id: 'xero', name: 'Xero', shortDescription: 'Cloud accounting', description: 'Beautiful accounting for small businesses.', icon: '💰', category: 'finance', subcategory: 'accounting', provider: 'Xero', authType: 'oauth2', status: 'available', popularity: 82, features: ['Invoicing', 'Bank reconciliation', 'Payroll'], capabilities: [{ name: 'Manage finances', type: 'sync', description: 'Full accounting sync' }], pricing: 'paid', setupTime: '10 min', supportedActions: ['create_invoice', 'reconcile_transaction'], supportedTriggers: ['invoice_created', 'payment_received'] },
  { id: 'plaid', name: 'Plaid', shortDescription: 'Bank connections', description: 'Connect to bank accounts for transaction data.', icon: '🏦', category: 'finance', subcategory: 'banking', provider: 'Plaid', authType: 'oauth2', status: 'available', popularity: 88, features: ['Bank linking', 'Transaction sync', 'Balance checks'], capabilities: [{ name: 'Read transactions', type: 'read', description: 'Access bank data' }], pricing: 'paid', setupTime: '5 min', supportedActions: ['get_balance', 'get_transactions'], supportedTriggers: ['new_transaction', 'low_balance'] },
  
  // CRM
  { id: 'salesforce', name: 'Salesforce', shortDescription: 'Enterprise CRM', description: 'Complete customer relationship management.', icon: '☁️', category: 'crm', subcategory: 'enterprise', provider: 'Salesforce', authType: 'oauth2', status: 'available', popularity: 91, features: ['Contact management', 'Deal tracking', 'Reports'], capabilities: [{ name: 'Manage CRM', type: 'sync', description: 'Full CRM sync' }], pricing: 'paid', setupTime: '15 min', supportedActions: ['create_contact', 'update_deal'], supportedTriggers: ['deal_won', 'contact_created'] },
  { id: 'hubspot', name: 'HubSpot', shortDescription: 'Marketing & CRM', description: 'Inbound marketing, sales, and CRM.', icon: '🧲', category: 'crm', subcategory: 'marketing', provider: 'HubSpot', authType: 'oauth2', status: 'available', popularity: 90, features: ['Contact management', 'Email marketing', 'Deals'], capabilities: [{ name: 'Manage CRM', type: 'sync', description: 'Full CRM sync' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['create_contact', 'send_email'], supportedTriggers: ['form_submitted', 'deal_stage_changed'] },
  { id: 'pipedrive', name: 'Pipedrive', shortDescription: 'Sales CRM', description: 'Visual sales pipeline management.', icon: '🎯', category: 'crm', subcategory: 'sales', provider: 'Pipedrive', authType: 'oauth2', status: 'available', popularity: 84, features: ['Pipeline management', 'Deal tracking', 'Automation'], capabilities: [{ name: 'Manage deals', type: 'sync', description: 'Full CRM sync' }], pricing: 'paid', setupTime: '5 min', supportedActions: ['create_deal', 'update_stage'], supportedTriggers: ['deal_won', 'deal_created'] },
  { id: 'airtable', name: 'Airtable', shortDescription: 'Spreadsheet-database', description: 'Flexible database with spreadsheet interface.', icon: '📊', category: 'productivity', subcategory: 'database', provider: 'Airtable', authType: 'api_key', status: 'available', popularity: 87, features: ['Database management', 'Views', 'Automations'], capabilities: [{ name: 'Manage records', type: 'sync', description: 'Full database access' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['create_record', 'update_record'], supportedTriggers: ['record_created', 'record_updated'] },
  
  // Marketing
  { id: 'mailchimp', name: 'Mailchimp', shortDescription: 'Email marketing', description: 'Email campaigns and marketing automation.', icon: '🐒', category: 'marketing', subcategory: 'email', provider: 'Mailchimp', authType: 'oauth2', status: 'available', popularity: 88, features: ['Email campaigns', 'Automation', 'Analytics'], capabilities: [{ name: 'Send campaigns', type: 'action', description: 'Email marketing' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['send_campaign', 'add_subscriber'], supportedTriggers: ['campaign_sent', 'subscriber_added'] },
  { id: 'sendgrid', name: 'SendGrid', shortDescription: 'Email delivery', description: 'Transactional and marketing email platform.', icon: '📨', category: 'marketing', subcategory: 'email', provider: 'Twilio', authType: 'api_key', status: 'available', popularity: 85, features: ['Email delivery', 'Templates', 'Analytics'], capabilities: [{ name: 'Send emails', type: 'action', description: 'Email delivery' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['send_email', 'create_template'], supportedTriggers: ['email_delivered', 'email_opened'] },
  
  // Development
  { id: 'github', name: 'GitHub', shortDescription: 'Code hosting', description: 'Source code management and collaboration.', icon: '🐙', category: 'development', subcategory: 'vcs', provider: 'GitHub', authType: 'oauth2', status: 'available', popularity: 94, features: ['Repository management', 'Issues', 'Pull requests'], capabilities: [{ name: 'Manage repos', type: 'sync', description: 'Full repo access' }], pricing: 'freemium', setupTime: '2 min', supportedActions: ['create_issue', 'merge_pr'], supportedTriggers: ['push', 'pr_opened'] },
  { id: 'gitlab', name: 'GitLab', shortDescription: 'DevOps platform', description: 'Complete DevOps lifecycle in one application.', icon: '🦊', category: 'development', subcategory: 'devops', provider: 'GitLab', authType: 'oauth2', status: 'available', popularity: 86, features: ['CI/CD', 'Repository', 'Issues'], capabilities: [{ name: 'Manage projects', type: 'sync', description: 'Full GitLab access' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['create_issue', 'trigger_pipeline'], supportedTriggers: ['pipeline_completed', 'merge_request'] },
  
  // AI
  { id: 'openai', name: 'OpenAI', shortDescription: 'AI models', description: 'Access GPT and other AI models.', icon: '🤖', category: 'ai', subcategory: 'llm', provider: 'OpenAI', authType: 'api_key', status: 'available', popularity: 95, features: ['Chat completion', 'Embeddings', 'Image generation'], capabilities: [{ name: 'AI inference', type: 'action', description: 'Run AI models' }], pricing: 'paid', setupTime: '3 min', supportedActions: ['chat_completion', 'create_embedding'], supportedTriggers: [] },
  { id: 'anthropic', name: 'Anthropic Claude', shortDescription: 'AI assistant', description: 'Claude AI for analysis and generation.', icon: '🧠', category: 'ai', subcategory: 'llm', provider: 'Anthropic', authType: 'api_key', status: 'available', popularity: 88, features: ['Chat completion', 'Document analysis', 'Code generation'], capabilities: [{ name: 'AI inference', type: 'action', description: 'Run Claude' }], pricing: 'paid', setupTime: '3 min', supportedActions: ['chat_completion', 'analyze_document'], supportedTriggers: [] },
  
  // Automation
  { id: 'zapier', name: 'Zapier', shortDescription: 'Automation hub', description: 'Connect apps and automate workflows.', icon: '⚡', category: 'automation', subcategory: 'workflows', provider: 'Zapier', authType: 'webhook', status: 'available', popularity: 93, features: ['Workflow automation', '5000+ apps', 'Webhooks'], capabilities: [{ name: 'Trigger zaps', type: 'trigger', description: 'Webhook integration' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['trigger_webhook'], supportedTriggers: ['webhook_received'] },
  { id: 'make', name: 'Make (Integromat)', shortDescription: 'Visual automation', description: 'Visual automation platform with advanced logic.', icon: '🔧', category: 'automation', subcategory: 'workflows', provider: 'Make', authType: 'webhook', status: 'available', popularity: 86, features: ['Visual builder', 'Advanced logic', 'Data transformation'], capabilities: [{ name: 'Trigger scenarios', type: 'trigger', description: 'Webhook integration' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['trigger_scenario'], supportedTriggers: ['webhook_received'] },
  { id: 'n8n', name: 'n8n', shortDescription: 'Open-source automation', description: 'Self-hosted workflow automation.', icon: '🔄', category: 'automation', subcategory: 'open-source', provider: 'n8n', authType: 'webhook', status: 'available', popularity: 82, features: ['Self-hosted', 'Custom nodes', 'Webhooks'], capabilities: [{ name: 'Trigger workflows', type: 'trigger', description: 'Webhook integration' }], pricing: 'freemium', setupTime: '10 min', supportedActions: ['trigger_workflow'], supportedTriggers: ['webhook_received'] },
  
  // E-commerce
  { id: 'shopify', name: 'Shopify', shortDescription: 'E-commerce platform', description: 'Online store management and orders.', icon: '🛒', category: 'ecommerce', subcategory: 'store', provider: 'Shopify', authType: 'oauth2', status: 'available', popularity: 91, features: ['Order management', 'Inventory', 'Customer data'], capabilities: [{ name: 'Manage store', type: 'sync', description: 'Full store access' }], pricing: 'paid', setupTime: '5 min', supportedActions: ['create_order', 'update_inventory'], supportedTriggers: ['order_created', 'inventory_low'] },
  { id: 'woocommerce', name: 'WooCommerce', shortDescription: 'WordPress commerce', description: 'E-commerce for WordPress sites.', icon: '🛍️', category: 'ecommerce', subcategory: 'wordpress', provider: 'WooCommerce', authType: 'api_key', status: 'available', popularity: 84, features: ['Order management', 'Products', 'Customers'], capabilities: [{ name: 'Manage store', type: 'sync', description: 'Full store access' }], pricing: 'free', setupTime: '10 min', supportedActions: ['create_product', 'update_order'], supportedTriggers: ['order_created', 'product_purchased'] },
  
  // Social
  { id: 'twitter', name: 'X (Twitter)', shortDescription: 'Social platform', description: 'Post tweets and monitor mentions.', icon: '🐦', category: 'social', subcategory: 'microblog', provider: 'X', authType: 'oauth2', status: 'available', popularity: 87, features: ['Posting', 'Monitoring', 'DMs'], capabilities: [{ name: 'Post tweets', type: 'write', description: 'Social posting' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['post_tweet', 'send_dm'], supportedTriggers: ['mention', 'dm_received'] },
  { id: 'linkedin', name: 'LinkedIn', shortDescription: 'Professional network', description: 'Post updates and manage company pages.', icon: '💼', category: 'social', subcategory: 'professional', provider: 'LinkedIn', authType: 'oauth2', status: 'available', popularity: 85, features: ['Post updates', 'Company pages', 'Messaging'], capabilities: [{ name: 'Post updates', type: 'write', description: 'Social posting' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['post_update', 'send_message'], supportedTriggers: ['new_connection', 'message_received'] },
  { id: 'facebook', name: 'Facebook', shortDescription: 'Social platform', description: 'Manage pages and post updates.', icon: '👍', category: 'social', subcategory: 'social', provider: 'Meta', authType: 'oauth2', status: 'available', popularity: 86, features: ['Page management', 'Posting', 'Messenger'], capabilities: [{ name: 'Manage pages', type: 'sync', description: 'Page access' }], pricing: 'free', setupTime: '5 min', supportedActions: ['post_update', 'reply_comment'], supportedTriggers: ['new_message', 'new_comment'] },
  { id: 'instagram', name: 'Instagram', shortDescription: 'Photo sharing', description: 'Post media and manage business accounts.', icon: '📸', category: 'social', subcategory: 'visual', provider: 'Meta', authType: 'oauth2', status: 'available', popularity: 88, features: ['Media posting', 'Stories', 'DMs'], capabilities: [{ name: 'Post media', type: 'write', description: 'Social posting' }], pricing: 'free', setupTime: '5 min', supportedActions: ['post_media', 'reply_dm'], supportedTriggers: ['new_comment', 'new_dm'] },
  
  // Analytics
  { id: 'google_analytics', name: 'Google Analytics', shortDescription: 'Web analytics', description: 'Website traffic and user behavior analytics.', icon: '📈', category: 'analytics', subcategory: 'web', provider: 'Google', authType: 'oauth2', status: 'available', popularity: 94, features: ['Traffic data', 'User behavior', 'Conversions'], capabilities: [{ name: 'Read analytics', type: 'read', description: 'Access metrics' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['get_report'], supportedTriggers: ['traffic_spike', 'goal_completed'] },
  { id: 'mixpanel', name: 'Mixpanel', shortDescription: 'Product analytics', description: 'User behavior and product analytics.', icon: '📊', category: 'analytics', subcategory: 'product', provider: 'Mixpanel', authType: 'api_key', status: 'available', popularity: 83, features: ['Event tracking', 'Funnels', 'Cohorts'], capabilities: [{ name: 'Track events', type: 'write', description: 'Send events' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['track_event', 'get_funnel'], supportedTriggers: ['event_triggered'] },
  { id: 'amplitude', name: 'Amplitude', shortDescription: 'Digital analytics', description: 'Digital analytics for product teams.', icon: '📉', category: 'analytics', subcategory: 'product', provider: 'Amplitude', authType: 'api_key', status: 'available', popularity: 81, features: ['Behavioral analytics', 'Experiments', 'Cohorts'], capabilities: [{ name: 'Track events', type: 'write', description: 'Send events' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['track_event', 'get_chart'], supportedTriggers: ['event_triggered'] },
  
  // Support
  { id: 'zendesk', name: 'Zendesk', shortDescription: 'Customer support', description: 'Help desk and customer support platform.', icon: '🎧', category: 'support', subcategory: 'helpdesk', provider: 'Zendesk', authType: 'oauth2', status: 'available', popularity: 87, features: ['Ticketing', 'Knowledge base', 'Chat'], capabilities: [{ name: 'Manage tickets', type: 'sync', description: 'Full ticket access' }], pricing: 'paid', setupTime: '10 min', supportedActions: ['create_ticket', 'update_ticket'], supportedTriggers: ['ticket_created', 'ticket_solved'] },
  { id: 'intercom', name: 'Intercom', shortDescription: 'Customer messaging', description: 'Customer messaging and engagement.', icon: '💬', category: 'support', subcategory: 'messaging', provider: 'Intercom', authType: 'oauth2', status: 'available', popularity: 86, features: ['Live chat', 'Bots', 'Help center'], capabilities: [{ name: 'Manage conversations', type: 'sync', description: 'Full chat access' }], pricing: 'paid', setupTime: '5 min', supportedActions: ['send_message', 'create_ticket'], supportedTriggers: ['new_conversation', 'user_replied'] },
  { id: 'freshdesk', name: 'Freshdesk', shortDescription: 'Help desk', description: 'Customer support and ticketing.', icon: '🎫', category: 'support', subcategory: 'helpdesk', provider: 'Freshworks', authType: 'api_key', status: 'available', popularity: 82, features: ['Ticketing', 'Automation', 'Reporting'], capabilities: [{ name: 'Manage tickets', type: 'sync', description: 'Full ticket access' }], pricing: 'freemium', setupTime: '5 min', supportedActions: ['create_ticket', 'reply_ticket'], supportedTriggers: ['ticket_created', 'ticket_updated'] },
  
  // Design
  { id: 'figma', name: 'Figma', shortDescription: 'Design tool', description: 'Collaborative design and prototyping.', icon: '🎨', category: 'design', subcategory: 'ui', provider: 'Figma', authType: 'oauth2', status: 'available', popularity: 91, features: ['Design files', 'Components', 'Comments'], capabilities: [{ name: 'Access files', type: 'read', description: 'Read Figma files' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['get_file', 'export_assets'], supportedTriggers: ['comment_added', 'file_updated'] },
  { id: 'canva', name: 'Canva', shortDescription: 'Graphic design', description: 'Easy graphic design and templates.', icon: '🖼️', category: 'design', subcategory: 'graphics', provider: 'Canva', authType: 'oauth2', status: 'available', popularity: 88, features: ['Templates', 'Brand kit', 'Collaboration'], capabilities: [{ name: 'Create designs', type: 'write', description: 'Design creation' }], pricing: 'freemium', setupTime: '3 min', supportedActions: ['create_design', 'export_design'], supportedTriggers: ['design_published'] },
  
  // HR
  { id: 'bamboohr', name: 'BambooHR', shortDescription: 'HR software', description: 'Human resources management.', icon: '🎋', category: 'hr', subcategory: 'hris', provider: 'BambooHR', authType: 'api_key', status: 'available', popularity: 79, features: ['Employee data', 'Time off', 'Onboarding'], capabilities: [{ name: 'Manage employees', type: 'sync', description: 'HR data access' }], pricing: 'paid', setupTime: '10 min', supportedActions: ['update_employee', 'request_time_off'], supportedTriggers: ['employee_hired', 'time_off_approved'] },
  { id: 'gusto', name: 'Gusto', shortDescription: 'Payroll & HR', description: 'Payroll, benefits, and HR platform.', icon: '💵', category: 'hr', subcategory: 'payroll', provider: 'Gusto', authType: 'oauth2', status: 'available', popularity: 81, features: ['Payroll', 'Benefits', 'Time tracking'], capabilities: [{ name: 'Manage payroll', type: 'sync', description: 'Payroll access' }], pricing: 'paid', setupTime: '15 min', supportedActions: ['run_payroll', 'add_employee'], supportedTriggers: ['payroll_processed', 'employee_added'] },
];

const CATEGORY_INFO: Record<IntegrationCategory, { name: string; icon: string; description: string }> = {
  productivity: { name: 'Productivity', icon: '⚡', description: 'Task and document management' },
  communication: { name: 'Communication', icon: '💬', description: 'Email, chat, and messaging' },
  storage: { name: 'Storage', icon: '📁', description: 'File storage and sharing' },
  calendar: { name: 'Calendar', icon: '📅', description: 'Scheduling and events' },
  finance: { name: 'Finance', icon: '💰', description: 'Payments and accounting' },
  crm: { name: 'CRM', icon: '👥', description: 'Customer relationships' },
  marketing: { name: 'Marketing', icon: '📣', description: 'Email and campaigns' },
  development: { name: 'Development', icon: '💻', description: 'Code and DevOps' },
  analytics: { name: 'Analytics', icon: '📊', description: 'Data and insights' },
  social: { name: 'Social', icon: '📱', description: 'Social media platforms' },
  ecommerce: { name: 'E-commerce', icon: '🛒', description: 'Online stores' },
  hr: { name: 'HR', icon: '👔', description: 'Human resources' },
  project_management: { name: 'Project Management', icon: '📋', description: 'Tasks and projects' },
  design: { name: 'Design', icon: '🎨', description: 'Design tools' },
  ai: { name: 'AI', icon: '🤖', description: 'Artificial intelligence' },
  security: { name: 'Security', icon: '🔒', description: 'Security tools' },
  support: { name: 'Support', icon: '🎧', description: 'Customer support' },
  automation: { name: 'Automation', icon: '⚙️', description: 'Workflow automation' },
};

export const useIntegrationMarketplace = () => {
  const [integrations] = useState<Integration[]>(INTEGRATION_CATALOG);
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [isConnecting, setIsConnecting] = useState(false);

  // Get all categories
  const categories = useMemo(() => Object.entries(CATEGORY_INFO).map(([id, info]) => ({
    id: id as IntegrationCategory,
    ...info,
    count: integrations.filter(i => i.category === id).length,
  })), [integrations]);

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    let filtered = integrations;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(i => i.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.provider.toLowerCase().includes(query) ||
        i.subcategory.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => b.popularity - a.popularity);
  }, [integrations, selectedCategory, searchQuery]);

  // Popular integrations
  const popularIntegrations = useMemo(() => 
    integrations.filter(i => i.popularity >= 90).slice(0, 12),
    [integrations]
  );

  // Connect an integration
  const connectIntegration = useCallback(async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    setIsConnecting(true);
    
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const connected: ConnectedIntegration = {
      ...integration,
      status: 'connected',
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      syncStatus: 'active',
      syncFrequency: 'hourly',
      dataPoints: Math.floor(Math.random() * 1000),
      permissions: integration.capabilities.map(c => c.name),
    };
    
    setConnectedIntegrations(prev => [...prev, connected]);
    setIsConnecting(false);
    
    toast.success(`${integration.name} connected!`, {
      description: 'Initial sync started',
    });
    
    return connected;
  }, [integrations]);

  // Disconnect an integration
  const disconnectIntegration = useCallback((integrationId: string) => {
    const integration = connectedIntegrations.find(i => i.id === integrationId);
    if (!integration) return;

    setConnectedIntegrations(prev => prev.filter(i => i.id !== integrationId));
    toast.info(`${integration.name} disconnected`);
  }, [connectedIntegrations]);

  // Update sync settings
  const updateSyncSettings = useCallback((
    integrationId: string,
    settings: { syncFrequency?: ConnectedIntegration['syncFrequency']; syncStatus?: ConnectedIntegration['syncStatus'] }
  ) => {
    setConnectedIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { ...i, ...settings } : i
    ));
    toast.success('Sync settings updated');
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async (integrationId: string) => {
    const integration = connectedIntegrations.find(i => i.id === integrationId);
    if (!integration) return;

    toast.info(`Syncing ${integration.name}...`);
    
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setConnectedIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, lastSyncAt: new Date(), dataPoints: i.dataPoints + Math.floor(Math.random() * 50) }
        : i
    ));
    
    toast.success(`${integration.name} synced!`);
  }, [connectedIntegrations]);

  // Get integration by ID
  const getIntegration = useCallback((id: string) => 
    integrations.find(i => i.id === id),
    [integrations]
  );

  // Check if connected
  const isConnected = useCallback((id: string) => 
    connectedIntegrations.some(i => i.id === id),
    [connectedIntegrations]
  );

  // Stats
  const stats = useMemo(() => ({
    totalAvailable: integrations.length,
    connected: connectedIntegrations.length,
    activeSync: connectedIntegrations.filter(i => i.syncStatus === 'active').length,
    totalDataPoints: connectedIntegrations.reduce((sum, i) => sum + i.dataPoints, 0),
    categoryCounts: Object.fromEntries(
      categories.map(c => [c.id, integrations.filter(i => i.category === c.id).length])
    ),
  }), [integrations, connectedIntegrations, categories]);

  return {
    // State
    integrations,
    connectedIntegrations,
    searchQuery,
    selectedCategory,
    isConnecting,
    categories,
    filteredIntegrations,
    popularIntegrations,
    stats,
    categoryInfo: CATEGORY_INFO,
    
    // Actions
    connectIntegration,
    disconnectIntegration,
    updateSyncSettings,
    triggerSync,
    getIntegration,
    isConnected,
    
    // Setters
    setSearchQuery,
    setSelectedCategory,
  };
};
