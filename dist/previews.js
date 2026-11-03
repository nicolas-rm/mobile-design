const icon=(name)=>`<span class="symbol" aria-hidden="true">${name}</span>`;
const button=(label,action='command',variant='',symbol='',extra='')=>`<button type="button" class="md-button ${variant}" data-demo="${action}" ${extra}>${symbol?icon(symbol):''}${label}</button>`;
const iconButton=(name,label,action='command',extra='')=>`<button type="button" class="icon-button" data-demo="${action}" aria-label="${label}" ${extra}>${icon(name)}</button>`;
const row=(html)=>`<div class="preview-row">${html}</div>`;
const surface=(html)=>`<div class="preview-surface">${html}</div>`;
const musicRows=()=>`<div class="demo-list">${[['Long Walk','L. R. Coleman'],['In the Dark','Sole R. Rey']].map(([title,artist])=>`<div class="demo-list-item"><button class="demo-list-item" style="padding:0;min-height:48px" data-demo="track-detail" data-title="${title}"><span class="album">${icon('music_note')}</span><span class="list-text"><strong>${title}</strong><small>${artist}</small></span></button>${iconButton('play_arrow',`Reproducir ${title}`,'track-play')}</div>`).join('')}</div>`;
export function previewMarkup(id,{staticView=false}={}){
 let content='';
 switch(id){
  case'app-bars':content=`<div class="mini-appbar">${iconButton('arrow_back','Volver') }<strong>Tu biblioteca</strong>${iconButton('search','Buscar','open-search')}${iconButton('more_vert','Más opciones','menu')}</div><div class="mini-appbar-content"><h3>Tu música</h3></div>`;break;
  case'badges':content=row([['mail','Correo',8],['notifications','Notificaciones',99],['bookmark','Guardado',null]].map(([name,label,count])=>`<span class="preview-badge-anchor">${iconButton(name,label+(count?`, ${count} novedades`:`, hay novedades`))}<span class="preview-badge ${count?'':'dot'}" aria-hidden="true">${count??''}</span></span>`).join(''));break;
  case'button-groups':content=`<div class="demo-group" aria-label="Intervalo del calendario">${['Día','Semana','Mes'].map((label,i)=>button((i===1?icon('check'):'')+label,'group',`tonal ${i===1?'selected':''}`,'',`aria-pressed="${i===1}"`)).join('')}</div>`;break;
  case'buttons':content=`<div class="preview-column"><div class="preview-row demo-button-set">${button('Guardar','save','','bookmark')}${button('Explorar','command','tonal')}${button('Compartir','command','outlined')}</div><div class="preview-row">${button('Reproducir','play','large','play_arrow')}${button('Más tarde','command','text')}</div></div>`;break;
  case'extended-fab':content=row(button('Crear nota','new-note','large','edit'));break;
  case'fab-menu':content=`<div class="fab-menu-preview"><div class="fab-menu-stack" hidden>${button('Nueva nota','new-note','','edit')}${button('Nueva carpeta','command','','folder')}</div>${button('','fab-expand','round-icon','add','aria-label="Abrir menú Crear" aria-expanded="false"')}</div>`;break;
  case'floating-action-button':content=row(button('','new-note','round-icon','add','aria-label="Crear una nota"'));break;
  case'icon-buttons':content=row(`${button('','favorite','round-icon tonal','favorite','aria-label="Añadir a favoritos" aria-pressed="false"')}${iconButton('bookmark','Guardar','bookmark','aria-pressed="false"')}${iconButton('share','Compartir','command')}`);break;
  case'segmented-buttons':content=`<div class="demo-group" aria-label="Forma de viajar">${['A pie','Bici','Auto'].map((label,i)=>button(label,'group',`outlined ${i===0?'selected':''}`,'',`aria-pressed="${i===0}"`)).join('')}</div>`;break;
  case'split-button':content=row(`<div class="split-preview">${button('Enviar','command','','send')}${button('','menu','','keyboard_arrow_down','aria-label="Más opciones de envío"')}</div>`);break;
  case'cards':content=row(`<article class="demo-card"><div class="demo-card-art">${icon('music_note')}</div><div class="demo-card-text"><strong>En buena compañía</strong><p>Una colección para descubrir</p>${button('Explorar','collection','text','arrow_forward')}</div></article>`);break;
  case'carousel':content=`<div class="demo-carousel" tabindex="0" aria-label="Destinos, desplaza horizontalmente">${[['Montaña','location_on'],['Costa','audiotrack'],['Bosque','star']].map(([label,name])=>`<button type="button" class="demo-slide" data-demo="destination" data-title="${label}">${icon(name)}<span>${label}</span></button>`).join('')}</div>`;break;
  case'checkbox':content=surface(`<button type="button" class="demo-toggle" role="checkbox" aria-checked="true" data-demo="check"><span class="demo-check">${icon('check')}</span>Descargar con Wi-Fi</button><button type="button" class="demo-toggle" role="checkbox" aria-checked="false" data-demo="check"><span class="demo-check"></span>Incluir podcasts</button>`);break;
  case'chips':content=row(['Para ti','Descargadas','Favoritas'].map((label,i)=>`<button type="button" class="demo-chip" aria-pressed="${i===0}" data-demo="chip">${i===0?icon('check'):''}<span>${label}</span></button>`).join(''));break;
  case'date-pickers':content=row(`<div class="preview-calendar"><div class="calendar-heading"><strong>Noviembre 2026</strong>${icon('calendar_month')}</div><div class="calendar-grid">${['L','M','M','J','V','S','D'].map(d=>`<span aria-hidden="true">${d}</span>`).join('')}${'<span></span>'.repeat(6)}${Array.from({length:30},(_,i)=>`<button type="button" data-demo="date" aria-label="${i+1} de noviembre de 2026" aria-pressed="${i===2}">${i+1}</button>`).join('')}</div></div>`);break;
  case'time-pickers':content=row(`<div class="preview-calendar"><small class="subtle">Selecciona la hora</small><div class="clock-numbers"><span>03</span><b>:</b><span>45</span></div>${row(button('PM','period','tonal','',`aria-label="Cambiar periodo, actualmente PM"`)+button('Elegir hora','time','text'))}</div>`);break;
  case'dialogs':content=row(`<div class="mini-dialog">${icon('delete')}<h3>¿Eliminar descarga?</h3><p>Podrás descargarla de nuevo cuando quieras.</p><div class="mini-dialog-actions">${button('Cancelar','cancel','text')}${button('Eliminar','delete','text')}</div></div>`);break;
  case'divider':content=surface(`<div class="demo-list-item" style="padding:0;min-height:40px">${icon('folder')}<span>Tu biblioteca</span></div><div class="demo-line" aria-hidden="true"></div><div class="demo-list-item" style="padding:0;min-height:40px">${icon('bookmark')}<span>Colecciones guardadas</span></div>`);break;
  case'lists':content=musicRows();break;
  case'loading-indicator':content=row(`<div class="loading-wrap"><span class="loading-flower" role="status" aria-label="Cargando"></span></div>`);break;
  case'progress-indicators':content=`<div class="preview-column"><div class="demo-progress"><div class="progress-ring" style="--value:45%" aria-hidden="true"></div><div class="progress-track" role="progressbar" aria-label="Descarga de colección" aria-valuemin="0" aria-valuemax="100" aria-valuenow="45"><span></span></div></div><label class="demo-field"><span class="sr-only">Avance de la demostración</span><input type="range" min="0" max="100" value="45" data-demo-input="progress" aria-label="Avance de la demostración"></label><div class="label-inline" style="width:100%"><span>Descargando colección</span><output>45 %</output></div></div>`;break;
  case'menus':content=row(`<div class="demo-menu" aria-label="Opciones de colección">${[['edit','Editar'],['share','Compartir'],['download','Descargar']].map(([name,label])=>`<button type="button" data-demo="command">${icon(name)}${label}</button>`).join('')}</div>`);break;
  case'navigation-bar':content=`<div class="preview-nav" role="tablist" aria-label="Destinos">${[['home','Inicio'],['search','Explorar'],['library_music','Biblioteca']].map(([name,label],i)=>`<button type="button" role="tab" aria-selected="${i===0}" data-demo="nav"><span class="nav-indicator">${icon(name)}</span>${label}</button>`).join('')}</div><p class="demo-nav-content responsive-note" style="text-align:center;margin:12px 0 0">Inicio</p>`;break;
  case'navigation-drawer':case'navigation-rail':content=`<div class="preview-rail"><div class="preview-rail-menu ${id==='navigation-drawer'?'expanded':''}" role="tablist" aria-label="Destinos">${[['home','Inicio'],['bookmark','Guardado'],['mail','Correo']].map(([name,label],i)=>`<button type="button" role="tab" aria-label="${label}" aria-selected="${i===0}" data-demo="nav">${icon(name)}${id==='navigation-drawer'?label:''}</button>`).join('')}</div><div class="preview-rail-content"><span class="demo-nav-content">Inicio</span><div class="demo-line"></div><span class="responsive-note">Todo en su lugar.</span></div></div>`;break;
  case'radio-button':content=surface(`<div role="radiogroup" aria-label="Calidad de audio">${['Estándar','Alta calidad'].map((label,i)=>`<button type="button" class="demo-toggle" role="radio" aria-checked="${i===0}" data-demo="radio"><span class="demo-radio"></span>${label}</button>`).join('')}</div>`);break;
  case'search':content=`<div class="demo-search">${iconButton('arrow_back','Volver','cancel')}<input type="search" placeholder="Buscar música" aria-label="Buscar música" data-demo-input="search">${iconButton('close','Borrar búsqueda','clear-search','hidden')}</div><div class="demo-search-results" role="status">Prueba con «Long Walk»</div>`;break;
  case'bottom-sheets':content=row(`<div class="demo-sheet"><h3>Tu colección</h3><p>Música para acompañar el día.</p>${button('Ver detalles','sheet','tonal','arrow_forward')}</div>`);break;
  case'side-sheets':content=row(button('Ver información','sheet','tonal','info'));break;
  case'sliders':content=surface(`<div class="label-inline"><span>Volumen</span><output>40 %</output></div><input type="range" min="0" max="100" step="5" value="40" aria-label="Volumen" data-demo-input="volume">`);break;
  case'snackbar':content=`<div class="demo-snackbar"><span>Colección guardada</span><button type="button" data-demo="undo">Deshacer</button></div>`;break;
  case'switch':content=surface(`<button type="button" class="demo-toggle" role="switch" aria-checked="true" data-demo="switch"><span style="flex:1">Descargar con Wi-Fi</span><span class="demo-switch"></span></button>`);break;
  case'tabs':content=`<div class="demo-tabs" role="tablist" aria-label="Tu biblioteca">${[['music_note','Música'],['audiotrack','Podcasts'],['bookmark','Guardado']].map(([name,label],i)=>`<button type="button" role="tab" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-demo="tab" data-index="${i}">${icon(name)}${label}</button>`).join('')}</div><div class="demo-tab-content" role="tabpanel" tabindex="0" aria-label="Música">Tu música, a tu ritmo.<small>Toca una pestaña o desliza este contenido.</small></div>`;break;
  case'text-fields':content=surface(`<label class="demo-field"><span>Nombre de la colección</span><input type="text" placeholder="Tu nueva colección" maxlength="40" data-demo-input="text" aria-describedby="field-help-${staticView?'static':'live'}"><small id="field-help-${staticView?'static':'live'}">Elige un nombre fácil de reconocer · <output>0/40</output></small></label>`);break;
  case'toolbars':content=row(`<div class="demo-toolbar-preview" aria-label="Editar colección">${iconButton('edit','Editar','tool','aria-pressed="true"')}${iconButton('favorite','Favorito','tool','aria-pressed="false"')}${iconButton('share','Compartir')}${iconButton('more_horiz','Más opciones','menu')}</div>`);break;
  case'tooltips':content=row(`<div class="demo-tooltip"><h3>Escucha sin conexión</h3><p>Guarda tus colecciones para escucharlas en cualquier momento.</p>${button('Entendido','understood','text')}</div>`);break;
  default:content=row(button('Explorar','command','tonal'));
 }
 if(staticView)content=content
   .replace(/<button\b/g,'<span class-placeholder="true"')
   .replace(/class-placeholder="true"([^>]*?)class="([^"]*)"/g,'$1class="preview-static-control $2"')
   .replace(/class-placeholder="true"/g,'class="preview-static-control"')
   .replace(/<\/button>/g,'</span>')
   .replace(/<input\b[^>]*type="range"[^>]*>/g,'<span class="static-slider"></span>')
   .replace(/<input\b[^>]*>/g,'<span class="static-field">Tu colección</span>')
   .replace(/\s(?:role|tabindex|id|aria-controls|aria-describedby)="[^"]*"/g,'');
 return `<div class="preview" data-component="${id}">${content}</div>`;
}

