/**
 * Atlas Orchestrator - Handler Exports
 *
 * Central export for all action handlers
 */

export { getUIPreferences, updateUIPreferences } from "./preferences.ts";
export { createTask, updateTask, deleteTask, getTasks } from "./tasks.ts";
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
} from "./personal.ts";
export { getConversationHistory, chat } from "./conversation.ts";
export { sendNotification, getNotifications, dismissNotification } from "./notifications.ts";
export {
  recordAgentPerformance,
  getAgentMemory,
  getSonicDNA,
  updateAgentRelationship,
} from "./agents.ts";
export { orchestrateAgents } from "./orchestration.ts";
export { widgetInitialize, widgetExecute } from "./widgets.ts";
export {
  dashboardList,
  dashboardSelect,
  dashboardMessages,
  dashboardSendMessage,
  dashboardFiles,
  dashboardNotifications,
  dashboardMembers,
  dashboardSummary,
} from "./dashboard.ts";
export { search, webSearch, synthesize } from "./search.ts";
