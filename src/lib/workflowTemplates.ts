// Atlas Sonic OS - Pre-built Workflow Templates
// Enterprise workflow templates for common use cases

import { WorkflowNode, WorkflowConnection } from '@/hooks/useWorkflows';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'it_operations' | 'customer_service' | 'software_engineering' | 'supply_chain' | 'hr_operations' | 'finance' | 'marketing' | 'security';
  icon: string;
  complexity: 'simple' | 'moderate' | 'advanced';
  estimatedSetupTime: string;
  tags: string[];
  triggerType: string;
  actionType: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggerConfig: Record<string, any>;
  actionConfig: Record<string, any>;
  requiredIntegrations?: string[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // IT Operations Templates
  {
    id: 'it-incident-response',
    name: 'Incident Response Automation',
    description: 'Automatically triage, escalate, and track IT incidents based on severity and impact',
    category: 'it_operations',
    icon: 'alert-triangle',
    complexity: 'moderate',
    estimatedSetupTime: '15 min',
    tags: ['incident', 'automation', 'alerting', 'escalation'],
    triggerType: 'webhook',
    actionType: 'run_agent',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Incident Alert',
        config: { typeId: 'webhook', description: 'Receives incident alerts' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'Severity Check',
        config: { typeId: 'if_then', description: 'Check incident severity' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Run Security Agent',
        config: { typeId: 'run_agent', agentSector: 'SECURITY' },
        position: { x: 100, y: 310 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Notify On-Call',
        config: { typeId: 'send_notification', priority: 'high' },
        position: { x: 300, y: 310 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Create Task',
        config: { typeId: 'create_task', taskType: 'incident_response' },
        position: { x: 200, y: 440 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'condition-1' },
      { id: 'c2', sourceId: 'condition-1', targetId: 'action-1', label: 'Critical' },
      { id: 'c3', sourceId: 'condition-1', targetId: 'action-2', label: 'High' },
      { id: 'c4', sourceId: 'action-1', targetId: 'action-3' },
      { id: 'c5', sourceId: 'action-2', targetId: 'action-3' },
    ],
    triggerConfig: { endpoint: '/incidents', method: 'POST' },
    actionConfig: { agentId: 'security-agent', escalationThreshold: 'high' },
  },
  {
    id: 'it-system-health',
    name: 'System Health Monitor',
    description: 'Continuously monitor system health and trigger automated remediation for common issues',
    category: 'it_operations',
    icon: 'activity',
    complexity: 'simple',
    estimatedSetupTime: '10 min',
    tags: ['monitoring', 'health', 'automated-remediation'],
    triggerType: 'schedule',
    actionType: 'ai_analysis',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Every 15 minutes',
        config: { typeId: 'schedule', interval: '15m' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'AI Health Analysis',
        config: { typeId: 'ai_analysis', analysisType: 'system_health' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'Issues Detected?',
        config: { typeId: 'if_then' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Auto-Remediate',
        config: { typeId: 'run_agent', agentSector: 'UTILITY' },
        position: { x: 200, y: 440 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'condition-1' },
      { id: 'c3', sourceId: 'condition-1', targetId: 'action-2', label: 'Yes' },
    ],
    triggerConfig: { cronExpression: '*/15 * * * *' },
    actionConfig: { remediationTypes: ['restart', 'scale', 'cache_clear'] },
  },

  // Customer Service Templates
  {
    id: 'cs-ticket-triage',
    name: 'Smart Ticket Triage',
    description: 'Automatically categorize, prioritize, and route customer support tickets using AI',
    category: 'customer_service',
    icon: 'ticket',
    complexity: 'moderate',
    estimatedSetupTime: '20 min',
    tags: ['tickets', 'ai-triage', 'routing', 'prioritization'],
    triggerType: 'data_change',
    actionType: 'ai_analysis',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'New Ticket Created',
        config: { typeId: 'data_change', table: 'support_tickets' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'AI Sentiment Analysis',
        config: { typeId: 'ai_analysis', analysisType: 'sentiment' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Categorize Ticket',
        config: { typeId: 'ai_analysis', analysisType: 'categorization' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'VIP Customer?',
        config: { typeId: 'if_then' },
        position: { x: 200, y: 440 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Priority Escalation',
        config: { typeId: 'send_notification', channel: 'vip_support' },
        position: { x: 100, y: 570 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Standard Queue',
        config: { typeId: 'update_data', queue: 'standard' },
        position: { x: 300, y: 570 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'action-2' },
      { id: 'c3', sourceId: 'action-2', targetId: 'condition-1' },
      { id: 'c4', sourceId: 'condition-1', targetId: 'action-3', label: 'Yes' },
      { id: 'c5', sourceId: 'condition-1', targetId: 'action-4', label: 'No' },
    ],
    triggerConfig: { event: 'INSERT', table: 'support_tickets' },
    actionConfig: { routingRules: 'auto', slaTracking: true },
  },
  {
    id: 'cs-response-generator',
    name: 'AI Response Generator',
    description: 'Generate contextual response suggestions for customer inquiries',
    category: 'customer_service',
    icon: 'message-square',
    complexity: 'simple',
    estimatedSetupTime: '10 min',
    tags: ['ai', 'responses', 'suggestions', 'customer-support'],
    triggerType: 'data_change',
    actionType: 'ai_analysis',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Customer Message',
        config: { typeId: 'data_change' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Generate Response',
        config: { typeId: 'ai_analysis', analysisType: 'response_generation' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Notify Agent',
        config: { typeId: 'send_notification' },
        position: { x: 200, y: 310 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'action-2' },
    ],
    triggerConfig: { event: 'INSERT', table: 'messages' },
    actionConfig: { responseStyle: 'professional', maxSuggestions: 3 },
  },

  // Software Engineering Templates
  {
    id: 'se-code-review',
    name: 'Automated Code Review',
    description: 'AI-powered code review with security scanning and best practice checks',
    category: 'software_engineering',
    icon: 'code',
    complexity: 'moderate',
    estimatedSetupTime: '15 min',
    tags: ['code-review', 'security', 'best-practices', 'automation'],
    triggerType: 'webhook',
    actionType: 'run_agent',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'PR Created',
        config: { typeId: 'webhook', source: 'github' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Security Scan',
        config: { typeId: 'run_agent', agentSector: 'SECURITY' },
        position: { x: 100, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Code Analysis',
        config: { typeId: 'run_agent', agentSector: 'DATA' },
        position: { x: 300, y: 180 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Generate Report',
        config: { typeId: 'generate_report' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Post Review Comment',
        config: { typeId: 'call_api', target: 'github' },
        position: { x: 200, y: 440 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'trigger-1', targetId: 'action-2' },
      { id: 'c3', sourceId: 'action-1', targetId: 'action-3' },
      { id: 'c4', sourceId: 'action-2', targetId: 'action-3' },
      { id: 'c5', sourceId: 'action-3', targetId: 'action-4' },
    ],
    triggerConfig: { events: ['pull_request.opened', 'pull_request.synchronize'] },
    actionConfig: { checkTypes: ['security', 'performance', 'style'] },
    requiredIntegrations: ['github'],
  },
  {
    id: 'se-deployment-pipeline',
    name: 'Smart Deployment Pipeline',
    description: 'Intelligent deployment with automated rollback based on health metrics',
    category: 'software_engineering',
    icon: 'rocket',
    complexity: 'advanced',
    estimatedSetupTime: '30 min',
    tags: ['deployment', 'ci-cd', 'rollback', 'monitoring'],
    triggerType: 'webhook',
    actionType: 'run_agent',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Deployment Trigger',
        config: { typeId: 'webhook' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Run Tests',
        config: { typeId: 'run_agent', agentSector: 'UTILITY' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'Tests Pass?',
        config: { typeId: 'if_then' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Deploy to Staging',
        config: { typeId: 'call_api' },
        position: { x: 200, y: 440 },
      },
      {
        id: 'condition-2',
        type: 'condition',
        label: 'Health Check OK?',
        config: { typeId: 'if_then' },
        position: { x: 200, y: 570 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Deploy to Production',
        config: { typeId: 'call_api' },
        position: { x: 100, y: 700 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Rollback',
        config: { typeId: 'call_api' },
        position: { x: 300, y: 700 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'condition-1' },
      { id: 'c3', sourceId: 'condition-1', targetId: 'action-2', label: 'Pass' },
      { id: 'c4', sourceId: 'action-2', targetId: 'condition-2' },
      { id: 'c5', sourceId: 'condition-2', targetId: 'action-3', label: 'Healthy' },
      { id: 'c6', sourceId: 'condition-2', targetId: 'action-4', label: 'Unhealthy' },
    ],
    triggerConfig: { events: ['deploy'] },
    actionConfig: { environments: ['staging', 'production'], healthCheckTimeout: 60000 },
  },

  // Supply Chain Templates
  {
    id: 'sc-inventory-optimization',
    name: 'Inventory Optimization',
    description: 'AI-driven inventory management with demand forecasting and reorder automation',
    category: 'supply_chain',
    icon: 'package',
    complexity: 'moderate',
    estimatedSetupTime: '20 min',
    tags: ['inventory', 'forecasting', 'reorder', 'optimization'],
    triggerType: 'schedule',
    actionType: 'ai_analysis',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Daily Check',
        config: { typeId: 'schedule', interval: '24h' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Demand Forecast',
        config: { typeId: 'ai_analysis', analysisType: 'forecasting' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Check Stock Levels',
        config: { typeId: 'run_agent', agentSector: 'DATA' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'Reorder Needed?',
        config: { typeId: 'if_then' },
        position: { x: 200, y: 440 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Generate PO',
        config: { typeId: 'create_task', taskType: 'purchase_order' },
        position: { x: 100, y: 570 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Update Dashboard',
        config: { typeId: 'update_data' },
        position: { x: 300, y: 570 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'action-2' },
      { id: 'c3', sourceId: 'action-2', targetId: 'condition-1' },
      { id: 'c4', sourceId: 'condition-1', targetId: 'action-3', label: 'Yes' },
      { id: 'c5', sourceId: 'condition-1', targetId: 'action-4', label: 'No' },
      { id: 'c6', sourceId: 'action-3', targetId: 'action-4' },
    ],
    triggerConfig: { cronExpression: '0 6 * * *' },
    actionConfig: { reorderThreshold: 0.2, leadTimeDays: 7 },
  },
  {
    id: 'sc-supplier-performance',
    name: 'Supplier Performance Tracker',
    description: 'Monitor and analyze supplier performance with automated scorecards',
    category: 'supply_chain',
    icon: 'truck',
    complexity: 'simple',
    estimatedSetupTime: '15 min',
    tags: ['suppliers', 'performance', 'scorecards', 'analytics'],
    triggerType: 'schedule',
    actionType: 'generate_report',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Weekly Analysis',
        config: { typeId: 'schedule', interval: '7d' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Gather Metrics',
        config: { typeId: 'run_agent', agentSector: 'DATA' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Generate Scorecard',
        config: { typeId: 'generate_report', reportType: 'scorecard' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Send to Stakeholders',
        config: { typeId: 'send_email' },
        position: { x: 200, y: 440 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'action-2' },
      { id: 'c3', sourceId: 'action-2', targetId: 'action-3' },
    ],
    triggerConfig: { cronExpression: '0 9 * * MON' },
    actionConfig: { metrics: ['delivery_time', 'quality', 'cost', 'responsiveness'] },
  },

  // HR Operations Templates
  {
    id: 'hr-onboarding',
    name: 'Employee Onboarding',
    description: 'Automated onboarding workflow with task assignments and progress tracking',
    category: 'hr_operations',
    icon: 'user-plus',
    complexity: 'moderate',
    estimatedSetupTime: '25 min',
    tags: ['onboarding', 'hr', 'automation', 'tasks'],
    triggerType: 'data_change',
    actionType: 'create_task',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'New Employee Added',
        config: { typeId: 'data_change', table: 'employees' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Create IT Tasks',
        config: { typeId: 'create_task', category: 'it_setup' },
        position: { x: 100, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Create HR Tasks',
        config: { typeId: 'create_task', category: 'hr_paperwork' },
        position: { x: 300, y: 180 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Schedule Orientation',
        config: { typeId: 'create_task', category: 'orientation' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Send Welcome Email',
        config: { typeId: 'send_email', template: 'welcome' },
        position: { x: 200, y: 440 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'trigger-1', targetId: 'action-2' },
      { id: 'c3', sourceId: 'action-1', targetId: 'action-3' },
      { id: 'c4', sourceId: 'action-2', targetId: 'action-3' },
      { id: 'c5', sourceId: 'action-3', targetId: 'action-4' },
    ],
    triggerConfig: { event: 'INSERT', table: 'employees' },
    actionConfig: { taskTemplates: ['laptop_setup', 'access_provisioning', 'benefits_enrollment'] },
  },

  // Finance Templates
  {
    id: 'fin-expense-approval',
    name: 'Expense Approval Workflow',
    description: 'Automated expense review with AI fraud detection and approval routing',
    category: 'finance',
    icon: 'credit-card',
    complexity: 'moderate',
    estimatedSetupTime: '20 min',
    tags: ['expenses', 'approval', 'fraud-detection', 'finance'],
    triggerType: 'data_change',
    actionType: 'run_agent',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Expense Submitted',
        config: { typeId: 'data_change', table: 'expenses' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'AI Fraud Check',
        config: { typeId: 'run_agent', agentSector: 'FINANCE' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'Amount > $500?',
        config: { typeId: 'if_then', threshold: 500 },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Manager Approval',
        config: { typeId: 'create_task', approvalType: 'manager' },
        position: { x: 100, y: 440 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Auto-Approve',
        config: { typeId: 'update_data', status: 'approved' },
        position: { x: 300, y: 440 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'condition-1' },
      { id: 'c3', sourceId: 'condition-1', targetId: 'action-2', label: 'Yes' },
      { id: 'c4', sourceId: 'condition-1', targetId: 'action-3', label: 'No' },
    ],
    triggerConfig: { event: 'INSERT', table: 'expenses' },
    actionConfig: { approvalThresholds: [500, 5000, 25000] },
  },

  // Marketing Templates
  {
    id: 'mkt-campaign-optimizer',
    name: 'Campaign Performance Optimizer',
    description: 'AI-powered campaign analysis with automated budget reallocation recommendations',
    category: 'marketing',
    icon: 'trending-up',
    complexity: 'moderate',
    estimatedSetupTime: '20 min',
    tags: ['campaigns', 'optimization', 'ai', 'budget'],
    triggerType: 'schedule',
    actionType: 'ai_analysis',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Daily Analysis',
        config: { typeId: 'schedule', interval: '24h' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Gather Campaign Data',
        config: { typeId: 'run_agent', agentSector: 'DATA' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'AI Performance Analysis',
        config: { typeId: 'ai_analysis', analysisType: 'campaign_performance' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Generate Recommendations',
        config: { typeId: 'run_agent', agentSector: 'CREATIVE' },
        position: { x: 200, y: 440 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Send Report',
        config: { typeId: 'generate_report' },
        position: { x: 200, y: 570 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'action-2' },
      { id: 'c3', sourceId: 'action-2', targetId: 'action-3' },
      { id: 'c4', sourceId: 'action-3', targetId: 'action-4' },
    ],
    triggerConfig: { cronExpression: '0 8 * * *' },
    actionConfig: { platforms: ['google_ads', 'facebook', 'linkedin'], metricsToTrack: ['cpc', 'ctr', 'conversions'] },
  },

  // Security Templates
  {
    id: 'sec-threat-monitoring',
    name: 'Continuous Threat Monitoring',
    description: 'Real-time security monitoring with automated threat response',
    category: 'security',
    icon: 'shield',
    complexity: 'advanced',
    estimatedSetupTime: '30 min',
    tags: ['security', 'threat-detection', 'automated-response', 'monitoring'],
    triggerType: 'webhook',
    actionType: 'run_agent',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        label: 'Security Event',
        config: { typeId: 'webhook', source: 'siem' },
        position: { x: 200, y: 50 },
      },
      {
        id: 'action-1',
        type: 'action',
        label: 'Threat Analysis',
        config: { typeId: 'run_agent', agentSector: 'SECURITY' },
        position: { x: 200, y: 180 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        label: 'Threat Level',
        config: { typeId: 'if_then' },
        position: { x: 200, y: 310 },
      },
      {
        id: 'action-2',
        type: 'action',
        label: 'Emergency Response',
        config: { typeId: 'run_agent', agentSector: 'SECURITY', mode: 'emergency' },
        position: { x: 100, y: 440 },
      },
      {
        id: 'action-3',
        type: 'action',
        label: 'Log & Monitor',
        config: { typeId: 'update_data' },
        position: { x: 300, y: 440 },
      },
      {
        id: 'action-4',
        type: 'action',
        label: 'Alert Security Team',
        config: { typeId: 'send_notification', channel: 'security_ops' },
        position: { x: 200, y: 570 },
      },
    ],
    connections: [
      { id: 'c1', sourceId: 'trigger-1', targetId: 'action-1' },
      { id: 'c2', sourceId: 'action-1', targetId: 'condition-1' },
      { id: 'c3', sourceId: 'condition-1', targetId: 'action-2', label: 'Critical' },
      { id: 'c4', sourceId: 'condition-1', targetId: 'action-3', label: 'Low' },
      { id: 'c5', sourceId: 'action-2', targetId: 'action-4' },
    ],
    triggerConfig: { eventTypes: ['intrusion', 'malware', 'anomaly', 'policy_violation'] },
    actionConfig: { autoBlockThreshold: 'high', notificationChannels: ['slack', 'pagerduty'] },
  },
];

// Get templates by category
export const getTemplatesByCategory = (category: WorkflowTemplate['category']): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
};

// Get all categories with counts
export const getTemplateCategoryCounts = (): Record<string, number> => {
  return WORKFLOW_TEMPLATES.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

// Search templates
export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Category metadata
export const TEMPLATE_CATEGORIES = [
  { id: 'it_operations', label: 'IT Operations', icon: 'server', color: '#4488ff' },
  { id: 'customer_service', label: 'Customer Service', icon: 'headphones', color: '#00ffd5' },
  { id: 'software_engineering', label: 'Software Engineering', icon: 'code', color: '#ff3366' },
  { id: 'supply_chain', label: 'Supply Chain', icon: 'truck', color: '#ffaa00' },
  { id: 'hr_operations', label: 'HR Operations', icon: 'users', color: '#00ff88' },
  { id: 'finance', label: 'Finance', icon: 'dollar-sign', color: '#00ffd5' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone', color: '#ff6b35' },
  { id: 'security', label: 'Security', icon: 'shield', color: '#ff3366' },
];