function chooseTab(button){
 const root=button.closest('.preview');
 root.querySelectorAll('[data-demo="tab"]').forEach(b=>{const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
 const panel=root.querySelector('.demo-tab-content');
 const messages=['Tu música, a tu ritmo.','Historias que te acompañan.','Lo que quieres volver a escuchar.'];
 panel.innerHTML=messages[Number(button.dataset.index)]+`<small>Toca una pestaña o desliza este contenido.</small>`;
 panel.setAttribute('aria-label',button.textContent.trim().replace(/^(music_note|audiotrack|bookmark)/,''));
}
export function handlePreviewClick(target,{toast,openDemo,closeDemo}){
 const el=target.closest('[data-demo]');if(!el)return false;
 const root=el.closest('.preview')??document;
 const name=el.dataset.demo;
 switch(name){
  case'group':el.parentElement.querySelectorAll('button').forEach(b=>{const selected=b===el;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});break;
  case'check':case'radio':case'switch':{
   const selected=el.getAttribute('aria-checked')==='true';
   if(name==='radio')el.parentElement.querySelectorAll('[role="radio"]').forEach(b=>b.setAttribute('aria-checked','false'));
   el.setAttribute('aria-checked',String(name==='radio'||!selected));
   if(name==='check')el.querySelector('.demo-check').innerHTML=selected?'':icon('check');break;
  }
  case'chip':{const selected=el.getAttribute('aria-pressed')==='true';el.setAttribute('aria-pressed',String(!selected));el.querySelector('.symbol')?.remove();if(!selected)el.insertAdjacentHTML('afterbegin',icon('check'));break;}
  case'favorite':case'bookmark':case'tool':{const selected=el.getAttribute('aria-pressed')==='true';el.setAttribute('aria-pressed',String(!selected));el.classList.toggle('selected',!selected);if(name==='favorite')el.setAttribute('aria-label',selected?'Añadir a favoritos':'Quitar de favoritos');break;}
  case'play':{const playing=el.dataset.playing==='true';el.dataset.playing=String(!playing);el.innerHTML=icon(playing?'play_arrow':'pause')+(playing?'Reproducir':'Pausar');break;}
  case'save':{const saved=el.dataset.saved==='true';el.dataset.saved=String(!saved);el.innerHTML=icon(saved?'bookmark':'check')+(saved?'Guardar':'Guardado');el.setAttribute('aria-pressed',String(!saved));break;}
  case'fab-expand':{const expanded=el.getAttribute('aria-expanded')==='true';el.setAttribute('aria-expanded',String(!expanded));el.setAttribute('aria-label',expanded?'Abrir menú Crear':'Cerrar menú Crear');el.innerHTML=icon(expanded?'add':'close');root.querySelector('.fab-menu-stack').hidden=expanded;break;}
  case'tab':chooseTab(el);break;
  case'nav':root.querySelectorAll('[data-demo="nav"]').forEach(b=>b.setAttribute('aria-selected',String(b===el)));root.querySelector('.demo-nav-content').textContent=el.getAttribute('aria-label')??el.textContent.trim().replace(/^(home|search|library_music)/,'');break;
  case'date':root.querySelectorAll('[data-demo="date"]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));toast(`Fecha seleccionada: ${el.textContent} de noviembre`);break;
  case'period':{const pm=el.textContent==='PM';el.textContent=pm?'AM':'PM';el.setAttribute('aria-label',`Cambiar periodo, actualmente ${pm?'AM':'PM'}`);break;}
  case'clear-search':{const input=root.querySelector('[data-demo-input="search"]');input.value='';handlePreviewInput(input);input.focus();break;}
  case'open-search':openDemo('Buscar en tu biblioteca',`<label class="demo-field"><span>Buscar música</span><input type="search" placeholder="Nombre de la canción" autofocus></label><p>Busca canciones, artistas o colecciones.</p>`);break;
  case'new-note':openDemo('Nueva nota',`<label class="demo-field"><span>Título</span><input type="text" placeholder="Una buena idea" autofocus></label><div class="mini-dialog-actions">${button('Cancelar','close-modal','text')}${button('Guardar','saved-modal')}</div>`);break;
  case'menu':openDemo('Opciones',`<div class="demo-menu" style="box-shadow:none">${[['edit','Editar'],['share','Compartir'],['bookmark','Guardar']].map(([n,l])=>`<button type="button" data-demo="menu-action">${icon(n)}${l}</button>`).join('')}</div>`);break;
  case'menu-action':closeDemo();toast('Opción seleccionada');break;
  case'sheet':openDemo('Tu colección',`<p>Información complementaria de la colección. Esta es una representación web; el ejemplo React Native utiliza el componente de hoja.</p><div class="mini-dialog-actions">${button('Cerrar','close-modal','text')}</div>`);break;
  case'time':openDemo('Elegir hora',`<label>Hora<input id="web-time" type="time" value="15:45"></label><div class="mini-dialog-actions">${button('Cancelar','close-modal','text')}${button('Aceptar','time-confirm')}</div>`);break;
  case'time-confirm':{const value=document.querySelector('#web-time').value;if(value){closeDemo();toast(`Hora confirmada: ${value}`)}break;}
  case'track-detail':openDemo(el.dataset.title,`<p>Detalle de la canción. La región primaria navega y el botón de reproducción conserva su propia acción.</p><div class="mini-dialog-actions">${button('Volver','close-modal','text')}</div>`);break;
  case'track-play':{const playing=el.dataset.playing==='true';el.dataset.playing=String(!playing);el.innerHTML=icon(playing?'play_arrow':'pause');el.setAttribute('aria-label',playing?'Reproducir canción':'Pausar canción');break;}
  case'destination':openDemo(el.dataset.title,`<p>Destino seleccionado en la colección.</p><div class="mini-dialog-actions">${button('Cerrar','close-modal','text')}</div>`);break;
  case'collection':openDemo('En buena compañía',`<p>Una colección para descubrir.</p>${musicRows()}<div class="mini-dialog-actions">${button('Cerrar','close-modal','text')}</div>`);break;
  case'close-modal':closeDemo();break;
  case'saved-modal':closeDemo();toast('Nota guardada en esta demostración');break;
  case'cancel':toast('Acción cancelada');break;
  case'delete':toast('Descarga eliminada en esta demostración');break;
  case'undo':toast('Colección restaurada');break;
  case'understood':toast('Puedes escuchar sin conexión después de descargar');break;
  default:toast('Acción de la demostración ejecutada');
 }
 return true;
}
export function handlePreviewInput(el){
 const root=el.closest('.preview')??el.parentElement;
 switch(el.dataset.demoInput){
  case'progress':root.querySelector('.progress-track').setAttribute('aria-valuenow',el.value);root.querySelector('.progress-track').style.setProperty('--value',el.value+'%');root.querySelector('.progress-ring').style.setProperty('--value',el.value+'%');root.querySelector('output').textContent=el.value+' %';break;
  case'volume':root.querySelector('output').textContent=el.value+' %';break;
  case'text':root.querySelector('output').textContent=el.value.length+'/40';break;
  case'search':{const query=el.value.trim().toLocaleLowerCase();root.querySelector('[data-demo="clear-search"]').hidden=el.value.length===0;root.querySelector('.demo-search-results').textContent=!query?'Prueba con «Long Walk»':'long walk'.includes(query)?'1 resultado · Long Walk — L. R. Coleman':'Sin resultados en esta demostración';break;}
 }
}
export function handlePreviewKeyboard(event){
 const el=event.target;if(el.dataset.demo!=='tab')return false;
 const tabs=[...el.parentElement.querySelectorAll('[data-demo="tab"]')];
 let i=tabs.indexOf(el);if(event.key==='ArrowRight')i=(i+1)%tabs.length;else if(event.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=tabs.length-1;else return false;
 event.preventDefault();tabs[i].focus();chooseTab(tabs[i]);return true;
}
export function installPreviewGestures(){
let swipeStart;
document.addEventListener('pointerdown',event=>{if(event.target.closest('.demo-tab-content'))swipeStart={x:event.clientX,y:event.clientY,element:event.target.closest('.demo-tab-content')};else swipeStart=undefined});
document.addEventListener('pointerup',event=>{if(!swipeStart)return;const delta=event.clientX-swipeStart.x;if(Math.abs(delta)>40&&Math.abs(delta)>Math.abs(event.clientY-swipeStart.y)){const tabs=[...swipeStart.element.closest('.preview').querySelectorAll('[data-demo="tab"]')];const active=tabs.findIndex(b=>b.getAttribute('aria-selected')==='true');chooseTab(tabs[Math.max(0,Math.min(tabs.length-1,active+(delta<0?1:-1)))]);}swipeStart=undefined;});
}
