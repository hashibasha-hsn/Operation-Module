export type DashboardTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'process-workflow' | 'ticket' | 'action-point';
  chartType: 'bar' | 'line' | 'pie' | 'kpi' | 'table';
  includeActionPoints?: boolean;
  ticketType?: 'normal' | 'asset' | null;
  tags: string[];
};

export const DASHBOARD_TEMPLATE_LIBRARY: DashboardTemplateDefinition[] = [
  {
    id: 'process-completion',
    name: 'Process Completion Overview',
    description: 'Track submission volume, completion rate, and pending workflows across processes.',
    category: 'process-workflow',
    chartType: 'bar',
    includeActionPoints: true,
    tags: ['process', 'compliance', 'kpi'],
  },
  {
    id: 'workflow-compliance-kpi',
    name: 'Workflow Compliance KPI',
    description: 'Single-view compliance score and completion metrics for leadership reviews.',
    category: 'process-workflow',
    chartType: 'kpi',
    includeActionPoints: false,
    tags: ['kpi', 'executive'],
  },
  {
    id: 'audit-submission-trends',
    name: 'Audit Submission Trends',
    description: 'Line chart of audit and process submissions over time.',
    category: 'process-workflow',
    chartType: 'line',
    includeActionPoints: false,
    tags: ['audit', 'trends'],
  },
  {
    id: 'process-status-table',
    name: 'Process Status Table',
    description: 'Tabular breakdown of process completion and pending counts by workflow.',
    category: 'process-workflow',
    chartType: 'table',
    includeActionPoints: true,
    tags: ['process', 'table', 'details'],
  },
  {
    id: 'ticket-volume',
    name: 'Ticket Volume Tracker',
    description: 'Monitor ticket creation, completion, and closure trends.',
    category: 'ticket',
    chartType: 'line',
    ticketType: null,
    tags: ['ticket', 'trends'],
  },
  {
    id: 'open-tickets',
    name: 'Open Tickets Dashboard',
    description: 'Bar chart of open, on-hold, and resolved tickets.',
    category: 'ticket',
    chartType: 'bar',
    ticketType: 'normal',
    tags: ['ticket', 'operations'],
  },
  {
    id: 'asset-tickets',
    name: 'Asset Maintenance Tickets',
    description: 'Focus on asset-linked maintenance and repair tickets.',
    category: 'ticket',
    chartType: 'bar',
    ticketType: 'asset',
    tags: ['ticket', 'asset'],
  },
  {
    id: 'ticket-status-pie',
    name: 'Ticket Status Mix',
    description: 'Pie chart of ticket statuses for quick operations review.',
    category: 'ticket',
    chartType: 'pie',
    ticketType: null,
    tags: ['ticket', 'status', 'pie'],
  },
  {
    id: 'ticket-detail-table',
    name: 'Ticket Detail Table',
    description: 'Sortable table of tickets with status, priority, and assignee.',
    category: 'ticket',
    chartType: 'table',
    ticketType: null,
    tags: ['ticket', 'table'],
  },
  {
    id: 'action-points-priority',
    name: 'Action Points by Priority',
    description: 'Pie chart breakdown of action points by priority and status.',
    category: 'action-point',
    chartType: 'pie',
    tags: ['action-point', 'priority'],
  },
  {
    id: 'action-points-sla',
    name: 'Action Points SLA',
    description: 'Track open, in-progress, and completed action points with SLA metrics.',
    category: 'action-point',
    chartType: 'bar',
    tags: ['action-point', 'sla'],
  },
  {
    id: 'action-points-table',
    name: 'Action Points Detail Table',
    description: 'Tabular view of action points with due dates and assignees.',
    category: 'action-point',
    chartType: 'table',
    tags: ['action-point', 'table'],
  },
];
