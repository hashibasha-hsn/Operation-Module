const { Client } = require('pg');
const fs = require('fs');

const processKeys = ['processTab','auditTab','draft','new','draftTab','processManagement','manageProcessesAndAudits','title','owner','creationDate','period','processTag','stores','users','assignees','urlQr','status','schedule','actions','edit','delete','total','active','daily','weekly','monthly','all','refresh','view','filter','searchProcess','sortBy','date','export','exportAsCSV','exportAsExcel','exportAsPDF','reset','apply','noProcessesAvailable','createFirstProcess','noAuditsYet','createStoreAuditsDescription','searchAudit','newAudit','draftProcesses','continueWorkingOnDrafts','confirmDeleteAudit','failedToDeleteAudit','confirmDeleteDraftProcess','confirmDeletePublishedProcess','failedToDeleteProcess','filterProcesses','filterByStatus','searchProcessesByKeyword','sortProcesses','applyFilters','resetFilters','exportProcesses','createNewProcess','changeViewLayout','refreshProcesses','formId','inactive','available','published','processes','audits'];
const taskKeys = ['actionPointTab','approvalsTab','workflowStatusTab','assignedToMe','createdByMe','all','active','inactive','pending','inProgress','completed','draft','assigned','filterBy','filterByStatus','filterByCategory','filterByActivityStatus','filterByTimePeriod','search','searchProcesses','searchWorkflows','searchApprovals','searchActionPoints','selectCategory','selectDate','pickADate','allStatus','allPeriods','today','thisWeek','thisMonth','noProcessesMatchCriteria','noWorkflowsMatchCriteria','noAssignedAudits','noApprovalsMatchCriteria','noActionPointsAvailable','loadMore','loadMoreActionPoints','exportCSV','exportActionPointsData','start','continue','closureAssigned','assignedAudit','assignedChecklist','category1','category2','category3','lastUpdatedToday','auditTab','processTab'];
const allKeys = [...new Set([...processKeys, ...taskKeys])];

(async () => {
  const c = new Client({host:'aws-0-ap-southeast-1.pooler.supabase.com',port:6543,user:'postgres.nwwcoukuvyqnbxulvqcl',password:'D419EAA12b!Secure',database:'postgres',ssl:{rejectUnauthorized:false}});
  await c.connect();
  const r = await c.query("SELECT key, ar FROM hashibasha_language.language_entries WHERE key = ANY($1)", [allKeys]);
  const dbMap = {};
  r.rows.forEach(row => dbMap[row.key] = row.ar);

  const content = fs.readFileSync('C:\\Rasika\\Operation-Module-shareable\\client\\src\\i18n.ts','utf8');
  const arStart = content.indexOf('ar: {');
  const arSection = content.substring(arStart, content.indexOf('};', arStart));

  console.log('=== Keys with issues ===');
  allKeys.forEach(k => {
    const inDB = !!dbMap[k];
    const arVal = dbMap[k];
    const inFallback = arSection.includes(`    ${k}: "`);
    const issues = [];
    if (!inDB) issues.push('MISSING from DB');
    else if (arVal === k || arVal.toLowerCase() === k.toLowerCase()) issues.push('DB Arabic is English: "'+arVal+'"');
    else if (!arVal || arVal.trim() === '') issues.push('DB Arabic is empty');
    if (!inFallback) issues.push('MISSING from i18n.ts AR fallback');
    if (issues.length) console.log('  '+k+':', issues.join(', '));
  });

  console.log('\n=== All DB Arabic values ===');
  allKeys.forEach(k => {
    if (dbMap[k]) console.log(k, '->', dbMap[k]);
    else console.log(k, '-> (not in DB)');
  });

  await c.end();
})().catch(e => console.error(e));
