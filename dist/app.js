import {webRuntime} from './web-examples.js?v=b886fb5b46ee';
import {illustrationMarkup} from './illustrations.js?v=85b78c84f941';
import {componentDocs,hasInteractiveExample} from './component-docs.js?v=57f78b6abdd7';
import {areas,guides,guideNavigation,foundationGroups,styleTopics,articleIndex,articlePager,guideMarkup,homeMarkup,footerMarkup,brandLogo} from './site-sections.js?v=0d9e5b0704a9';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon=name=>`<span class="symbol" aria-hidden="true">${name}</span>`;
const link=(href,label,symbol='arrow_forward',classes='text-link')=>`<a class="${classes}" href="${href}">${label}${icon(symbol)}</a>`;
let docsControls;
const pageButton=(action,label,symbol='',variant='text',accessible=label)=>`<span class="mobile-design-control" data-mobile-design-host data-action="${esc(action)}" data-label="${esc(label)}" data-icon="${esc(symbol)}" data-variant="${esc(variant)}" data-accessibility-label="${esc(accessible)}" aria-busy="true"></span>`;
const pageText=(variant,text)=>`<div class="mobile-design-text" data-text-variant="${esc(variant)}">${esc(text)}</div>`;
function mountPageButtons(){
 if(docsControls){
  for(const anchor of navigation.querySelectorAll('a.tree-link')){
   const host=document.createElement('span');
   host.className=anchor.className;
   Object.assign(host.dataset,anchor.dataset,{
    mobileDesignHost:'',kind:'drawer-item',href:anchor.getAttribute('href'),
    label:[...anchor.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim(),
    icon:anchor.querySelector('.symbol')?.textContent??'',
    logo:anchor.querySelector('img')?.getAttribute('src')??'',
   });
   if(anchor.hasAttribute('aria-current'))host.setAttribute('aria-current',anchor.getAttribute('aria-current'));
   anchor.replaceWith(host);
  }
  for(const anchor of document.querySelectorAll('a:is(.reference-card,.text-link,.large-text-link,.hero-cta,.mosaic-link)')){
   const host=document.createElement('span');
   host.className=anchor.className;
   host.dataset.mobileDesignHost='';
   host.dataset.kind='navigation-button';
   const reference=anchor.classList.contains('reference-card');
   const primary=anchor.classList.contains('hero-cta');
   const mosaic=anchor.classList.contains('mosaic-link');
   host.dataset.variant=reference?'outlined':primary?'filled':mosaic?'tonal':'text';
   host.dataset.size=reference||primary||anchor.classList.contains('large-text-link')?'medium':'small';
   host.dataset.icon=anchor.querySelector('.symbol')?.textContent?.trim()??'';
   host.dataset.iconPosition=reference?'leading':'trailing';
   host.dataset.fullWidth=String(reference);
   host.dataset.label=[...anchor.childNodes].filter(node=>!(node instanceof Element&&node.classList.contains('symbol'))).map(node=>node.textContent).join('').trim();
   if(anchor.dataset.scrollTo){
    host.dataset.scrollTo=anchor.dataset.scrollTo;
    host.dataset.href='#/'+currentPath()+'?section='+encodeURIComponent(anchor.dataset.scrollTo);
   }else host.dataset.href=anchor.getAttribute('href');
   for(const attribute of ['target','rel','download']){
    if(anchor.hasAttribute(attribute))host.dataset[attribute]=anchor.getAttribute(attribute);
   }
   anchor.replaceWith(host);
  }
  for(const button of document.querySelectorAll('button.tree-group,button.swatch')){
   const host=document.createElement('span');
   host.className=button.className;
   host.dataset.mobileDesignHost='';
   if(button.matches('.tree-group')){
    host.dataset.kind='disclosure';
    host.dataset.action='tree-group';
    host.dataset.treeGroup=button.dataset.treeGroup;
    host.dataset.expanded=button.getAttribute('aria-expanded');
    host.dataset.label=button.textContent.trim();
   }else{
    host.dataset.kind='swatch';
    host.dataset.action='copy-color';
    host.dataset.color=button.dataset.color;
    host.dataset.label=button.querySelector('strong').textContent;
    host.dataset.accessibilityLabel=button.getAttribute('aria-label');
    host.dataset.buttonColor=button.style.backgroundColor;
    host.dataset.textColor=button.style.color;
   }
   button.replaceWith(host);
  }
 }
 if(docsControls)for(const link of main.querySelectorAll('a.component-card, a.editorial-card, .next-steps-grid > a, .next-prev > a')){
  const host=document.createElement('div');
  host.className=link.className+' mobile-design-card';
  host.dataset.mobileDesignHost='';
  host.dataset.kind='card';
  host.dataset.href=link.getAttribute('href');
  if(link.rel)host.dataset.rel=link.rel;
  if(link.dataset.component){
   host.dataset.component=link.dataset.component;
   if(['tooltips','menus','fab-menu','date-pickers','time-pickers','dialogs'].includes(link.dataset.component)){
    const url=new URL(webRuntime.catalogPopupPreview,location.href);
    url.searchParams.set('preview',link.dataset.component);
    url.searchParams.set('theme',currentTheme());
    url.searchParams.set('reduced',String(motionReduced()));
    host.dataset.previewUrl=url.href;
   }
   const preview=link.querySelector('.card-preview');
   host.dataset.previewMarkup=preview.innerHTML;
   preview.remove();
  }
  if(link.hasAttribute('aria-label'))host.dataset.accessibilityLabel=link.getAttribute('aria-label');
  host.dataset.markup=link.innerHTML;
  host.setAttribute('aria-busy','true');
  link.replaceWith(host);
 }
 for(const button of document.querySelectorAll('button.icon-button,button.heading-link')){
  const host=document.createElement('span');
  host.className=[...button.classList].filter(name=>!['icon-button','outlined-icon'].includes(name)).join(' ')+' mobile-design-control mobile-design-icon';
  for(const [key,value] of Object.entries(button.dataset))host.dataset[key]=value;
  host.dataset.mobileDesignHost='';host.dataset.kind='icon';host.dataset.icon=button.querySelector('.symbol')?.textContent?.trim()??'more_vert';
  host.dataset.accessibilityLabel=button.getAttribute('aria-label')??'';
  host.dataset.selected=button.getAttribute('aria-pressed')??'false';
  if(button.hasAttribute('aria-expanded'))host.dataset.expanded=button.getAttribute('aria-expanded');
  if(button.classList.contains('outlined-icon'))host.dataset.mode='outlined';
  if(button.closest('dialog'))host.title=host.dataset.accessibilityLabel;
  host.setAttribute('aria-busy','true');button.replaceWith(host);
 }
 docsControls?.mount();
}
const clearPageButtons=container=>{if(container)docsControls?.clear(container);};
function loadPageButtons(){
 document.documentElement.dataset.mobileDesignDocs='';
 document.addEventListener('mobile-design:controls-ready',()=>{docsControls=window.mobileDesignDocsControls;updateTheme();mountPageButtons();},{once:true});
 const script=document.createElement('script');script.src=webRuntime.script;script.defer=true;
 script.addEventListener('error',()=>{
  document.querySelector('#docs-runtime-error').textContent='No se pudieron cargar los controles. Recarga la página.';
 });
 document.head.append(script);
}
const main=document.querySelector('main');
const searchDialog=document.querySelector('#search-dialog');
const searchHost=document.querySelector('#docs-search-host');
let data,currentComponent,currentSection='overview',filter='all',catalogQuery='';
const mobileQuery=matchMedia('(max-width:900px)');
const drawerQuery=matchMedia('(900px < width < 1440px)');
const railHost=document.querySelector('#primary-navigation');
let drawerTrigger, openDrawerAfterRoute=false;
function setSidebar(open,restoreFocus=true){
 const modal=mobileQuery.matches;
 const floating=drawerQuery.matches;
 const wasOpen=document.body.classList.contains('sidebar-open');
 document.body.classList.toggle('sidebar-open',open);
 const sidebar=document.querySelector('#sidebar');
 sidebar.inert=(modal||floating)&&!open;
 document.querySelector('.workspace').inert=open&&modal;
 document.querySelector('.rail').inert=open&&modal;
 document.querySelector('.mobile-header').inert=open&&modal;
 railHost.dataset.floating=String(floating);
 railHost.dataset.expandedDestination=floating&&open?drawerTrigger?.dataset.rail??'':'';
 const toggle=document.querySelector('[data-action="sidebar"]');if(toggle.matches('[data-mobile-design-host]')){toggle.dataset.expanded=String(open);docsControls?.configure({theme:currentTheme(),reduced:document.documentElement.dataset.reduced==='true',onAction:activateControl,searchOptions});}else toggle.setAttribute('aria-expanded',String(open));
 if(open&&modal){
  sidebar.setAttribute('role','dialog');
  sidebar.setAttribute('aria-modal','true');
  (sidebar.querySelector('.sidebar-close button')??sidebar.querySelector('.sidebar-close')).focus();
 }else{
  sidebar.removeAttribute('role');
  sidebar.removeAttribute('aria-modal');
  if(open&&floating){
   requestAnimationFrame(()=>{
    if(sidebar.inert||!drawerQuery.matches)return;
    const active=[...navigation.querySelectorAll('a[aria-current="page"]')]
     .find(link=>link.getClientRects().length&&!link.closest('[inert]'));
    const first=navigation.querySelector(':scope > .tree-link');
    const destination=active??first?.querySelector('a')??first;
    destination?.focus({preventScroll:true});
    destination?.scrollIntoView({block:'nearest',behavior:'instant'});
   });
  }else if(wasOpen&&restoreFocus){
   if(modal)(toggle.querySelector('button')??toggle).focus();
   else if(floating)drawerTrigger?.focus({preventScroll:true});
  }
 }
}
mobileQuery.addEventListener('change',()=>setSidebar(false,false));
drawerQuery.addEventListener('change',()=>setSidebar(false,false));
const categories={all:'Todos',actions:'Acciones',communication:'Comunicación',containment:'Contenedores',navigation:'Navegación',selection:'Selección',input:'Entrada'};
const sections=[['overview','info','Descripción'],['specs','tune','Especificaciones'],['api','code','API'],['accessibility','accessibility','Accesibilidad']];
const currentTheme=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
const normal=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const hashFor=(id,section='overview')=>`#/components/${id}/${section}`;

function highlight(source){
 const pattern=/(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<string>'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\[\s\S]|[^`\\])*`)|(?<tag><\/?[A-Z][\w.]*(?=[\s/>]))|(?<attribute>\b[A-Za-z][\w-]*(?==["'{]))|(?<literal>\b(?:\d+(?:\.\d+)?|true|false|null|undefined)\b)|(?<key>(?<![.$])\b(?:import|from|export|default|function|return|const|let|if|else|new|type|async|await|interface)\b)/g;
 let result='',last=0;
 for(const match of source.matchAll(pattern)){
  result+=esc(source.slice(last,match.index));
  const kind=Object.keys(match.groups).find(name=>match.groups[name]!==undefined);
  result+=`<span class="syntax-${kind}">${esc(match[0])}</span>`;
  last=match.index+match[0].length;
 }
 return result+esc(source.slice(last));
}
function codeCard(source,label='Example.tsx',download){return `<div class="code-card"><div class="code-header"><span>${icon('code')}${esc(label)}</span><div class="code-actions">${download?`<span class="mobile-design-control" data-mobile-design-host data-kind="split" data-action="copy" data-download="${esc(download)}" data-label="Copiar" data-accessibility-label="Copiar código" aria-busy="true"></span>`:pageButton('copy','Copiar','content_copy','text','Copiar código')}</div></div><pre tabindex="0"><code>${highlight(source)}</code></pre></div>`;}
const callout=(title,message,symbol='info')=>`<div class="callout">${icon(symbol)}<div><strong>${title}</strong><p>${message}</p></div></div>`;
const table=(rows)=>`<div class="table-scroll"><table class="spec-table"><thead><tr><th>Referencia</th><th>Implementación local</th></tr></thead><tbody>${rows.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div>`;
const navigation = document.querySelector('#component-navigation');
const sidebarScroll = document.querySelector('.sidebar-scroll');
const expandedGroups = new Set();
let sidebarView;
let sidebarComponent;

