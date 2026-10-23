function menuIcon(name){const paths={notifications:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',learning:'<path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z"/>',schedule:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',people:role==='teacher'?'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2"/>':'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;}
let page='home';
const homeView=document.createElement('section');homeView.id='home-view';document.querySelector('#classroom').before(homeView);
const appMenu=document.createElement('nav');appMenu.className='app-menu';appMenu.setAttribute('aria-label','Основное меню');document.querySelector('main').append(appMenu);
const settingsButton=document.createElement('button');settingsButton.className='btn settings-button';settingsButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="#f4f3eb"/><circle cx="15" cy="17" r="3" fill="#f4f3eb"/></svg>';settingsButton.setAttribute('aria-label','Настройки');document.querySelector('header').append(settingsButton);settingsButton.onclick=()=>openPage('settings');
function openPage(next){page=next;layoutApp();window.scrollTo({top:0,behavior:'smooth'});}
function layoutApp(){
 document.body.dataset.page=page;const teacher=role==='teacher';if(cloud?.role==='student'&&!cloud.assigned){appMenu.hidden=true;homeView.hidden=true;classroom.hidden=true;planner.hidden=true;content.hidden=false;return;}appMenu.hidden=false;
 appMenu.innerHTML=[['home','⌂','Главная'],['learning','▤','Обучение'],['schedule','▦','Расписание'],['people','○',teacher?'Ученики':'Мой кабинет'],['notifications','','Уведомления']].map(([id,icon,label])=>`<button data-page="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span class="menu-icon" aria-hidden="true">${menuIcon(id)}</span><span class="menu-label">${label}</span></button>`).join('');
 const assigned=teacher?db.students:db.students.filter(s=>s.id===studentId);
 const sessions=(db.sessions||[]).filter(x=>teacher||x.studentId===studentId).filter(x=>Date.parse(x.when+':00+04:00')>=Date.now()).sort((a,b)=>a.when.localeCompare(b.when));
 const tasks=(db.homework||[]).filter(x=>teacher||x.studentId===studentId).filter(x=>!x.done);
 const lesson=sessions[0];
 homeView.hidden=!['home','people','homework','settings','notifications'].includes(page)||(page==='people'&&teacher)||(page==='notifications'&&teacher);
 if(page==='home')homeView.innerHTML=`<div class="panel dashboard"><span class="sub">${teacher?'ТВОЙ УЧЕБНЫЙ ДЕНЬ':'СЕГОДНЯ С FREITAG'}</span><h2>${teacher?'Всё важное — рядом':'Твой следующий шаг'}</h2><button class="dashboard-card" data-go="schedule"><span class="sub">БЛИЖАЙШЕЕ ЗАНЯТИЕ</span><strong>${lesson?escapeHtml(lesson.title):'Пока нет занятий'}</strong><span>${lesson?escapeHtml(dateLabel(localLessonTime(lesson.when)))+' · '+zoneLabel():'Посмотреть расписание →'}</span></button><div class="dashboard-grid"><button class="dashboard-card" data-go="homework"><strong>${tasks.length}</strong><span>Домашних заданий к выполнению →</span></button><button class="dashboard-card" data-go="${teacher?'people':'learning'}"><strong>${teacher?(db.joinRequests||[]).length:assigned[0]?.topics.length||0}</strong><span>${teacher?'Новых заявок →':'Назначенных тем →'}</span></button></div><button class="btn primary" data-go="learning">${teacher?'Подготовить материалы':'Перейти к темам'} →</button></div>`;
 if(page==='people'&&!teacher){const p=Object.entries(db.progress||{}).filter(([k])=>k.startsWith(studentId+':'));homeView.innerHTML=`<div class="panel"><h2>Мой кабинет</h2><p>${escapeHtml(assigned[0]?.name||'Ученик')}</p><div class="dashboard-grid"><div class="dashboard-card"><strong>${p.reduce((n,[,v])=>n+(v.known?.length||0),0)}</strong><span>Изученных слов</span></div><div class="dashboard-card"><strong>${p.reduce((n,[,v])=>n+(v.best||0),0)}</strong><span>Баллов в темах</span></div></div><button class="btn" data-go="homework">Мои домашние задания →</button></div>`;}
 if(['settings','notifications'].includes(page)&&!teacher)homeView.innerHTML='<div class="panel"><h2>Уведомления</h2><p>Напоминания о занятиях и домашней работе будут приходить в чат с ботом. Время и количество напоминаний настраивает преподаватель.</p><p class="hint">Уведомления приходят в чат с ботом, если преподаватель включил их для тебя.</p></div>';
 if(page==='settings')homeView.innerHTML=timeZoneSettingsMarkup();
 if(page==='homework')homeView.innerHTML='<div class="row page-heading"><h2>Домашние задания</h2><button class="btn" data-go="home">← Главная</button></div>';
 const classVisible=page==='learning'||page==='people'&&teacher||page==='home'&&!cloud;
 classroom.hidden=!classVisible;
 if(page==='learning'&&teacher){const editor=classroom.querySelector('.lesson-editor');if(editor)renderMaterials(editor);}
 const lessonNav=document.querySelector('nav[aria-label="Разделы"]');if(page!=='learning'||teacher)lessonNav.hidden=true;
 else lessonNav.hidden=!topic||!lessonOpen;
 content.hidden=page!=='learning'||teacher;
 planner.hidden=!['schedule','homework','notifications'].includes(page);
 const details=[...planner.children];for(const d of details){const heading=d.querySelector('summary')?.textContent||'';d.hidden=['settings','notifications'].includes(page)?!heading.includes('Настройки'):page==='schedule'?!heading.includes('Расписание'):page==='homework'?!heading.includes('Домашние'):true;if(!d.hidden)d.open=true;}
}
appMenu.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)openPage(b.dataset.page);});homeView.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)openPage(b.dataset.go);});
const originalRender=render;render=function(){originalRender();layoutApp();};
const originalPlanner=renderPlanner;renderPlanner=function(){originalPlanner();queueMicrotask(layoutApp);};
layoutApp();

homeView.addEventListener('change',e=>{if(e.target.id!=='user-timezone'||!validTimeZone(e.target.value))return;userTimeZone=e.target.value;try{localStorage.setItem('freitag-timezone',userTimeZone);}catch{}selectedCalendarDate=tbilisiDate();calendarWeek=mondayOf(selectedCalendarDate);render();});
