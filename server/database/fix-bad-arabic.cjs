const { Client } = require('pg');
const fixes = {
  new: { ar: 'جديد' },
  available: { ar: 'متاح' },
  category1: { ar: 'الفئة 1' },
  category2: { ar: 'الفئة 2' },
  category3: { ar: 'الفئة 3' },
  noAuditsYet: { ar: 'لا توجد تدقيقات بعد' },
  createStoreAuditsDescription: { ar: 'أنشئ تدقيقات للمتاجر' },
  noAssignedAudits: { ar: 'لا توجد تدقيقات مسندة' },
  assignedAudit: { ar: 'تدقيق مسند' },
  assignedChecklist: { ar: 'قائمة تحقق مسندة' },
};

(async () => {
  const c = new Client({host:'aws-0-ap-southeast-1.pooler.supabase.com',port:6543,user:'postgres.nwwcoukuvyqnbxulvqcl',password:'D419EAA12b!Secure',database:'postgres',ssl:{rejectUnauthorized:false}});
  await c.connect();
  for (const [key, val] of Object.entries(fixes)) {
    await c.query("UPDATE hashibasha_language.language_entries SET ar = $1 WHERE key = $2", [val.ar, key]);
    console.log('Fixed:', key, '->', val.ar);
  }
  await c.end();
})().catch(e => console.error(e));