function markCurrent(link, active) {
 link.classList.toggle('active', active);
 if (active) {
  if (link.getAttribute('aria-current') !== 'page') link.setAttribute('aria-current', 'page');
 }
 else link.removeAttribute('aria-current');
}

function setGroupExpanded(button, open) {
 const panel = document.getElementById('tree-'+button.dataset.treeGroup);
 if(button.hasAttribute('data-mobile-design-host'))button.dataset.expanded=String(open);
 else button.setAttribute('aria-expanded', String(open));
 panel.inert = !open;
 if (open) expandedGroups.add(button.dataset.treeGroup);
 else expandedGroups.delete(button.dataset.treeGroup);
}
function openTreeGroup(id,title){
 const open=expandedGroups.has(id);
 return `<button type="button" class="tree-group" data-tree-group="${esc(id)}" aria-expanded="${open}" aria-controls="tree-${esc(id)}">${esc(title)}<span class="tree-caret" aria-hidden="true"></span></button><div class="tree-children" id="tree-${esc(id)}" ${open?'':'inert'}><div class="tree-children-clip"><div class="tree-children-links">`;
}

function renderSidebar() {
 const path = currentPath();
 const area = currentArea(path);
 const view = area === 'components' ? area : path;
 const group = currentComponent?.group;
 const componentChanged = sidebarComponent !== currentComponent?.id;
 if (group && (componentChanged || view !== sidebarView)) expandedGroups.add(group);
 sidebarComponent = currentComponent?.id;
 if (view !== sidebarView) {
  clearPageButtons(navigation);
  sidebarView = view;
  document.querySelector('.sidebar-caption').textContent = areas.find(entry => entry[0] === area)?.[2] ?? 'DOCUMENTACIÓN';
  let html = `<div class="mobile-area-links">${areas.map(([id,symbol,label]) => `<a class="tree-link ${id===area?'active':''}" href="#/${id}" ${id===area?'aria-current="true"':''}>${id==='home'?brandLogo():icon(symbol)}${label}</a>`).join('')}</div>`;
  if (area === 'components') {
   html += '<a class="tree-link tree-root" href="#/components">Todos los componentes</a>';
   let previousGroup;
   for (const entry of data.components) {
    if (entry.group !== previousGroup) {
     if (previousGroup) html += '</div></div></div>';
     previousGroup = entry.group;
     if (previousGroup) {
      const title = data.groups.find(item => item.id === previousGroup).title;
      html += openTreeGroup(previousGroup,title);
     }
    }
    html += `<a class="tree-link" data-component-link="${esc(entry.id)}" href="${hashFor(entry.id)}">${esc(entry.title)}</a>`;
   }
   if (previousGroup) html += '</div></div></div>';
  } else {
   const entries=guideNavigation[area]??guideNavigation.resources;
   const guideLink=([href,title])=>`<a class="tree-link ${path===href?'active':''}" href="#/${href}" ${path===href?'aria-current="page"':''}>${esc(title)}</a>`;
   const groups=area==='foundations'?foundationGroups:[];
   for(const entry of entries){
    const group=groups.find(([, , routes])=>routes.includes(entry[0]));
    if(!group){html+=guideLink(entry);continue;}
    const [id,title,routes]=group;
    if(routes[0]!==entry[0])continue;
    if(routes.includes(path))expandedGroups.add(id);
    html+=openTreeGroup(id,title)+entries.filter(([href])=>routes.includes(href)).map(guideLink).join('')+'</div></div></div>';
   }
  }
  navigation.innerHTML = html;
  sidebarScroll.scrollTop = 0;
 }
 if (area !== 'components') return;
 markCurrent(navigation.querySelector('.tree-root'), !currentComponent);
 for (const link of navigation.querySelectorAll('[data-component-link]')) markCurrent(link, link.dataset.componentLink === currentComponent?.id);
 for (const button of navigation.querySelectorAll('[data-tree-group]')) {
  const active = button.dataset.treeGroup === group;
  button.classList.toggle('contains-current', active);
  if (active && componentChanged) setGroupExpanded(button, true);
 }
 if (componentChanged && !mobileQuery.matches && !drawerQuery.matches) {
  requestAnimationFrame(() => {
   const active = navigation.querySelector('[data-component-link][aria-current="page"]');
   if (active) active.scrollIntoView({block:'nearest', behavior:'instant'});
  });
 }
}
function updateTheme(){
 const dark=currentTheme()==='dark';document.querySelectorAll('[data-action="theme"]').forEach(b=>{
  const label=dark?'Activar tema claro':'Activar tema oscuro',symbol=dark?'light_mode':'dark_mode';
  if(b.matches('[data-mobile-design-host]')){b.dataset.selected=String(dark);b.dataset.accessibilityLabel=label;b.dataset.icon=symbol;}
  else{b.setAttribute('aria-label',label);if(b.querySelector('.symbol'))b.querySelector('.symbol').textContent=symbol;}
 });
 const reduced=document.documentElement.dataset.reduced==='true';document.querySelectorAll('[data-action="motion"]').forEach(b=>{
  const label=reduced?'Activar animaciones':'Reducir animaciones',symbol=reduced?'play_arrow':'pause';
  if(b.matches('[data-mobile-design-host]')){b.dataset.selected=String(reduced);b.dataset.accessibilityLabel=label;b.dataset.icon=symbol;}
  else{b.setAttribute('aria-pressed',String(reduced));b.setAttribute('aria-label',label);if(b.querySelector('.symbol'))b.querySelector('.symbol').textContent=symbol;}
 });
 docsControls?.configure({theme:currentTheme(),reduced,onAction:activateControl,searchOptions});
 document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue('--doc-canvas').trim();
 document.querySelectorAll('[data-native-image]').forEach(img=>{img.src='./native/'+img.dataset.nativeImage+(dark?'-dark':'')+'.png';});
 document.querySelectorAll('[data-native-link]').forEach(a=>{a.href='./native/'+a.dataset.nativeLink+(dark?'-dark':'')+'.png';});
 document.querySelectorAll('[data-component-runtime], [data-catalog-popup-preview]').forEach(frame=>frame.contentWindow?.postMessage({type:'mobile-design:environment',theme:currentTheme(),reduced},location.origin));
}
function showCatalog(){
 clearPageButtons(main);
 currentComponent=undefined;
 main.innerHTML=`<div class="catalog-hero">
  <header class="page-heading catalog-heading"><h1>Componentes</h1><p class="intro">Explora las piezas de Mobile Design por su función. Cada ficha reúne ejemplos, variantes, especificaciones, API y pautas de accesibilidad.</p></header>
  <div class="catalog-hero-art" aria-hidden="true">
   <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice" focusable="false">
    <rect width="560" height="320" fill="var(--primary-container)"/>
    <path d="M0 320V144a144 144 0 0 1 288 0v176Z" fill="var(--primary)"/>
    <path d="M0 320v-48a104 104 0 0 1 208 0v48Z" fill="var(--on-primary)"/>
    <circle cx="144" cy="138" r="44" fill="var(--primary-container)"/>
    <rect x="304" y="20" width="236" height="124" rx="62" fill="var(--tertiary-container)"/>
    <path d="M414 158c28 0 29 28 51 39 22 11 59 2 65 32 5 26-22 37-39 52-17 15-24 39-51 39-28 0-42-21-63-29-25-9-57-12-57-40 0-29 33-38 53-53 18-14 16-40 41-40Z" fill="var(--tertiary)"/>
    <circle cx="441" cy="239" r="26" fill="var(--tertiary-container)"/>
   </svg>
  </div>
 </div>
 <section id="explore"><div class="section-top"><h2>Encuentra tu siguiente pieza</h2><div class="page-filter-search" data-mobile-design-host data-kind="filter-field" data-input-id="catalog-filter" data-label="Filtrar componentes" data-action="catalog-query" data-value="${esc(catalogQuery)}"></div></div><div class="filter-bar mobile-design-group" data-mobile-design-host data-kind="button-group" data-action="filter" data-accessibility-label="Categorías del catálogo" data-value="${esc(filter)}" data-items="${esc(JSON.stringify(Object.entries(categories).map(([value,label])=>({value,label}))))}"></div><p class="component-count" id="component-count"></p><div class="catalog-grid" id="catalog-grid"></div></section>`;
 updateCatalog();
}
function updateCatalog(){
 clearPageButtons(document.querySelector('#catalog-grid'));
 const query=normal(catalogQuery);
 const entries=data.components.filter(c=>(filter==='all'||c.category===filter)&&normal([c.title,...c.searchAliases,...c.variants,...c.exports].join(' ')).includes(query));
 document.querySelector('#component-count').textContent=`${entries.length} ${entries.length===1?'componente':'componentes'} · en el orden de Material 3`;
 document.querySelector('#catalog-grid').innerHTML=entries.length?entries.map(c=>`<a class="component-card" data-component="${c.id}" href="${hashFor(c.id)}" aria-label="Ver ${esc(c.title)}"><div class="card-preview" aria-hidden="true" inert>${illustrationMarkup(c.id)}</div><div class="card-content"><h3>${esc(c.title)}</h3><p>${esc(c.tagline)}</p></div></a>`).join(''):`<div class="empty-state">${icon('search')}<h3>No encontramos esa pieza</h3><p>Prueba con otro nombre o selecciona «Todos».</p>${pageButton('reset-filter','Limpiar filtros','','tonal')}</div>`;
 mountPageButtons();
}
let sectionTabObserver;
const motionReduced = () => document.documentElement.dataset.reduced === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealSectionTab(tabs, smooth = false) {
 const active = tabs.querySelector('[aria-current="page"]');
 const inset = 4;
 const left = Math.min(tabs.scrollLeft, active.offsetLeft - inset);
 const right = Math.max(left, active.offsetLeft + active.offsetWidth + inset - tabs.clientWidth);
 if (right !== tabs.scrollLeft) tabs.scrollTo({left:right, behavior:smooth && !motionReduced()?'smooth':'instant'});
}

