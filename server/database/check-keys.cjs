const fs = require('fs');
const sql = fs.readFileSync('server/database/complete-language-entries.sql', 'utf8');
const keys = [
  'issueTickets', 'english', 'unitedStates', 'arabicLanguage',
  'home', 'tasks', 'processReports', 'assessmentReports',
  'dueToday', 'onTime', 'businessInfoTab', 'geoLocationTab',
  'csrConfigTab', 'registerDeviceTab', 'tagsTab',
  'processAndWorkflow', 'storeHealthCompliance', 'reports', 'creatorMode',
  'actionPoints', 'learning', 'reportingAndInsights', 'customDashboards',
  'alerts', 'alertsAndActivity', 'back', 'notifications',
  'profileSettings', 'changePassword', 'platformSettings', 'logout',
  'language', 'collapse', 'expand', 'remove',
];
for (const k of keys) {
  const m = sql.match(new RegExp("\\('" + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "',\\s*'([^']+)',\\s*'([^']+)'\\)"));
  const ar = m ? m[2] : 'NOT FOUND';
  const hasAr = ar !== 'NOT FOUND' && ar !== m?.[1];
  console.log(k + ': ' + (m ? (hasAr ? 'OK' : 'EN-as-AR: ' + ar) : 'NOT FOUND'));
}
