/**
 * Atlas Orchestrator - Handler Exports
 *
 * Central export for all action handlers
 */

export { getUIPreferences, updateUIPreferences } from "./ui-preferences.ts";
export { createTask, updateTask, deleteTask, getTasks } from "./task-queue.ts";
export {
  createPersonalItem,
  updatePersonalItem,
  completePersonalItem,
  deletePersonalItem,
  getPersonalItems,
  createPersonalGoal,
  updateGoalProgress,
  createPersonalHabit,
  completeHabit,
  getPersonalSummary,
  syncMemoryTasks,
} from "./personal-hub.ts";
export { getConversationHistory, chat } from "./conversation-memory.ts";
export { sendNotification, getNotifications, dismissNotification } from "./notifications.ts";
export {
  recordAgentPerformance,
  getAgentMemory,
  getSonicDNA,
  updateAgentRelationship,
  consolidateMemories,
  crystallizeKnowledge,
  runReflection,
  routeTask,
} from "./agent-memory.ts";
export { orchestrateAgents } from "./agent-orchestration.ts";
export { widgetInitialize, widgetExecute } from "./widget-agent.ts";
export {
  dashboardList,
  dashboardSelect,
  dashboardMessages,
  dashboardSendMessage,
  dashboardFiles,
  dashboardNotifications,
  dashboardMembers,
  dashboardSummary,
} from "./shared-dashboard.ts";
export { search, webSearch, synthesize } from "./search-synthesis.ts";
export { draftMessage, sendMessage, approveDraft, composeEmail } from "./communications.ts";