function renderComponent(c, section, sameComponent) {
 const active = sections.some(item => item[0] === section) ? section : 'overview';
 const sectionChanged = sameComponent && currentSection !== active;
 currentComponent = c;
 currentSection = active;
 const toc = {overview:[['in-action',hasInteractiveExample(c.id)?'Interactivo':'Vista del componente'],['when','Cuándo usarlo'],['implementation','Integración'],['variants','Variantes'],['example','Implementación']],specs:[['anatomy','Anatomía'],['dimensions','Dimensiones'],['defaults','Valores iniciales'],['tokens','Tema y estados']],api:[['import','Importación'],['properties','Propiedades'],['contracts','Tipos relacionados'],['example','Ejemplos']],accessibility:[['semantics','Semántica'],['focus','Foco y movimiento'],['coverage','Evidencia']]};
 if (!sameComponent) {
  const tabs = sections.map(([id,symbol,label]) => `<a href="${hashFor(c.id,id)}" data-section-tab="${id}">${icon(symbol)}<span class="section-tab-label">${label}</span></a>`).join('');
  main.innerHTML = `<div class="detail-heading page-heading"><div class="eyebrow">${icon(c.icon)}${esc(categories[c.category])} <span style="opacity:.45">/</span> ${esc(c.searchAliases[0]??c.title)}</div><h1>${esc(c.title)}</h1><p class="intro">${esc(c.description)}</p></div><div class="detail-layout component-layout"><span class="section-tabs-start" aria-hidden="true"></span><nav class="component-tabs" data-mobile-design-popup-inset="top" aria-label="Secciones de ${esc(c.title)}"><div class="component-tab-track">${tabs}</div></nav><div class="component-index">${articleIndex(esc(c.title))}</div><div class="component-section"></div><div class="article-pager"></div></div>`;
 }
 const tabs = main.querySelector('.component-tabs');
 for (const link of tabs.querySelectorAll('[data-section-tab]')) markCurrent(link, link.dataset.sectionTab === active);
 revealSectionTab(tabs, sectionChanged);
 if (!sameComponent) {
  sectionTabObserver = new ResizeObserver(() => revealSectionTab(tabs));
  sectionTabObserver.observe(tabs);
  for (const link of tabs.querySelectorAll('[data-section-tab]')) sectionTabObserver.observe(link);
 }
 const content = componentDocs[active](c, {data,codeCard,theme:currentTheme(),reduced:document.documentElement.dataset.reduced==='true'});
 main.querySelector('.component-section').innerHTML = `<div${sectionChanged?' class="section-enter"':''}>${content}</div>`;
 main.querySelector('.toc-links').innerHTML = toc[active].map(([id,label]) => `<a href="#${id}" data-scroll-to="${id}">${label}</a>`).join('');
 const componentIndex = data.components.indexOf(c);
 const sectionIndex = sections.findIndex(([id])=>id===active);
 const adjacent = step=>{
  const otherSection=sections[sectionIndex+step];
  const otherComponent=data.components[componentIndex+step];
  if(otherSection)return [hashFor(c.id,otherSection[0]).slice(2),esc(c.title)+' · '+otherSection[2]];
  if(otherComponent)return [hashFor(otherComponent.id).slice(2),esc(otherComponent.title)];
 };
 main.querySelector('.article-pager').innerHTML=articlePager(adjacent(-1),adjacent(1));
}
const providerExample=`import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileDesignProvider, Button } from 'mobile-design';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MobileDesignProvider colorScheme="light" motion="expressive">
          <Button onPress={() => console.log('Hola, Mobile Design')}>
            Empezar
          </Button>
        </MobileDesignProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}`;
