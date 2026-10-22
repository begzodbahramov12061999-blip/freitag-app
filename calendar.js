function tbilisiDate(){return zonedMinute(new Date()).slice(0,10);}
function mondayOf(date){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
function shiftDate(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
let selectedCalendarDate=tbilisiDate();
let calendarWeek=mondayOf(selectedCalendarDate);
function enhanceCalendar(){
 const block=[...planner.children].find(d=>d.querySelector('summary')?.textContent.startsWith('Расписание'));
 if(!block||block.querySelector('.week-calendar'))return;
 const today=tbilisiDate(),days=Array.from({length:7},(_,i)=>shiftDate(calendarWeek,i));
 const allowed=(db.sessions||[]).map(s=>({...s,when:localLessonTime(s.when)})).filter(s=>role==='teacher'||s.studentId===studentId);
 const sessions=allowed.filter(s=>days.includes(s.when.slice(0,10))).sort((a,b)=>a.when.localeCompare(b.when));
 const calendar=document.createElement('div');calendar.className='week-calendar';
 const month=d=>new Date(d+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'});
 calendar.innerHTML=`<div class="row week-heading"><div><span class="sub">ТВОЯ НЕДЕЛЯ</span><h2>${month(days[0])} — ${month(days[6])}</h2><p class="hint">${days[0].slice(0,4)} · ${escapeHtml(zoneLabel())} · занятий: ${sessions.length}</p></div></div><div class="week-controls"><button class="btn" data-week-shift="-7" aria-label="Предыдущая неделя">←</button><button class="btn" data-week-today>Текущая неделя</button><button class="btn" data-week-shift="7" aria-label="Следующая неделя">→</button></div><div class="week-strip">${days.map((d,i)=>`<button class="week-day ${d===today?'today':''} ${d===selectedCalendarDate?'selected':''}" data-week-day="${d}" aria-pressed="${d===selectedCalendarDate}" aria-label="${month(d)}${d===today?', сегодня':''}"><span>${['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i]}</span><strong>${Number(d.slice(8))}</strong><span class="day-dot ${sessions.some(s=>s.when.startsWith(d))?'has-lessons':''}"></span></button>`).join('')}</div><div class="week-agenda">${days.map((d,i)=>{const items=sessions.filter(s=>s.when.startsWith(d));return `<section class="agenda-day" id="agenda-${d}" ${d!==selectedCalendarDate?'hidden':''}><div class="agenda-date"><strong>${['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'][i]}</strong><span>${month(d)}${d===today?' · Сегодня':''}</span></div>${items.map(s=>`<article class="calendar-lesson"><div class="lesson-time"><strong>${escapeHtml(s.when.slice(11,16))}</strong><span>${s.duration} мин</span></div><div class="lesson-info">${role==='teacher'?`<strong>${escapeHtml(db.students.find(p=>p.id===s.studentId)?.name||'Ученик')}</strong><p>${escapeHtml(s.title)}</p>`:`<strong>${escapeHtml(s.title)}</strong>`}<span class="grade-status">${s.status==='completed'||(!s.status&&Date.parse(s.when+':00Z')+s.duration*60000<=Date.parse(zonedMinute(new Date())+':00Z'))?'Занятие проведено':'Запланировано'}</span><div class="grade-value"><span>Набрано баллов</span><strong>${pointsText(s)}</strong></div>${role==='teacher'?`<div class="actions"><button class="btn" data-calendar-edit="${s.id}">Перенести</button><button class="btn" data-cancel-session="${s.id}">Отменить</button></div>`:''}</div></article>`).join('')||'<p class="free-day">Свободный день</p>'}</section>`;}).join('')}</div>`;
 const form=block.querySelector('#add-session');
 if(form){const add=document.createElement('details');add.className='calendar-add';add.innerHTML='<summary class="btn primary">＋ Добавить занятие</summary>';form.before(add);add.append(form);calendar.append(add);prepareCalendarForm(form);}
 // Keep original forms for moving lessons; hide only the old list.
 for(const article of block.querySelectorAll(':scope > article.review'))article.hidden=true;
 for(const p of [...block.children].filter(x=>x.tagName==='P'))p.hidden=true;
 block.querySelector('summary').textContent='Расписание';block.append(calendar);
}
planner.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.weekShift!==undefined){const offset=Math.max(0,Math.round((Date.parse(selectedCalendarDate)-Date.parse(calendarWeek))/86400000));calendarWeek=shiftDate(calendarWeek,Number(d.weekShift));selectedCalendarDate=shiftDate(calendarWeek,offset);renderPlanner();}
 else if('weekToday'in d){selectedCalendarDate=tbilisiDate();calendarWeek=mondayOf(selectedCalendarDate);renderPlanner();}
 else if(d.weekDay){selectedCalendarDate=d.weekDay;renderPlanner();}
 else if(d.calendarEdit&&role==='teacher'){rescheduleId=d.calendarEdit;renderPlanner();const article=[...planner.querySelectorAll('article.review')].find(a=>a.querySelector('[data-reschedule-session]')?.dataset.rescheduleSession===d.calendarEdit);if(article){article.hidden=false;article.classList.add('calendar-editing');article.scrollIntoView({behavior:'smooth',block:'center'});}}
});
const previousPlannerRender=renderPlanner;renderPlanner=function(){previousPlannerRender();enhanceCalendar();};enhanceCalendar();

function prepareCalendarForm(form){
 const original=form.querySelector('#session-date');if(!original)return;
 original.type='hidden';original.required=false;
 const label=form.querySelector('label[for="session-date"]');if(label)label.hidden=true;
 const fields=document.createElement('div');fields.className='calendar-date-time';
 fields.innerHTML=`<label>Дата<input type="date" id="calendar-new-date" value="${selectedCalendarDate}" required></label><label>Время<input type="time" id="calendar-new-time" step="60" required></label>`;
 original.before(fields);
 const date=fields.querySelector('#calendar-new-date'),time=fields.querySelector('#calendar-new-time');
 const sync=()=>{original.value=date.value&&time.value?date.value+'T'+time.value:'';};
 fields.addEventListener('input',sync);fields.addEventListener('change',sync);sync();
 form.addEventListener('submit',sync,{capture:true});
}
