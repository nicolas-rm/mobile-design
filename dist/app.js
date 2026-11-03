import {illustrationMarkup} from './illustrations.js?v=2f4d505ab019';
import {componentDocs} from './component-docs.js?v=51534a7f2601';
import {areas,guides,guideNavigation,styleTopics,guideMarkup,homeMarkup,footerMarkup} from './site-sections.js?v=b2fc80314fe6';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon=name=>`<span class="symbol" aria-hidden="true">${name}</span>`;
const link=(href,label,symbol='arrow_forward',classes='text-link')=>`<a class="${classes}" href="${href}">${label}${icon(symbol)}</a>`;
const main=document.querySelector('main');
const searchDialog=document.querySelector('#search-dialog');
const searchInput=document.querySelector('#global-search');
let data,currentComponent,currentSection='overview',filter='all',catalogQuery='',toastTimer;
const collapsed=new Set();
const mobileQuery=matchMedia('(max-width:900px)');
function setSidebar(open,restoreFocus=true){
 document.body.classList.toggle('sidebar-open',open);
 const sidebar=document.querySelector('#sidebar');
 sidebar.inert=mobileQuery.matches&&!open;
 document.querySelector('.workspace').inert=open&&mobileQuery.matches;
 document.querySelector('.rail').inert=open&&mobileQuery.matches;
 document.querySelector('.mobile-header').inert=open&&mobileQuery.matches;
 document.querySelector('[data-action="sidebar"]').setAttribute('aria-expanded',String(open));
 if(open){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.querySelector('.sidebar-close').focus();}
 else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(restoreFocus&&mobileQuery.matches)document.querySelector('[data-action="sidebar"]').focus();}
}
mobileQuery.addEventListener('change',()=>setSidebar(false,false));
const categories={all:'Todos',actions:'Acciones',communication:'Comunicación',containment:'Contenedores',navigation:'Navegación',selection:'Selección',input:'Entrada'};
const sections=[['overview','info','Descripción'],['specs','tune','Especificaciones'],['api','code','API'],['accessibility','accessibility','Accesibilidad']];
const currentTheme=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
const normal=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const hashFor=(id,section='overview')=>`#/components/${id}/${section}`;