const dependencyUsage={
 react:'Base de la aplicación y del proveedor.',
 'react-native':'Primitivas, entradas y distribución de los componentes.',
 'expo-font':'Carga Roboto y Material Symbols desde el proveedor.',
 'react-native-paper':'Tema, proveedor y primitivas compartidas.',
 'react-native-reanimated':'Animaciones y transiciones.',
 'react-native-worklets':'Animaciones y gestos que se ejecutan en el hilo de interfaz.',
 'react-native-gesture-handler':'Gestos en carruseles, listas y hojas.',
 'react-native-safe-area-context':'Márgenes de seguridad en barras, navegación y diálogos.',
 'react-native-svg':'Trazados de indicadores, controles e iconos.',
 'expo-image':'Renderiza las imágenes de los carruseles.',
 '@gorhom/bottom-sheet':'Panel inferior y campos de texto integrados en él.',
 'react-dom':'Renderiza React en el navegador.',
 'react-native-web':'Adapta las primitivas de React Native al navegador.',
};
function dependencyTable(id,heading,peers){
 return `<h3 id="${id}">${heading}</h3><div class="table-scroll"><table class="spec-table dependency-table" aria-labelledby="${id}">
  <thead><tr><th scope="col">Dependencia y uso</th><th scope="col">Versión declarada</th></tr></thead>
  <tbody>${peers.map(([name,version])=>`<tr><th scope="row"><code>${esc(name)}</code><span>${esc(dependencyUsage[name]??'')}</span></th><td><code>${esc(version)}</code></td></tr>`).join('')}</tbody>
 </table></div>`;
}
function installationPage(){
 currentComponent=undefined;
 const peers=Object.entries(data.peers);
 const webOnly=([name])=>data.optionalPeers?.[name]?.optional===true;
 main.innerHTML=`<div class="guide-layout">
  <div class="page-heading"><div class="eyebrow">${icon('code')}DESARROLLO</div><h1>Instalación<br>y proveedor</h1><p class="intro">Una base compartida de componentes, colores y movimiento para construir tu app con React Native.</p></div>
  <div class="guide-grid"><article class="guide-card">${icon('widgets')}<h3>36 familias, un sistema</h3><p>Componentes con variantes, estados y acciones coordinadas con el tema de la app.</p>${link('#/components','Explorar componentes')}</article><article class="guide-card">${icon('palette')}<h3>Una identidad compartida</h3><p>Roboto, Material Symbols y roles semánticos de color desde un único proveedor.</p>${link('#/styles','Conocer los estilos')}</article></div>
  <section class="doc-section"><span class="step-number">1</span><h2>Conecta el paquete local</h2><p>Mobile Design <code>${data.version}</code> es un paquete privado del workspace. La documentación corresponde a esa implementación; todavía no hay una distribución pública en npm.</p>${codeCard(`// package.json de tu app dentro del workspace\n{\n  "dependencies": {\n    "mobile-design": "workspace:*"\n  }\n}`, 'package.json')}${codeCard('pnpm install','Terminal')}<p>La app del workspace ya declara sus dependencias. Ejecuta <code>pnpm install</code> desde la raíz para resolverlas juntas.</p></section>
  <section class="doc-section"><span class="step-number">2</span><h2>Prepara el proveedor</h2><p><code>MobileDesignProvider</code> comparte el tema, el contexto de Paper, los iconos y las fuentes incluidas. Las superficies con gestos necesitan el root de Gesture Handler.</p>${codeCard(providerExample,'App.tsx')}</section>
  <section class="doc-section"><span class="step-number">3</span><h2>Elige tu primera pieza</h2><p>Usa el estado de tu pantalla para controlar selección, texto y apertura. Cada ficha reúne el uso, la integración, los estados, la accesibilidad y los ejemplos nativos que puedes copiar o descargar.</p><div class="reference-grid">${['buttons','text-fields','tabs','lists'].map(id=>{const c=data.components.find(c=>c.id===id);return `<a class="reference-card" href="${hashFor(id)}">${icon(c.icon)}${c.title}${icon('arrow_forward')}</a>`}).join('')}</div></section>
  <section class="doc-section" id="dependencies">
   <h2>Dependencias y versiones</h2>
   <p>Estas son las dependencias compartidas que declara <code>mobile-design/package.json</code>. React y React Native forman parte de la base de tu app. Si integras el paquete en otra app Expo, usa versiones compatibles con su SDK y con los rangos de esta tabla.</p>
   ${dependencyTable('required-dependencies','Requeridas por el paquete',peers.filter(peer=>!webOnly(peer)))}
   ${dependencyTable('web-dependencies','Solo para web',peers.filter(webOnly))}
   <p><code>@mobile-design/icons</code> y <code>@mobile-design/tokens</code> se resuelven al enlazar Mobile Design en el workspace.</p>
   <p>Los rangos corresponden al manifiesto. Consulta ${link('#/verification','Verificación')} para conocer el alcance de las pruebas.</p>
  </section>
 </div>`;
}
function hex(color){const match=color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return match?'#'+match.slice(1,4).map(v=>Number(v).toString(16).padStart(2,'0')).join('').toUpperCase():color;}
function renderStyleReference(){currentComponent=undefined;const colors=data.colors[currentTheme()];const palette=[['primary','onPrimary','Primary'],['primaryContainer','onPrimaryContainer','Primary container'],['secondary','onSecondary','Secondary'],['secondaryContainer','onSecondaryContainer','Secondary container'],['tertiary','onTertiary','Tertiary'],['tertiaryContainer','onTertiaryContainer','Tertiary container'],['surface','onSurface','Surface'],['surfaceContainer','onSurface','Surface container'],['error','onError','Error']];main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('palette')}FUNDAMENTOS DE ESTILO</div><h1>Una misma<br>personalidad.</h1><p class="intro">Color, tipografía, formas y movimiento. Las decisiones compartidas que conectan cada componente.</p></div><section class="doc-section" id="color"><div class="section-top"><h2>Color con significado</h2>${pageButton('theme','Cambiar tema',currentTheme()==='dark'?'light_mode':'dark_mode','tonal')}</div><p>La paleta predeterminada es <strong>MD3 Baseline</strong>. Estos valores se sincronizan desde la salida canónica del paquete; toca un color para copiarlo.</p><div class="palette-grid">${palette.map(([role,onRole,label])=>`<button class="swatch" data-action="copy-color" data-color="${esc(hex(colors[role]))}" aria-label="Copiar ${label}, ${hex(colors[role])}" style="background:${colors[role]};color:${colors[onRole]}"><strong>${label}</strong><code>${hex(colors[role])}</code>${icon('content_copy')}</button>`).join('')}</div>${codeCard(`import { createMobileDesignTheme, MobileDesignProvider } from 'mobile-design';\n\nconst theme = createMobileDesignTheme({\n  colorScheme: '${currentTheme()}',\n  motion: 'expressive',\n});\n\n// El proveedor también admite colorScheme y motion directamente.\n<MobileDesignProvider theme={theme}>\n  {/* Tu aplicación */}\n</MobileDesignProvider>`,'theme.tsx')}<p>En el workspace, <code>pnpm theme:generate md3-baseline</code> genera los roles compartidos de la app. Una semilla HEX puede generar otra paleta sin cambiar las APIs de los componentes.</p></section><section class="doc-section" id="typography"><h2>Roboto, de principio a fin</h2><p>La escala compartida incluye 15 estilos base y 15 enfatizados. Estas muestras utilizan Text del paquete, con su fuente e interlineado reales.</p>${[['Display','displayLarge'],['Headline','headlineMedium'],['Title','titleLarge'],['Body','bodyLarge'],['Label','labelLarge']].map(([label,variant])=>`<div class="type-sample">${pageText(variant,label+' · Haz espacio para lo importante.')}<small>${variant}</small></div>`).join('')}${link('#/styles/typography','Explorar Text y los 30 estilos')}</section><section class="doc-section" id="icons"><h2>Material Symbols Rounded</h2><p>Los iconos comparten el lenguaje visual del sistema. Los controles sin texto necesitan un nombre accesible.</p><div class="preview-row" style="justify-content:flex-start;gap:20px;padding:20px 0">${['search','arrow_back','close','favorite','bookmark','music_note','more_vert'].map(name=>`<span style="background:var(--surface-container);border-radius:16px;padding:16px">${icon(name)}</span>`).join('')}</div>${codeCard(`import { IconButton, MaterialSymbol } from 'mobile-design';\n\n<MaterialSymbol name="search" size={24} />\n<IconButton icon="magnify" accessibilityLabel="Buscar música"\n  onPress={() => console.log('Buscar')} />`,'Icons.tsx')}</section><section class="doc-section" id="shape"><h2>Formas con intención</h2><p>Las esquinas siguen los tokens del tema y la función del componente. La forma puede responder a presión y selección.</p><div class="shape-row">${[[4,'Extra small'],[8,'Small'],[12,'Medium'],[16,'Large'],[28,'Extra large']].map(([radius,label])=>`<div class="shape-tile" style="border-radius:${radius}px">${label}</div>`).join('')}</div><p class="responsive-note">Muestra visual de radios. Las medidas específicas de cada componente se documentan en su ficha.</p></section><section class="doc-section" id="motion"><h2>Movimiento que acompaña</h2><p>El proveedor permite elegir movimiento estándar o expresivo. La preferencia de movimiento reducido se obtiene del sistema; no necesita una propiedad adicional del proveedor.</p>${codeCard(`<MobileDesignProvider motion="expressive">\n  {/* Tu aplicación */}\n</MobileDesignProvider>`,'Motion.tsx')}${pageButton('motion','Alternar movimiento','pause','tonal')}</section></div>`;}
function verificationPage(){
 currentComponent=undefined;const v=data.verification;
 main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('verified')}REVISIÓN DEL 2 DE NOVIEMBRE DE 2026</div><h1>Detalles<br>que se revisan.</h1><p class="intro">El estado de verificación de Mobile Design, con evidencia concreta y un alcance explícito.</p></div><div class="stats-grid"><div class="verification-stat"><b>${v.families}</b><span>familias revisadas</span></div><div class="verification-stat"><b>${v.automatic}/37</b><span>bloques automáticos aprobados</span></div><div class="verification-stat"><b>${v.nativeCases}</b><span>casos de interacción aprobados</span></div></div><section class="doc-section"><h2>Qué cubre la revisión</h2><ul class="check-list"><li>${icon('check_circle')}36 galerías con capturas claras/oscuras y movimiento reducido.</li><li>${icon('check_circle')}12 acciones adicionales: presión, cancelación, selección, teclado, navegación, gestos y cargas.</li><li>${icon('check_circle')}${v.voiceOver} recorridos con lector de pantalla y ${v.largeText} casos con texto ampliado.</li><li>${icon('check_circle')}TypeScript y contratos automáticos; 33 casos de selección y ciclo de vida.</li><li>${icon('check_circle')}Selección de hora, texto ampliado y ambos temas.</li></ul></section><section class="doc-section"><h2>Cómo leer estos resultados</h2><p>Los resultados corresponden a los casos registrados en la revisión. Las capturas de cada galería están disponibles en su ficha, en la sección Descripción.</p>${callout('Una captura acredita un estado concreto','No significa que se hayan probado todas las variantes ni todas sus combinaciones. Las verificaciones del sitio y los contratos de código tienen un alcance distinto al comportamiento del componente en una aplicación.')}</section><section class="doc-section"><h2>Correcciones realizadas</h2>${table([['Chip','Identidades distintas para las regiones primaria y de cierre.'],['TimePicker','Alineación tipográfica y de acciones con texto ampliado.'],['Ejemplo de Progress','Concepto e importe agrupados para lectura accesible.'],['Galerías','Distribución del contenido al abrir el teclado.']])}</section><section class="doc-section"><h2>Alcance de la revisión</h2><p>Se revisaron recorridos representativos, estados de interacción y configuraciones de accesibilidad. Las adaptaciones de movimiento, física y geometría deben evaluarse también dentro de la pantalla que utiliza el componente.</p><p>El estado del soporte en navegador se documenta por separado.</p>${link('#/support','Consultar soporte')}</section></div>`;
}
function supportPage(){currentComponent=undefined;main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('smartphone')}PLATAFORMAS Y SOPORTE</div><h1>El alcance,<br>bien definido.</h1><p class="intro">Mobile Design es un paquete de componentes React Native que utiliza módulos Expo. Esta página web concentra su documentación.</p></div><section class="doc-section"><h2>Entornos del paquete</h2>${table([['React Native con Expo','Entorno principal del paquete documentado.'],['React Native con módulos Expo integrados','Necesita las dependencias nativas declaradas y su configuración; no es una distribución independiente de Expo Font/Image.'],['Expo Web / React Native Web','Pendiente de verificación integral. Las adaptaciones existentes se conservan.'],['React DOM sin React Native Web','No hay una distribución DOM independiente verificada.']])}</section><section class="doc-section"><h2>Integración web</h2><p>Buttons, Extended FABs, FAB menu, FABs, Icon buttons, Segmented buttons, Split button y Cards cuentan con ejemplos interactivos de los componentes originales. Permiten explorar sus variantes, tamaños, estados, movimiento y acciones completas.</p><div class="doc-action-row"><a class="text-link" href="#/components/buttons/overview">Abrir Buttons ${icon('arrow_forward')}</a><a class="text-link" href="#/components/extended-fab/overview">Abrir Extended FABs ${icon('arrow_forward')}</a><a class="text-link" href="#/components/fab-menu/overview">Abrir FAB menu ${icon('arrow_forward')}</a><a class="text-link" href="#/components/floating-action-button/overview">Abrir FABs ${icon('arrow_forward')}</a><a class="text-link" href="#/components/icon-buttons/overview">Abrir Icon buttons ${icon('arrow_forward')}</a><a class="text-link" href="#/components/segmented-buttons/overview">Abrir Segmented buttons ${icon('arrow_forward')}</a><a class="text-link" href="#/components/split-button/overview">Abrir Split button ${icon('arrow_forward')}</a><a class="text-link" href="#/components/cards/overview">Abrir Cards ${icon('arrow_forward')}</a></div><p>Los botones de copiar código, limpiar filtros y las acciones de tema y movimiento de las guías utilizan Button de Mobile Design. Los controles de icono de tema, movimiento, búsqueda, navegación móvil y enlaces de apartado utilizan IconButton original. El catálogo utiliza Card como enlace real. Los encabezados de ejemplos descargables utilizan SplitButton para copiar, descargar o copiar el enlace. La integración de navegación, campos y filtros continúa por familias.</p><h3>Componentes pendientes</h3><p>Las otras 28 familias siguen pendientes de revisión web. Hay ramas específicas para navegador en el código de varios componentes. Se conservan para una futura revisión. Su existencia no acredita que las 36 familias estén listas o se comporten igual en navegador.</p><ul class="check-list"><li>${icon('info')}Pendiente en las demás familias: compilación y ejecución con React Native Web.</li><li>${icon('info')}Pendiente: gestos, teclado, foco, animaciones, overlays y lectores de pantalla en navegador.</li><li>${icon('info')}Pendiente en las demás familias: matriz de variantes e interacciones web.</li></ul></section><section class="doc-section"><h2>Qué muestra esta documentación</h2><p>Las fichas contienen API extraída del paquete, instrucciones de integración, funcionamiento, accesibilidad, ejemplos TSX y capturas nativas. Las ilustraciones del catálogo son decorativas.</p><p>Los ejemplos interactivos utilizan el paquete mediante React Native Web. Las capturas muestran estados registrados; los ejemplos descargables utilizan los componentes originales.</p></section><section class="doc-section"><h2>Repositorio de documentación</h2><p><a href="https://github.com/nicolas-rm/mobile-design" target="_blank" rel="noopener noreferrer">nicolas-rm/mobile-design ${icon('open_in_new')}</a> contiene este proyecto de documentación. No publica el paquete nativo en npm ni incluye la app Music Design.</p></section></div>`;}

