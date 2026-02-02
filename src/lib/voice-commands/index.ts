/**
 * Voice Commands Module - Main Export
 * Provides universal command support for Atlas
 */

// Export all types
export * from './types';

// Export extended parser
export { parseExtendedCommand } from './extended-parser';
export { 
  parseCRMCommand, 
  parseProjectCommand, 
  parseAnalyticsCommand, 
  parseIoTCommand, 
  parseScheduledCommand, 
  parseMultiStepCommand,
  parseInteractionCommand,
  parseAutomationCommand
} from './extended-parser';