function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
function highlight(source){const pattern=/\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:import|from|export|default|function|return|const|let|if|true|false|new|type)\b/g;let result='',last=0;for(const match of source.matchAll(pattern)){result+=esc(source.slice(last,match.index));const token=match[0];result+=`<span class="${token.startsWith('//')?'syntax-comment':token.startsWith("'")||token.startsWith('"')?'syntax-string':'syntax-key'}">${esc(token)}</span>`;last=match.index+token.length;}return result+esc(source.slice(last));}
function codeCard(source,label='Example.tsx',download){return `<div class="code-card"><div class="code-header"><span>${icon('code')}${esc(label)}</span><div class="code-actions">${download?`<a href="${download}" download aria-label="Descargar ejemplo ${esc(label)}">${icon('download')}Descargar</a>`:''}<button type="button" data-action="copy" aria-label="Copiar código">${icon('content_copy')}Copiar</button></div></div><pre tabindex="0"><code>${highlight(source)}</code></pre></div>`;}
const callout=(title,message,symbol='info')=>`<div class="callout">${icon(symbol)}<div><strong>${title}</strong><p>${message}</p></div></div>`;
const table=(rows)=>`<div class="table-scroll"><table class="spec-table"><thead><tr><th>Referencia</th><th>Implementación local</th></tr></thead><tbody>${rows.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div>`;
function renderSidebar(){
 const path=currentPath();
 const area=currentArea(path);
 const navigation=document.querySelector('#component-navigation');
 document.querySelector('.sidebar-caption').textContent=areas.find(entry=>entry[0]===area)?.[2]??'DOCUMENTACIÓN';
 let globalLinks=`<div class="mobile-area-links">${areas.map(([id,symbol,label])=>`<a class="tree-link ${id===area?'active':''}" href="#/${id}">${icon(symbol)}${label}</a>`).join('')}</div>`;
 if(area!=='components'){
  navigation.innerHTML=globalLinks+(guideNavigation[area]??guideNavigation.resources).map(([route,title])=>`<a class="tree-link ${path===route?'active':''}" href="#/${route}" ${path===route?'aria-current="page"':''}>${esc(title)}</a>`).join('');
  return;
 }
 const c=currentComponent;let html=globalLinks+`<a class="tree-link tree-root ${!c?'active':''}" href="#/components">Todos los componentes</a>`;
 let group;
 for(const entry of data.components){
  if(entry.group!==group){if(group)html+='</div>';group=entry.group;if(group){const title=data.groups.find(g=>g.id===group).title;const expanded=!collapsed.has(group)||c?.group===group;html+=`<button type="button" class="tree-group" data-action="group" data-group="${group}" aria-expanded="${expanded}" aria-controls="tree-${group}">${esc(title)}${icon('expand_more')}</button><div class="tree-children" id="tree-${group}" ${expanded?'':'hidden'}>`;}}
  html+=`<a class="tree-link ${c?.id===entry.id?'active':''}" href="${hashFor(entry.id)}" ${c?.id===entry.id?'aria-current="page"':''}>${esc(entry.title)}</a>`;
 }
 if(group)html+='</div>';
 document.querySelector('#component-navigation').innerHTML=html;
}
function updateTheme(){
 const dark=currentTheme()==='dark';document.querySelectorAll('[data-action="theme"]').forEach(b=>{b.setAttribute('aria-label',dark?'Activar tema claro':'Activar tema oscuro');b.querySelector('.symbol').textContent=dark?'light_mode':'dark_mode';});
 const reduced=document.documentElement.dataset.reduced==='true';document.querySelectorAll('[data-action="motion"]').forEach(b=>{b.setAttribute('aria-pressed',String(reduced));b.setAttribute('aria-label',reduced?'Activar animaciones':'Reducir animaciones');b.querySelector('.symbol').textContent=reduced?'play_arrow':'pause';});
 document.querySelector('meta[name="theme-color"]').content=dark?'#141218':'#fef7ff';
 document.querySelectorAll('[data-native-image]').forEach(img=>{img.src='./native/'+img.dataset.nativeImage+(dark?'-dark':'')+'.png';});
 document.querySelectorAll('[data-native-link]').forEach(a=>{a.href='./native/'+a.dataset.nativeLink+(dark?'-dark':'')+'.png';});
}
function showCatalog(){
 currentComponent=undefined;
 main.innerHTML=`<div class="page-heading"><div class="eyebrow">${icon('widgets')}MATERIAL 3, EN REACT NATIVE</div><h1>Componentes</h1><p class="intro">Pequeñas piezas. Grandes posibilidades.<br>Explora los componentes de Mobile Design y construye interfaces con una misma forma de sentirse.</p></div>
 <section class="showcase" aria-label="Explora Mobile Design"><div class="showcase-copy"><p class="eyebrow">EXPRESIÓN EN CADA DETALLE</p><h2 class="text-balance">Diseña para<br>sentirse bien.</h2>${link('#/start','Empieza con Mobile Design')}</div><div class="showcase-art" aria-hidden="true" inert><div class="art-orbit" aria-hidden="true"></div><div class="art-flower" aria-hidden="true">${icon('star')}</div><div class="art-play"><div class="art-play-title"><span>${icon('music_note')}</span><span>Un poco de buen ritmo</span></div><div class="art-play-controls">${`<span class="icon-button">${icon('skip_previous')}</span>`}<span class="md-button">${icon('play_arrow')}Reproducir</span><span class="icon-button">${icon('skip_next')}</span></div></div><div class="art-slider"><p><span>A tu ritmo</span><span>♪</span></p><span class="static-slider"></span></div><div class="art-dot" aria-hidden="true"></div></div></section>
 <section id="explore"><div class="section-top"><h2>Encuentra tu siguiente pieza</h2><label class="page-filter-search">${icon('search')}<input type="search" id="catalog-filter" value="${esc(catalogQuery)}" placeholder="Filtrar componentes" aria-label="Filtrar componentes"></label></div><div class="filter-bar" aria-label="Categorías">${Object.entries(categories).map(([key,label])=>`<button type="button" class="filter-chip ${filter===key?'active':''}" data-action="filter" data-filter="${key}" aria-pressed="${filter===key}">${filter===key?icon('check'):''}${label}</button>`).join('')}</div><p class="component-count" id="component-count"></p><div class="catalog-grid" id="catalog-grid"></div></section>`;
 updateCatalog();
}
function updateCatalog(){
 const query=normal(catalogQuery);
 const entries=data.components.filter(c=>(filter==='all'||c.category===filter)&&normal([c.title,...c.searchAliases,...c.variants,...c.exports].join(' ')).includes(query));
 document.querySelector('#component-count').textContent=`${entries.length} ${entries.length===1?'componente':'componentes'} · en el orden de Material 3`;
 document.querySelector('#catalog-grid').innerHTML=entries.length?entries.map(c=>`<a class="component-card" href="${hashFor(c.id)}" aria-label="Ver ${esc(c.title)}"><div class="card-preview" aria-hidden="true" inert>${illustrationMarkup(c.id)}</div><div class="card-content"><h3>${esc(c.title)}</h3><p>${esc(c.tagline)}</p>${icon('arrow_outward')}</div></a>`).join(''):`<div class="empty-state">${icon('search')}<h3>No encontramos esa pieza</h3><p>Prueba con otro nombre o selecciona «Todos».</p><button class="md-button tonal" data-action="reset-filter">Limpiar filtros</button></div>`;
}
function renderComponent(c,section){
 const active=sections.some(s=>s[0]===section)?section:'overview';currentComponent=c;currentSection=active;
 const toc={overview:[['in-action','Vista nativa'],['when','Cuándo usarlo'],['implementation','Integración'],['variants','Variantes'],['example','Implementación']],specs:[['anatomy','Anatomía'],['dimensions','Dimensiones'],['defaults','Valores iniciales'],['tokens','Tema y estados']],api:[['import','Importación'],['properties','Propiedades'],['contracts','Tipos relacionados'],['example','Ejemplos']],accessibility:[['semantics','Semántica'],['focus','Foco y movimiento'],['coverage','Evidencia']]};
 const i=data.components.indexOf(c),prev=data.components[i-1],next=data.components[i+1];
 main.innerHTML=`<div class="detail-heading page-heading"><div class="eyebrow">${icon(c.icon)}${esc(categories[c.category])} <span style="opacity:.45">/</span> ${esc(c.searchAliases[0]??c.title)}</div><h1>${esc(c.title)}</h1><p class="intro">${esc(c.description)}</p></div><div class="detail-layout"><div><nav class="component-tabs" aria-label="Secciones de ${esc(c.title)}">${sections.map(([id,symbol,label])=>`<a href="${hashFor(c.id,id)}" class="${id===active?'active':''}" ${id===active?'aria-current="page"':''}>${icon(symbol)}${label}</a>`).join('')}</nav>${componentDocs[active](c,{data,codeCard})}<nav class="next-prev" aria-label="Componentes anterior y siguiente">${prev?`<a href="${hashFor(prev.id)}">${icon('arrow_back')}<span><small>ANTERIOR</small>${esc(prev.title)}</span></a>`:'<span></span>'}${next?`<a href="${hashFor(next.id)}"><span><small>SIGUIENTE</small>${esc(next.title)}</span>${icon('arrow_forward')}</a>`:'<span></span>'}</nav></div><aside class="toc" aria-label="En esta página"><p>En esta página</p>${toc[active].map(([id,label])=>`<a href="#${id}" data-scroll-to="${id}">${label}</a>`).join('')}</aside></div>`;
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
function installationPage(){currentComponent=undefined;main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('code')}DESARROLLO</div><h1>Instalación<br>y proveedor</h1><p class="intro">Una base compartida de componentes, colores y movimiento para construir tu app con React Native.</p></div><div class="guide-grid"><article class="guide-card">${icon('widgets')}<h3>36 familias, un sistema</h3><p>Componentes con variantes, estados y acciones coordinadas con el tema de la app.</p>${link('#/components','Explorar componentes')}</article><article class="guide-card">${icon('palette')}<h3>Una identidad compartida</h3><p>Roboto, Material Symbols y roles semánticos de color desde un único proveedor.</p>${link('#/styles','Conocer los estilos')}</article></div><section class="doc-section"><span class="step-number">1</span><h2>Conecta el paquete local</h2><p>Mobile Design <code>${data.version}</code> es un paquete privado del workspace. La documentación corresponde a esa implementación; todavía no hay una distribución pública en npm.</p>${codeCard(`// package.json de tu app dentro del workspace\n{\n  "dependencies": {\n    "mobile-design": "workspace:*"\n  }\n}`, 'package.json')}${codeCard('pnpm install','Terminal')}<p>La aplicación del workspace ya declara estas dependencias. Para otro consumidor, instala versiones compatibles antes de enlazar el paquete.</p></section><section class="doc-section"><span class="step-number">2</span><h2>Prepara el proveedor</h2><p><code>MobileDesignProvider</code> comparte el tema, el contexto de Paper, los iconos y las fuentes incluidas. Las superficies con gestos necesitan el root de Gesture Handler.</p>${codeCard(providerExample,'App.tsx')}</section><section class="doc-section"><span class="step-number">3</span><h2>Elige tu primera pieza</h2><p>Usa el estado de tu pantalla para controlar selección, texto y apertura. Cada ficha reúne el uso, la integración, los estados, la accesibilidad y los ejemplos nativos que puedes copiar o descargar.</p><div class="reference-grid">${['buttons','text-fields','tabs','lists'].map(id=>{const c=data.components.find(c=>c.id===id);return `<a class="reference-card" href="${hashFor(id)}">${icon(c.icon)}${c.title}${icon('arrow_forward')}</a>`}).join('')}</div></section><section class="doc-section"><h2>Compatibilidad del paquete</h2><p>Requisitos declarados en <code>mobile-design/package.json</code>. La revisión nativa se ejecutó en la combinación registrada en Verificación.</p>${table(Object.entries(data.peers))}</section></div>`;}
function hex(color){const match=color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return match?'#'+match.slice(1,4).map(v=>Number(v).toString(16).padStart(2,'0')).join('').toUpperCase():color;}
function renderStyleReference(){currentComponent=undefined;const colors=data.colors[currentTheme()];const palette=[['primary','onPrimary','Primary'],['primaryContainer','onPrimaryContainer','Primary container'],['secondary','onSecondary','Secondary'],['secondaryContainer','onSecondaryContainer','Secondary container'],['tertiary','onTertiary','Tertiary'],['tertiaryContainer','onTertiaryContainer','Tertiary container'],['surface','onSurface','Surface'],['surfaceContainer','onSurface','Surface container'],['error','onError','Error']];main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('palette')}FUNDAMENTOS DE ESTILO</div><h1>Una misma<br>personalidad.</h1><p class="intro">Color, tipografía, formas y movimiento. Las decisiones compartidas que conectan cada componente.</p></div><section class="doc-section" id="color"><div class="section-top"><h2>Color con significado</h2><button class="md-button tonal" data-action="theme">${icon(currentTheme()==='dark'?'light_mode':'dark_mode')}Cambiar tema</button></div><p>La paleta predeterminada es <strong>MD3 Baseline</strong>. Estos valores se sincronizan desde la salida canónica del paquete; toca un color para copiarlo.</p><div class="palette-grid">${palette.map(([role,onRole,label])=>`<button class="swatch" data-action="copy-color" data-color="${esc(hex(colors[role]))}" aria-label="Copiar ${label}, ${hex(colors[role])}" style="background:${colors[role]};color:${colors[onRole]}"><strong>${label}</strong><code>${hex(colors[role])}</code>${icon('content_copy')}</button>`).join('')}</div>${codeCard(`import { createMobileDesignTheme, MobileDesignProvider } from 'mobile-design';\n\nconst theme = createMobileDesignTheme({\n  colorScheme: '${currentTheme()}',\n  motion: 'expressive',\n});\n\n// El proveedor también admite colorScheme y motion directamente.\n<MobileDesignProvider theme={theme}>\n  {/* Tu aplicación */}\n</MobileDesignProvider>`,'theme.tsx')}<p>En el workspace, <code>pnpm theme:generate md3-baseline</code> genera los roles compartidos de la app. Una semilla HEX puede generar otra paleta sin cambiar las APIs de los componentes.</p></section><section class="doc-section" id="typography"><h2>Roboto, de principio a fin</h2><p>La escala Material organiza los textos por su función. Las fuentes están incluidas en Mobile Design y se cargan desde el proveedor.</p>${[['Display','displayLarge','57 / 64',57],['Headline','headlineMedium','28 / 36',28],['Title','titleLarge','22 / 28',22],['Body','bodyLarge','16 / 24',16],['Label','labelLarge','14 / 20',14]].map(([label,token,metric,size])=>`<div class="type-sample"><span style="font-size:${size}px;line-height:1.2">${label} · Haz espacio para lo importante.</span><small>${token} · ${metric}</small></div>`).join('')}${codeCard(`import { Text } from 'mobile-design';\n\n<Text variant="headlineMedium">Tu biblioteca</Text>\n<Text variant="bodyLarge">Todo lo que quieres volver a escuchar.</Text>`,'Typography.tsx')}</section><section class="doc-section" id="icons"><h2>Material Symbols Rounded</h2><p>Los iconos comparten el lenguaje visual del sistema. Los controles sin texto necesitan un nombre accesible.</p><div class="preview-row" style="justify-content:flex-start;gap:20px;padding:20px 0">${['search','arrow_back','close','favorite','bookmark','music_note','more_vert'].map(name=>`<span style="background:var(--surface-container);border-radius:16px;padding:16px">${icon(name)}</span>`).join('')}</div>${codeCard(`import { IconButton, MaterialSymbol } from 'mobile-design';\n\n<MaterialSymbol name="search" size={24} />\n<IconButton icon="magnify" accessibilityLabel="Buscar música"\n  onPress={() => console.log('Buscar')} />`,'Icons.tsx')}</section><section class="doc-section" id="shape"><h2>Formas con intención</h2><p>Las esquinas siguen los tokens del tema y la función del componente. La forma puede responder a presión y selección.</p><div class="shape-row">${[[4,'Extra small'],[8,'Small'],[12,'Medium'],[16,'Large'],[28,'Extra large']].map(([radius,label])=>`<div class="shape-tile" style="border-radius:${radius}px">${label}</div>`).join('')}</div><p class="responsive-note">Muestra visual de radios. Las medidas específicas de cada componente se documentan en su ficha.</p></section><section class="doc-section" id="motion"><h2>Movimiento que acompaña</h2><p>El proveedor permite elegir movimiento estándar o expresivo. La preferencia de movimiento reducido se obtiene del sistema; no necesita una propiedad adicional del proveedor.</p>${codeCard(`<MobileDesignProvider motion="expressive">\n  {/* Tu aplicación */}\n</MobileDesignProvider>`,'Motion.tsx')}<button class="md-button tonal" data-action="motion">${icon('pause')}Alternar movimiento de la documentación</button></section></div>`;}
function verificationPage(){
 currentComponent=undefined;const v=data.verification;
 main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('verified')}REVISIÓN DEL 2 DE NOVIEMBRE DE 2026</div><h1>Detalles<br>que se revisan.</h1><p class="intro">El estado de verificación de Mobile Design, con evidencia concreta y un alcance explícito.</p></div><div class="stats-grid"><div class="verification-stat"><b>${v.families}</b><span>familias revisadas</span></div><div class="verification-stat"><b>${v.automatic}/37</b><span>bloques automáticos aprobados</span></div><div class="verification-stat"><b>${v.nativeCases}</b><span>casos de interacción aprobados</span></div></div><section class="doc-section"><h2>Qué cubre la revisión</h2><ul class="check-list"><li>${icon('check_circle')}36 galerías con capturas claras/oscuras y movimiento reducido.</li><li>${icon('check_circle')}12 acciones adicionales: presión, cancelación, selección, teclado, navegación, gestos y cargas.</li><li>${icon('check_circle')}${v.voiceOver} recorridos con lector de pantalla y ${v.largeText} casos con texto ampliado.</li><li>${icon('check_circle')}TypeScript y contratos automáticos; 33 casos de selección y ciclo de vida.</li><li>${icon('check_circle')}Selección de hora, texto ampliado y ambos temas.</li></ul></section><section class="doc-section"><h2>Cómo leer estos resultados</h2><p>Los resultados corresponden a los casos registrados en la revisión. Las capturas de cada galería están disponibles en su ficha, en la sección Descripción.</p>${callout('Una captura acredita un estado concreto','No significa que se hayan probado todas las variantes ni todas sus combinaciones. Las verificaciones del sitio y los contratos de código tienen un alcance distinto al comportamiento del componente en una aplicación.')}</section><section class="doc-section"><h2>Correcciones realizadas</h2>${table([['Chip','Identidades distintas para las regiones primaria y de cierre.'],['TimePicker','Alineación tipográfica y de acciones con texto ampliado.'],['Ejemplo de Progress','Concepto e importe agrupados para lectura accesible.'],['Galerías','Distribución del contenido al abrir el teclado.']])}</section><section class="doc-section"><h2>Alcance de la revisión</h2><p>Se revisaron recorridos representativos, estados de interacción y configuraciones de accesibilidad. Las adaptaciones de movimiento, física y geometría deben evaluarse también dentro de la pantalla que utiliza el componente.</p><p>El estado del soporte en navegador se documenta por separado.</p>${link('#/support','Consultar soporte')}</section></div>`;
}
function supportPage(){currentComponent=undefined;main.innerHTML=`<div class="guide-layout"><div class="page-heading"><div class="eyebrow">${icon('smartphone')}PLATAFORMAS Y SOPORTE</div><h1>El alcance,<br>bien definido.</h1><p class="intro">Mobile Design es un paquete de componentes React Native que utiliza módulos Expo. Esta página web concentra su documentación.</p></div><section class="doc-section"><h2>Entornos del paquete</h2>${table([['React Native con Expo','Entorno principal del paquete documentado.'],['React Native con módulos Expo integrados','Necesita las dependencias nativas declaradas y su configuración; no es una distribución independiente de Expo Font/Image.'],['Expo Web / React Native Web','Pendiente de verificación integral. Las adaptaciones existentes se conservan.'],['React DOM sin React Native Web','No hay una distribución DOM independiente verificada.']])}</section><section class="doc-section"><h2>Soporte web pendiente</h2><p>Hay ramas específicas para navegador en el código de varios componentes. Se conservan para una futura revisión. Su existencia no acredita que las 36 familias estén listas o se comporten igual en navegador.</p><ul class="check-list"><li>${icon('info')}Pendiente: compilación real del paquete con React Native Web y sus dependencias.</li><li>${icon('info')}Pendiente: gestos, teclado, foco, animaciones, overlays y lectores de pantalla en navegador.</li><li>${icon('info')}Pendiente: matriz de variantes y plataformas web probadas.</li></ul></section><section class="doc-section"><h2>Qué muestra esta documentación</h2><p>Las fichas contienen API extraída del paquete, instrucciones de integración, funcionamiento, accesibilidad, ejemplos TSX y capturas nativas. Las ilustraciones del catálogo son decorativas.</p><p>El sitio no monta el renderer React Native ni sustituye una prueba del componente en la app. Las capturas son estados observados; el código descargable utiliza los componentes originales.</p></section><section class="doc-section"><h2>Repositorio de documentación</h2><p><a class="text-link" href="https://github.com/nicolas-rm/mobile-design" target="_blank" rel="noopener noreferrer">nicolas-rm/mobile-design ${icon('open_in_new')}</a> contiene este proyecto de documentación. No publica el paquete nativo en npm ni incluye la app Music Design.</p></section></div>`;}

const currentPath=()=>location.hash.startsWith('#/')?location.hash.slice(2).split('?')[0].replace(/\/$/,''):'home';
const currentArea=path=>path==='support'?'develop':path==='verification'?'resources':path.split('/')[0];
function stylePage(topic){
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
 currentComponent=undefined;
 let title;
 if(path==='home'||path===''){main.innerHTML=homeMarkup(data);title='Inicio';}
 else if(component){renderComponent(component,section);title=component.title;}
 else if(path==='components'){showCatalog();title='Componentes';}
 else if(path==='develop/installation'){installationPage();title='Instalación y proveedor';}
 else if(page==='styles'&&styleTopics[id]){stylePage(id);title=styleTopics[id][0];}
 else if(path==='verification'){verificationPage();title='Verificación';}
 else if(path==='support'){supportPage();title='Plataformas y soporte';}
 else if(guides[path]){main.innerHTML=guideMarkup(guides[path]);title=guides[path].title;}
 else{title='Página no encontrada';main.innerHTML=`<div class="page-heading"><h1>Página no encontrada</h1><p class="intro">La dirección no corresponde a una sección de la documentación.</p>${link('#/home','Volver al inicio')}</div>`;}
 document.body.dataset.area=area;
 document.body.dataset.route=path;
 document.body.dataset.shell=page==='home'||!path?'home':'documentation';
 document.querySelectorAll('[data-rail]').forEach(a=>{const active=a.dataset.rail===area;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const areaTitle=areas.find(entry=>entry[0]===area)?.[2]??'Documentación';
 document.querySelector('#breadcrumbs').innerHTML=`<a href="#/home">Mobile Design</a>${path!=='home'?`<span>/</span>${title!==areaTitle?`<a href="#/${area}">${areaTitle}</a><span>/</span>`:''}${esc(title)}`:''}`;
 document.title=title+' · Mobile Design';
 setSidebar(false,false);
 renderSidebar();enhanceArticle();updateTheme();window.scrollTo({top:0,behavior:'instant'});
 const target=new URLSearchParams(location.hash.split('?')[1]).get('section');if(target)requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({behavior:'instant'}));
}
function renderSearch(){
 const query=normal(searchInput.value);
 const guideResults=[...Object.entries(guides).map(([path,entry])=>({href:'#/'+path,title:entry.title,detail:entry.intro,symbol:'description'})),...Object.entries(styleTopics).map(([id,[title,intro]])=>({href:'#/styles/'+id,title,detail:intro,symbol:'palette'})),{href:'#/develop/installation',title:'Instalación y proveedor',detail:'Dependencias y MobileDesignProvider',symbol:'code'},{href:'#/verification',title:'Verificación',detail:'Pruebas, evidencia nativa y alcance',symbol:'verified'},{href:'#/support',title:'Plataformas y soporte',detail:'React Native, Expo y soporte web pendiente',symbol:'smartphone'}].filter(entry=>normal(entry.title+' '+entry.detail).includes(query));
 const components=data.components.filter(c=>normal([c.title,...c.searchAliases,...c.variants,...c.configurations??[],...c.exports,...c.api.map(p=>p.name)].join(' ')).includes(query)).map(c=>({href:hashFor(c.id),title:c.title,detail:(c.searchAliases[0]??categories[c.category])+' · '+c.exports[0],symbol:c.icon}));
 const results=(query?[...guideResults,...components]:[...components.slice(0,6),...guideResults.slice(0,6)]).slice(0,16);
 document.querySelector('#search-results').innerHTML=results.length?results.map(c=>`<a class="search-result" href="${c.href}" data-action="search-result">${icon(c.symbol)}<span><strong>${esc(c.title)}</strong><small>${esc(c.detail)}</small></span>${icon('arrow_forward')}</a>`).join(''):`<div class="search-empty">${icon('search')}<p>No encontramos resultados para «${esc(searchInput.value)}».</p><small>Prueba con un componente, guía o propiedad.</small></div>`;
}
function openSearch(){if(!data)return;searchInput.value='';renderSearch();searchDialog.showModal();searchInput.focus();}
async function copyText(value){try{await navigator.clipboard.writeText(value);toast('Copiado al portapapeles');return true;}catch{toast('No se pudo copiar. Puedes seleccionar el texto del ejemplo.');return false;}}
document.addEventListener('click',async event=>{
 if(event.target.closest('.skip-link')){event.preventDefault();main.focus();main.scrollIntoView({behavior:'instant'});return;}
 const scrollLink=event.target.closest('[data-scroll-to]');if(scrollLink){event.preventDefault();document.getElementById(scrollLink.dataset.scrollTo)?.scrollIntoView({behavior:document.documentElement.dataset.reduced==='true'?'instant':'smooth'});return;}
 const control=event.target.closest('[data-action]');
 if(control){switch(control.dataset.action){
  case'search':openSearch();break;
  case'close-search':searchDialog.close();break;
  case'search-result':searchDialog.close();break;
  case'sidebar':setSidebar(!document.body.classList.contains('sidebar-open'));break;
  case'close-sidebar':setSidebar(false);break;
  case'copy-link':{const url=new URL(location.href);url.hash='#/'+currentPath()+'?section='+control.dataset.anchor;await copyText(url.href);break;}
  case'theme':document.documentElement.dataset.theme=currentTheme()==='dark'?'light':'dark';try{localStorage.setItem('md-docs-theme',currentTheme())}catch{}if(currentPath().startsWith('styles/')){const scroll=window.scrollY,restoreThemeFocus=main.contains(control);route();if(restoreThemeFocus)main.querySelector('[data-action="theme"]')?.focus({preventScroll:true});window.scrollTo({top:scroll,behavior:'instant'});}updateTheme();break;
  case'motion':document.documentElement.dataset.reduced=String(document.documentElement.dataset.reduced!=='true');try{localStorage.setItem('md-docs-reduced',document.documentElement.dataset.reduced)}catch{}updateTheme();break;
  case'group':{const group=control.dataset.group;const expanded=control.getAttribute('aria-expanded')==='true';if(expanded)collapsed.add(group);else collapsed.delete(group);control.setAttribute('aria-expanded',String(!expanded));document.querySelector('#tree-'+group).hidden=expanded;break;}
  case'filter':filter=control.dataset.filter;document.querySelectorAll('[data-action="filter"]').forEach(button=>{const selected=button===control;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));button.querySelector('.symbol')?.remove();if(selected)button.insertAdjacentHTML('afterbegin',icon('check'));});updateCatalog();break;
  case'reset-filter':filter='all';catalogQuery='';showCatalog();break;
  case'copy':await copyText(control.closest('.code-card').querySelector('code').textContent);break;
  case'copy-color':await copyText(control.dataset.color);break;

 }}
});
document.addEventListener('input',event=>{if(event.target.id==='global-search')renderSearch();else if(event.target.id==='catalog-filter'){catalogQuery=event.target.value;updateCatalog();}else if(event.target.id==='api-filter'){const query=normal(event.target.value);let count=0;main.querySelectorAll('#properties [data-prop]').forEach(row=>{row.hidden=!normal(row.dataset.prop).includes(query);if(!row.hidden)count++;});document.querySelector('#api-count').textContent=`${count} propiedades`; }});
document.addEventListener('keydown',event=>{
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(searchDialog.open)searchDialog.close();else openSearch();}
 if(event.key==='Escape'&&document.body.classList.contains('sidebar-open'))setSidebar(false);
 if(event.key==='Tab'&&document.body.classList.contains('sidebar-open')){const nodes=[...document.querySelector('#sidebar').querySelectorAll('button:not([hidden]),a[href]')].filter(el=>el.getBoundingClientRect().height>0&&!el.closest('[hidden]'));const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 if(event.key==='Enter'&&searchDialog.open&&document.activeElement===searchInput){const first=searchDialog.querySelector('.search-result');if(first){event.preventDefault();first.click();}}
 if(searchDialog.open&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();const links=[...searchDialog.querySelectorAll('.search-result')];if(!links.length)return;const i=links.indexOf(document.activeElement);links[(i+(event.key==='ArrowDown'?1:-1)+links.length)%links.length].focus();}
});
for(const dialog of [searchDialog])dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
window.addEventListener('hashchange',route);
document.querySelector('#primary-navigation').innerHTML=areas.map(([id,symbol,label])=>`<a href="#/${id}" data-rail="${id}"><span class="rail-icon">${icon(symbol)}</span><span>${label}</span></a>`).join('');
document.querySelector('.site-footer').innerHTML=footerMarkup();
try{data=JSON.parse(document.querySelector('#documentation-data').textContent);route();}catch(error){main.innerHTML=`<div class="empty-state"><h1>Un momento…</h1><p>No pudimos cargar la documentación. Recarga la página o sincroniza de nuevo el sitio.</p><button class="md-button" onclick="location.reload()">Reintentar</button></div>`;console.error(error);}
