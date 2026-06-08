/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
let content = fs.readFileSync('src/lib/scheduler.ts', 'utf8');

content = content.replace(/ContentStatus\.READY/g, '"READY"');
content = content.replace(/ContentStatus\.SCHEDULED/g, '"SCHEDULED"');
content = content.replace(/ScheduleStatus\.POSTED/g, '"POSTED"');
content = content.replace(/ScheduleStatus\.SCHEDULED/g, '"SCHEDULED"');
content = content.replace(/ScheduleStatus\.FAILED/g, '"FAILED"');
content = content.replace(/ScheduleStatus\.CANCELLED/g, '"CANCELLED"');

fs.writeFileSync('src/lib/scheduler.ts', content);
console.log('Fixed scheduler.ts');