const currentPath=()=>location.hash.startsWith('#/')?location.hash.slice(2).split('?')[0].replace(/\/$/,''):'home';
const currentArea=path=>path==='support'?'develop':path==='verification'?'resources':path.split('/')[0];
function typographyPage(){
 currentComponent=undefined;
 const url=webRuntime.typography+'&theme='+currentTheme()+'&reduced='+(document.documentElement.dataset.reduced==='true');
 main.innerHTML=guideMarkup({title:'Text y tipografía',intro:'Una escala compartida para títulos, lectura y controles. Explora el componente Text con sus 15 estilos base y 15 estilos enfatizados.',art:'type',sections:[
  {id:'text-playground',title:'Prueba el texto real',html:`<p>Cambia función, tamaño, énfasis, alineación y altura de escritura. Las muestras se renderizan con Text del paquete y muestran sus medidas del tema.</p><div class="interactive-example"><div class="runtime-loading" role="status">Preparando ejemplo…</div><iframe data-component-runtime="text" src="${esc(url)}" title="Text: escala, medidas y ejemplos" height="1400" aria-busy="true"></iframe></div>`},
  {id:'text-usage',title:'Elegir por función',html:`<div class="page-text-examples">${pageText('headlineMedium','Tu biblioteca')}${pageText('bodyLarge','Todo lo que quieres volver a escuchar.')}${pageText('labelLargeEmphasized','Nuevo episodio')}</div><p>Display destaca frases breves. Headline organiza el contenido principal. Title identifica secciones. Body permite leer párrafos. Label nombra controles y metadatos. Cada función tiene tamaños Large, Medium y Small.</p>${codeCard(`import { Text } from 'mobile-design';\n\n<Text variant="headlineMedium" accessibilityRole="header">Tu biblioteca</Text>\n<Text variant="bodyLarge" selectable>Todo lo que quieres volver a escuchar.</Text>\n<Text variant="labelLargeEmphasized">Nuevo episodio</Text>`,'Typography.tsx')}<p>La variante define la apariencia. Declara la semántica del encabezado por separado; un texto grande no se convierte automáticamente en encabezado.</p>`},
  {id:'text-module',title:'Ejemplo completo',html:codeCard(data.foundationExamples.typography.code,'Typography.tsx','./examples/typography.tsx')},
  {id:'text-emphasis',title:'Base y énfasis',html:`<p>Los estilos Emphasized elevan el peso sin inventar otro tamaño. Úsalos para una selección, un mensaje sin leer o una parte destacada del contenido. Conserva un texto base legible alrededor.</p>${codeCard(`<Text variant="bodyLarge">\n  Escucha sin prisas.\n  <Text variant="bodyLargeEmphasized"> Tus favoritos siguen aquí.</Text>\n</Text>`,'Emphasis.tsx')}`},
  {id:'text-language',title:'Interlineado y escritura',html:`<p>El proveedor incluye los perfiles small, medium, large y extraLarge para la altura de escritura. Small conserva la escala latina utilizada en la app. Elige el perfil según el idioma del contenido; si no lo conoces, considera medium y verifica la lectura. La selección del perfil es explícita.</p>${codeCard(`<MobileDesignProvider languageHeight="medium">\n  <Text variant="bodyLarge">Contenido de tu aplicación</Text>\n</MobileDesignProvider>`,'LanguageHeight.tsx')}<p>El perfil ajusta el interlineado de los 30 estilos del tema compartido. El escalado de fuente del sistema continúa activo. Evita alturas fijas, recortes y ajustes que reduzcan el texto para forzarlo dentro de su contenedor.</p>`},
  {id:'text-fonts',title:'Fuente y números',html:`<p>Roboto se incluye con pesos e itálicas reales. El proveedor carga la fuente local y comparte sus roles con los componentes. Esta escala utiliza Roboto estática; los ejes variables de Roboto Flex requieren esa fuente y su configuración específica.</p>${codeCard(`<Text variant="displaySmall" style={{ fontVariant: ['tabular-nums'] }}>\n  01:11 / 08:48\n</Text>`,'Timecode.tsx')}<p>Los números tabulares mantienen su ancho en contadores y tiempos. Conserva los roles de color del tema para que el texto se adapte al esquema claro y oscuro.</p>`},
  {id:'text-accessibility',title:'Lectura y accesibilidad',html:'<p>Usa texto seleccionable cuando pueda ser útil copiarlo. Mantén el escalado del sistema y un ancho cómodo para leer; comprueba la redistribución con zoom y traducciones. El texto estático no necesita animación de entrada o de presión.</p><p>En encabezados, declara su función y nivel. Los enlaces deben tener destino, nombre claro, subrayado y un color de contenido con contraste suficiente. No uses sólo peso o color para comunicar una acción.</p>'},
  {id:'text-properties',title:'Propiedades de Text',html:'<ul><li><code>variant</code>: función, tamaño y énfasis de la escala. Ejemplos: <code>bodyLarge</code> y <code>bodyLargeEmphasized</code>.</li><li><code>selectable</code>: permite seleccionar el contenido para copiarlo.</li><li><code>style</code>: admite alineación, color, itálica y números tabulares. Conserva las medidas del token cuando no exista una necesidad concreta de cambiarlas.</li><li><code>allowFontScaling</code>: conserva su valor predeterminado activo para respetar el tamaño de texto del sistema.</li><li><code>numberOfLines</code> y <code>ellipsizeMode</code>: limitan líneas cuando la composición lo requiere. Evita truncar el cuerpo de un artículo o sustituir esta opción por una altura fija.</li><li><code>accessibilityRole</code> o <code>role</code>: describen la función semántica; la variante visual no define el nivel de encabezado.</li><li><code>onPress</code>: conserva la interacción nativa de texto. Para una acción con superficie, utiliza Button; para editar contenido, utiliza TextField.</li></ul>'},
 ]});
 return true;
}
function stylePage(topic){
 if(topic==='typography')return typographyPage();
 renderStyleReference();
 const source=main.querySelector('#'+topic);
 if(!source)return false;
 source.querySelector('h2')?.remove();
 const original=source.outerHTML;
 const [title,intro]=styleTopics[topic];
 const extra={
  color:[['roles','Emparejar superficie y contenido','Usa primary con onPrimary y los contenedores con sus roles de contenido. Surface y onSurface forman la base de lectura; error comunica una condición que necesita atención. No reemplaces los roles por colores aislados al consumir el componente.'],['schemes','Esquemas claros y oscuros','La paleta se adapta al esquema seleccionado. Revisa superficies, texto y estados en ambos temas. La documentación usa la paleta canónica del paquete; el botón cambia tanto esta página como las capturas disponibles.']],
  typography:[['hierarchy','Elegir por función','Display destaca contenido principal; headline organiza secciones; title identifica regiones; body permite lectura y label nombra controles. La jerarquía depende de la tarea y no sólo del tamaño visual.'],['scaling','Contenido que crece','Utiliza las variantes del componente Text y permite el escalado del sistema. No ajustes la altura de una fila a una sola cadena: traducciones y accesibilidad necesitan espacio.']],
  icons:[['meaning','Elegir y nombrar','Usa el icono que mejor represente la función. Las acciones sin etiqueta visible necesitan un nombre accesible. No uses una X para borrar contenido vacío ni para representar dos acciones ambiguas a la vez.'],['alignment','Tamaño y alineación','El glifo vive dentro de la caja del control. Centra esa caja y conserva el área de interacción indicada por el componente. Comprueba las posiciones con iconos diferentes sin añadir offsets particulares por pantalla.']],
  shape:[['geometry','Forma según el componente','Las formas agrupan contenido y distinguen controles. Utiliza las opciones de la familia; no impongas el mismo radio a diálogos, botones, filas y barras.'],['state-shape','Forma y estado','Al cambiar por presión o selección, la forma debe completar su transición y volver al estado adecuado. La capa de estado debe quedar contenida dentro de la geometría del control.']],
  motion:[['transitions','Entrada, salida y continuidad','Una transición debe explicar qué apareció, desapareció o cambió. Comprueba su interrupción, el cierre durante la apertura y las pulsaciones consecutivas. No dejes capas de estado ni superficies bloqueadas tras cancelar.'],['reduction','Reducir sin perder significado','La preferencia del sistema puede reducir movimiento. Conserva selección, resultado y orden de foco incluso si el cambio visual es inmediato. El control de movimiento de este sitio sólo afecta la documentación.']]
 }[topic];
 main.innerHTML=guideMarkup({title,intro,art:topic==='typography'?'type':topic==='motion'?'interaction':topic,sections:[{id:topic,title,html:original.replace(/^<section[^>]*>|<\/section>$/g,'').replace(/^<h2>[^<]*<\/h2>/,'')},...extra.map(([id,title,text])=>({id,title,html:'<p>'+text+'</p>'}))]});
 return true;
}
function enhanceArticle(){
 // Keep headings and anchor targets consistent across editorial and generated pages.
 main.querySelectorAll('.toc a[data-scroll-to]').forEach(link=>{if(!main.querySelector('#'+link.dataset.scrollTo))link.remove();});
 main.querySelectorAll('section.doc-section').forEach((el,index)=>{if(!el.id)el.id='section-'+(index+1);});
 main.querySelectorAll('.doc-section h2,.home-section>h2,.section-intro>h2').forEach(heading=>{
  const id=heading.closest('section')?.id;if(!id)return;
  const row=document.createElement('div');row.className='heading-row';heading.before(row);row.append(heading);
  row.insertAdjacentHTML('beforeend',`<button class="heading-link" data-action="copy-link" data-anchor="${id}" aria-label="Copiar enlace a ${esc(heading.textContent)}">${icon('link')}</button>`);
 });
}
function route(){
 if(!data)return;
 const path=currentPath(),[page,id,section='overview']=path.split('/');
 const area=currentArea(path);
 const component=page==='components'&&id?data.components.find(c=>c.id===id):undefined;
 const sameComponent = Boolean(component && currentComponent?.id === component.id);
 const previousTabs = sameComponent ? main.querySelector('.component-tabs') : null;
 const keepTabsVisible = previousTabs && previousTabs.getBoundingClientRect().top <= parseFloat(getComputedStyle(previousTabs).top) + 1;
 const sidebarHadFocus = (mobileQuery.matches||drawerQuery.matches) && navigation.contains(document.activeElement);
 const pagerHadFocus = document.activeElement.matches('.next-prev a:focus-visible');
 if (sameComponent) {
  clearPageButtons(main.querySelector('.component-section'));
  clearPageButtons(main.querySelector('.toc-links'));
  clearPageButtons(main.querySelector('.article-pager'));
 } else {
  clearPageButtons(main);
  sectionTabObserver?.disconnect();
 }
 currentComponent=undefined;
 let title;
 if(path==='home'||path===''){main.innerHTML=homeMarkup(data);title='Inicio';}
 else if(component){renderComponent(component,section,sameComponent);title=component.title;}
 else if(path==='components'){showCatalog();title='Componentes';}
 else if(path==='develop/installation'){installationPage();title='Instalación y proveedor';}
 else if(page==='styles'&&styleTopics[id]){stylePage(id);title=styleTopics[id][0];}
 else if(path==='verification'){verificationPage();title='Verificación';}
 else if(path==='support'){supportPage();title='Plataformas y soporte';}
 else if(guides[path]){main.innerHTML=guideMarkup(guides[path]);title=guides[path].title;}
 else{title='Página no encontrada';main.innerHTML=`<div class="page-heading"><h1>Página no encontrada</h1><p class="intro">La dirección no corresponde a una sección de la documentación.</p>${link('#/home','Volver al inicio')}</div>`;}
 if(main.querySelector('.guide-document')){
  const entries=guideNavigation[area]??[];
  const i=entries.findIndex(([href])=>href===path);
  if(i!==-1)main.insertAdjacentHTML('beforeend',articlePager(entries[i-1],entries[i+1]));
 }
 document.body.dataset.area=area;
 document.body.dataset.route=path;
 document.body.dataset.shell=page==='home'||!path?'home':'documentation';
 railHost.dataset.value=area;
 const areaTitle=areas.find(entry=>entry[0]===area)?.[2]??'Documentación';
 document.querySelector('#breadcrumbs').innerHTML=`<a href="#/home">Mobile Design</a>${path!=='home'?`<span>/</span>${title!==areaTitle?`<a href="#/${area}">${areaTitle}</a><span>/</span>`:''}${esc(title)}`:''}`;
 document.title=title+' · Mobile Design';
 setSidebar(false,false);
 renderSidebar();enhanceArticle();updateTheme();
 if (keepTabsVisible) {
  const start=main.querySelector('.section-tabs-start').getBoundingClientRect().top;
  const inset=parseFloat(getComputedStyle(previousTabs).top);
  window.scrollTo({top:scrollY+start-inset+2,behavior:'instant'});
 }
 else if (!sameComponent) window.scrollTo({top:0,behavior:'instant'});
 mountPageButtons();
 if(openDrawerAfterRoute){
  openDrawerAfterRoute=false;
  if(drawerQuery.matches&&area!=='home')setSidebar(true);
 }
 if (sidebarHadFocus) main.focus({preventScroll:true});
 if (pagerHadFocus) (main.querySelector('.component-tabs [aria-current="page"]')??main).focus({preventScroll:true});
 const target=new URLSearchParams(location.hash.split('?')[1]).get('section');
 if(target)requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({behavior:'instant'}));
 scheduleContentsUpdate();
}
function searchOptions(value){
 if(!data)return [];
 const query=normal(value.trim());
 const guideResults=[...Object.entries(guides).map(([path,entry])=>({href:'#/'+path,title:entry.title,detail:entry.intro,symbol:'description'})),...Object.entries(styleTopics).map(([id,[title,intro]])=>({href:'#/styles/'+id,title,detail:intro,symbol:'palette'})),{href:'#/develop/installation',title:'Instalación y proveedor',detail:'Dependencias y MobileDesignProvider',symbol:'code'},{href:'#/verification',title:'Verificación',detail:'Pruebas, evidencia nativa y alcance',symbol:'verified'},{href:'#/support',title:'Plataformas y soporte',detail:'React Native, Expo y soporte web pendiente',symbol:'smartphone'}].filter(entry=>normal(entry.title+' '+entry.detail).includes(query));
 const components=data.components.filter(c=>normal([c.title,...c.searchAliases,...c.variants,...c.configurations??[],...c.exports,...c.api.map(p=>p.name)].join(' ')).includes(query)).map(c=>({href:hashFor(c.id),title:c.title,detail:(c.searchAliases[0]??categories[c.category])+' · '+c.exports[0],symbol:c.icon}));
 const rank=entry=>{
  const title=normal(entry.title);
  return title===query?0:title.startsWith(query)?1:title.includes(query)?2:3;
 };
 const results=(query?[...guideResults,...components].sort((a,b)=>rank(a)-rank(b)):[...components.slice(0,6),...guideResults.slice(0,6)]).slice(0,16);
 return results.map(({href,title,detail,symbol})=>({value:href,href,label:title,description:detail,icon:symbol}));
}
function openSearch(){
 const input=document.querySelector('#global-search');
 if(!data||!input||searchDialog.open)return;
 searchHost.dispatchEvent(new Event('mobile-design:search-open'));
 searchDialog.showModal();
 input.focus();
}
async function copyText(value){
 try{
  await navigator.clipboard.writeText(value);
  docsControls?.notify('Copiado al portapapeles');
  return true;
 }catch{
  docsControls?.notify('No se pudo copiar. Puedes seleccionar el texto.');
  return false;
 }
}
async function activateControl(control,action=control.dataset.action){
 switch(action){
  case'search':openSearch();break;
  case'close-search':searchDialog.close();break;
  case'search-result':searchDialog.close();if(control.dataset.href)location.hash=control.dataset.href;break;
  case'sidebar':setSidebar(!document.body.classList.contains('sidebar-open'));break;
  case'close-sidebar':setSidebar(false);break;
  case'tree-group':setGroupExpanded(control,control.dataset.expanded!=='true');docsControls?.mount();break;
  case'scroll-to':scrollToSection(control.dataset.scrollTo);break;
  case'copy-link':{const url=new URL(location.href);url.hash='#/'+currentPath()+'?section='+control.dataset.anchor;await copyText(url.href);break;}
  case'theme':document.documentElement.dataset.theme=currentTheme()==='dark'?'light':'dark';try{localStorage.setItem('md-docs-theme',currentTheme())}catch{}if(currentPath().startsWith('styles/')){const scroll=window.scrollY,restoreThemeFocus=main.contains(control);route();if(restoreThemeFocus)(main.querySelector('[data-action="theme"] button')??main.querySelector('[data-action="theme"]'))?.focus({preventScroll:true});window.scrollTo({top:scroll,behavior:'instant'});}updateTheme();break;
  case'motion':document.documentElement.dataset.reduced=String(document.documentElement.dataset.reduced!=='true');try{localStorage.setItem('md-docs-reduced',document.documentElement.dataset.reduced)}catch{}updateTheme();break;
  case'filter':filter=control.dataset.filter;updateCatalog();break;
  case'catalog-query':catalogQuery=control.dataset.value;updateCatalog();break;
  case'api-query':{
   const query=normal(control.dataset.value);
   let count=0;
   main.querySelectorAll('#properties [data-prop]').forEach(row=>{row.hidden=!normal(row.dataset.prop).includes(query);if(!row.hidden)count++;});
   document.querySelector('#api-count').textContent=`${count} propiedades`;
   break;
  }
  case'reset-filter':filter='all';catalogQuery='';showCatalog();document.querySelector('#catalog-filter')?.focus();break;
  case'download-example':{const a=document.createElement('a');a.href=control.dataset.download;a.download=control.dataset.download.split('/').at(-1);document.body.append(a);a.click();a.remove();break;}
  case'copy-example-link':await copyText(new URL(control.dataset.download,location.href).href);break;
  case'copy':await copyText(control.closest('.code-card').querySelector('code').textContent);break;
  case'copy-color':await copyText(control.dataset.color);break;

 }
}
let contentsFrame;
function scheduleContentsUpdate() {
 if (contentsFrame) return;
 contentsFrame = requestAnimationFrame(() => {
  contentsFrame = undefined;
  const links = [...main.querySelectorAll('.toc [data-scroll-to]')];
  const tabs = main.querySelector('.component-tabs');
  if(tabs){
   const start=main.querySelector('.section-tabs-start');
   const pinned=start.getBoundingClientRect().top<=parseFloat(getComputedStyle(tabs).top)+1;
   tabs.toggleAttribute('data-pinned',pinned);
  }
  const firstSection=links[0]&&document.getElementById(links[0].dataset.scrollTo);
  const threshold=firstSection?parseFloat(getComputedStyle(firstSection).scrollMarginTop)+1:112;
  let active;
  for (const link of links) {
   const section = document.getElementById(link.dataset.scrollTo);
   if (section && section.getBoundingClientRect().top <= threshold) active = link;
  }
  for (const link of links) {
   if (link === active) {
    if (!link.hasAttribute('aria-current')) link.setAttribute('aria-current','location');
   } else link.removeAttribute('aria-current');
  }
 });
}
window.addEventListener('scroll', scheduleContentsUpdate, {passive:true});
window.addEventListener('resize', scheduleContentsUpdate);
function scrollToSection(id){
 document.getElementById(id)?.scrollIntoView({behavior:motionReduced()?'instant':'smooth'});
}
// React Native Web handles its press in the bubble phase. Observe the real link first.
document.addEventListener('click',event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 if(drawerQuery.matches){
  const railLink=event.target.closest('[data-rail]');
  if(railLink&&railLink.dataset.rail!=='home'){
   drawerTrigger=railLink;
   if(railLink.dataset.rail===document.body.dataset.area){
    event.preventDefault();
    setSidebar(!document.body.classList.contains('sidebar-open'));
   }else openDrawerAfterRoute=true;
   return;
  }
 }
 if(document.body.classList.contains('sidebar-open')){
  const link=event.target.closest('#sidebar a[href]');
  if(link?.hash===location.hash){
   setSidebar(false,false);
   main.focus({preventScroll:true});
  }else if(drawerQuery.matches&&!event.target.closest('#sidebar'))setSidebar(false,false);
 }
},true);
document.addEventListener('click',async event=>{
 if(event.target.closest('.skip-link')){event.preventDefault();main.focus();main.scrollIntoView({behavior:'instant'});return;}
 const group = event.target.closest('button[data-tree-group]');
 if (group) {
  setGroupExpanded(group, group.getAttribute('aria-expanded') !== 'true');
  return;
 }
 const scrollLink=event.target.closest('a[data-scroll-to]');
 if(scrollLink&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();scrollToSection(scrollLink.dataset.scrollTo);return;}
 const control=event.target.closest('[data-action]');
 if(control&&!control.closest('[data-mobile-design-host]'))await activateControl(control);
});
function handleSearchShortcut(event){
 if(event.defaultPrevented||!(event.metaKey||event.ctrlKey)||event.key.toLowerCase()!=='k')return;
 event.preventDefault();
 if(searchDialog.open)searchDialog.close();else openSearch();
}
document.addEventListener('keydown',handleSearchShortcut,true);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.body.classList.contains('sidebar-open'))setSidebar(false);
 if(event.key==='Tab'&&mobileQuery.matches&&document.body.classList.contains('sidebar-open')){const nodes=[...document.querySelector('#sidebar').querySelectorAll('button:not([hidden]),a[href]')].filter(el=>el.getBoundingClientRect().height>0&&!el.closest('[hidden],[inert]'));const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
for(const dialog of [searchDialog])dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.type!=='mobile-design:height')return;
 const frame=[...document.querySelectorAll('[data-component-runtime]')].find(frame=>frame.contentWindow===event.source);
 const height=event.data.height,limit=['text','button-groups'].includes(frame?.dataset.componentRuntime)?30000:10000;
 if(!frame||typeof height!=='number'||!Number.isFinite(height)||height<1||height>limit)return;
 frame.style.height=Math.ceil(height)+'px';frame.setAttribute('aria-busy','false');frame.previousElementSibling.hidden=true;
});
document.addEventListener('load',event=>{if(event.target.matches?.('[data-component-runtime], [data-catalog-popup-preview]'))updateTheme();},true);
window.addEventListener('hashchange',route);
railHost.dataset.items=JSON.stringify(areas);
railHost.dataset.logo=document.querySelector('.sidebar-brand img').getAttribute('src');
document.querySelector('.site-footer').innerHTML=footerMarkup();
try{data=JSON.parse(document.querySelector('#documentation-data').textContent);route();}catch(error){main.innerHTML=`<div class="empty-state"><h1>Un momento…</h1><p>No pudimos cargar la documentación. Recarga la página o sincroniza de nuevo el sitio.</p><button class="md-button" onclick="location.reload()">Reintentar</button></div>`;console.error(error);}

loadPageButtons();
