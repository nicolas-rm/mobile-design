import {useCallback,useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {Button,FAB,Icon,MobileDesignProvider,ContainerTransformSurface,useMobileTheme,type ContainerTransformOrigin,type FABSize,type FABVariant} from 'mobile-design';
import {cancelAnimation,useSharedValue,withTiming,Easing,ReduceMotion} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {RuntimeBridge,useRuntimeEnvironment} from './environment';

const sizes:FABSize[]=['default','medium','large'];
const variants:FABVariant[]=['tonalPrimary','tonalSecondary','tonalTertiary','primary','secondary','tertiary'];
const variantNames=['Tonal primary','Tonal secondary','Tonal tertiary','Primary','Secondary','Tertiary'];
const scenarios={
 mail:{title:'Recibidos',label:'Redactar',icon:'pencil-outline',form:'Nuevo mensaje',field:'Asunto',submit:'Enviar',result:'Mensaje enviado.',rows:['Reunión de diseño','Tu próxima lectura','Una idea para el viernes','Materiales del proyecto','Nos vemos pronto','Novedades de la semana','Revisión de la propuesta','Notas del equipo','La próxima entrega','Un nuevo comienzo','Planes compartidos','Gracias por tu mensaje']},
 checkout:{title:'Tu carrito',label:'Comprar',icon:'cart-outline',form:'Finalizar compra',field:'Dirección de entrega',submit:'Confirmar compra',result:'Compra confirmada.',rows:['Lámpara de escritorio','Cuaderno de notas','Taza de cerámica','Bolsa de algodón','Libro de diseño','Planta de interior','Lápices de colores','Organizador','Vela aromática','Marco de madera','Libreta de viaje','Botella reutilizable']},
 article:{title:'Tu artículo',label:'Publicar',icon:'publish',form:'Publicar artículo',field:'Título',submit:'Publicar',result:'Artículo publicado.',rows:['Una idea que merece contarse','El comienzo de la historia','Un lugar para la inspiración','Observa los pequeños detalles','Encuentra tu propio ritmo','Dale espacio a las ideas','Las personas primero','Una perspectiva diferente','Aprender del proceso','Lo que viene después','Una pausa para pensar','El siguiente capítulo']},
 tasks:{title:'Mis tareas',label:'Nueva tarea',icon:'plus',form:'Crear tarea',field:'Nombre de la tarea',submit:'Crear',result:'Tarea creada.',rows:['Preparar la presentación','Revisar los bocetos','Organizar la biblioteca','Compartir la propuesta','Actualizar las notas','Planear la semana','Leer el nuevo capítulo','Elegir una portada','Reunir referencias','Confirmar la reunión','Revisar el calendario','Anotar nuevas ideas']},
 flights:{title:'Tu próximo viaje',label:'Buscar vuelos',icon:'airplane',form:'Buscar vuelos',field:'Destino',submit:'Buscar',result:'3 vuelos disponibles para tu destino.',rows:['Ciudad de México','Monterrey','Guadalajara','Mérida','Cancún','Oaxaca','Puerto Vallarta','La Paz','Querétaro','Tijuana','Hermosillo','León']},
};
type Scenario=keyof typeof scenarios;

export function FABUsage({direction,extended=true}:{extended?:boolean;direction:'ltr'|'rtl'}){
 const theme=useMobileTheme();
 const [scenario,setScenario]=useState<Scenario>('mail');const item=scenarios[scenario];
 const [alignment,setAlignment]=useState('end');const [rail,setRail]=useState(false);
 const [expanded,setExpanded]=useState(true);const [open,setOpen]=useState(false);const [isClosing,setIsClosing]=useState(false);const closing=useRef(false);const [wide,setWide]=useState(false);
 const [value,setValue]=useState('');const [result,setResult]=useState('');const [created,setCreated]=useState<string[]>([]);
 const scene=useRef<HTMLDivElement>(null),scroller=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null),field=useRef<HTMLInputElement>(null);
 const previousY=useRef(0);
 const progress=useSharedValue(0);const [origin,setOrigin]=useState<ContainerTransformOrigin>();const [ready,setReady]=useState(false);
 const finishClose=useCallback(()=>{setOpen(false);requestAnimationFrame(()=>{if(opener.current?.isConnected)opener.current.focus();});},[]);
 const transition=useCallback((to:number)=>{
  const curve=theme.motion.easing.emphasized,duration=(to?theme.motion.duration.long2:theme.motion.duration.medium4)*theme.animation.scale;
  progress.set(withTiming(to,{duration,easing:Easing.bezier(...curve),reduceMotion:ReduceMotion.Never},finished=>{if(finished&&to===0)scheduleOnRN(finishClose);}));
 },[theme,progress,finishClose]);
 const measured=useCallback((source:ContainerTransformOrigin)=>{if(source===origin)setReady(true);},[origin]);
 useEffect(()=>{if(open&&(ready||theme.animation.scale===0)&&!isClosing)transition(1);},[open,ready,isClosing,transition]);
 useEffect(()=>()=>cancelAnimation(progress),[progress]);
 useEffect(()=>{const observer=new ResizeObserver(entries=>{const fits=entries[0].contentRect.width>=600;setWide(fits);if(!fits)setRail(false);});observer.observe(scene.current!);return ()=>observer.disconnect();},[]);
 useEffect(()=>{if(theme.animation.scale===0){progress.set(open&&!closing.current?1:0);if(closing.current)finishClose();}},[open,progress,theme.animation.scale,finishClose]);
 useEffect(()=>{
  if(!open)return;const frame=requestAnimationFrame(()=>field.current?.focus());return ()=>cancelAnimationFrame(frame);
 },[open]);
 const show=(event:{currentTarget:unknown})=>{
  const trigger=event.currentTarget as HTMLElement,button=trigger.getBoundingClientRect();opener.current=trigger;
  setOrigin({x:button.left,y:button.top,width:button.width,height:button.height,borderRadius:parseFloat(getComputedStyle(trigger).borderRadius)||16,backgroundColor:theme.colors.primaryContainer});
  progress.set(0);setReady(false);closing.current=false;setIsClosing(false);setValue('');setOpen(true);
 };
 const close=()=>{
  if(closing.current)return;closing.current=true;setIsClosing(true);transition(0);
 };
 const choose=(next:Scenario)=>{setScenario(next);setCreated([]);setResult('');setExpanded(true);previousY.current=0;if(scroller.current)scroller.current.scrollTop=0;};
 return <section className="usage-section" aria-labelledby="fab-usage-title">
  <h2 id="fab-usage-title">Ejemplos en acción</h2><p>{extended?'Una acción principal persistente. Desplaza el contenido hacia abajo para contraerla y hacia arriba para recuperar la etiqueta.':'Una acción principal persistente que conserva su posición mientras se desplaza el contenido. Abre y completa la tarea.'}</p>
  <div className="playground-controls">
   <label>Ejemplo<select id="fab-scenario" disabled={open} value={scenario} onChange={e=>choose(e.target.value as Scenario)}>{Object.entries(scenarios).map(([key,s])=><option key={key} value={key}>{s.title}</option>)}</select></label>
   <label>Posición<select id="fab-alignment" disabled={open} value={alignment} onChange={e=>setAlignment(e.target.value)}><option value="end">Extremo final</option><option value="center">Centro inferior</option></select></label>
   <div className="state-options"><label><input id="fab-rail" disabled={open||!wide} type="checkbox" checked={rail} onChange={e=>setRail(e.target.checked)}/>Navegación expandida (ancho amplio)</label></div>
  </div>
  <div className={'fab-scene'+(rail?' with-rail':'')} ref={scene} dir={direction} data-open={open}>
   <div className="fab-scene-content" inert={open}>
    <header><h3>{item.title}</h3></header>
    {rail?<aside className="fab-example-rail" aria-label="Acción principal">{extended?<FAB.Extended icon={item.icon} label={item.label} elevation={0} onPress={show} testID="usage-rail-fab"/>:<FAB icon={item.icon} elevation={0} accessibilityLabel={item.label} onPress={show} testID="usage-rail-fab"/>}<span>Tu espacio</span></aside>:null}
    <div className="fab-scroll-content" id="fab-scroll-content" ref={scroller} tabIndex={0} aria-label={'Contenido de '+item.title} onScroll={e=>{const y=e.currentTarget.scrollTop,delta=y-previousY.current;if(Math.abs(delta)>3||y<=0){setExpanded(y<=0||delta<0);previousY.current=y;}}}>
     {[...created,...item.rows].map((row,index)=><div className="fab-example-row" key={row+index}><span className="example-row-icon"><Icon source={scenario==='mail'?'email-outline':scenario==='tasks'?'checkbox-blank-outline':scenario==='flights'?'map-marker-outline':scenario==='checkout'?'shopping-outline':'text-box-outline'} size={24}/></span><span><strong>{row}</strong><small>{scenario==='checkout'?'1 artículo':scenario==='article'?'Ideas, historias y una nueva perspectiva.':'Una nueva oportunidad para crear.'}</small></span></div>)}
    </div>
    {!rail?<div className={'fab-example-dock '+alignment}>{extended?<FAB.Extended icon={item.icon} label={item.label} expanded={expanded} onPress={show} testID="usage-fab"/>:<FAB icon={item.icon} size="medium" accessibilityLabel={item.label} onPress={show} testID="usage-fab"/>}</div>:null}
   </div>
   {open?<View style={{position:'absolute',inset:0,zIndex:3}}><ContainerTransformSurface origin={origin} transforming={theme.animation.scale!==0} entering={!isClosing} progress={progress} onMeasured={measured} borderRadius={0} backgroundColor={theme.colors.surfaceContainerHigh} fill testID="fab-transform-surface">
    <form style={{backgroundColor:'var(--raised)'}} className="fab-example-form" inert={isClosing} aria-label={item.form} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();}}} onSubmit={e=>{e.preventDefault();if(isClosing||!value.trim())return;if(scenario==='tasks'||scenario==='mail')setCreated(rows=>[value.trim(),...rows]);setResult(item.result);close();}}>
     <h3>{item.form}</h3><label>{item.field}<input ref={field} id="fab-usage-field" required value={value} onChange={e=>setValue(e.target.value)}/></label>
     {scenario==='mail'||scenario==='article'?<label>{scenario==='mail'?'Mensaje':'Contenido'}<textarea rows={4} aria-label={scenario==='mail'?'Mensaje':'Contenido'}/></label>:null}
     <div className="fab-form-actions"><Button variant="text" onPress={close} testID="fab-cancel">Cancelar</Button><Button onPress={()=>field.current?.form?.requestSubmit()} testID="fab-submit">{item.submit}</Button></div>
    </form>
   </ContainerTransformSurface></View>:null}
  </div>
  <p id="fab-usage-result" role="status" aria-live="polite">{result||'Abre la acción para completar el ejemplo.'}</p>
 </section>;
}

export function ExtendedFABRuntime(){
 const environment=useRuntimeEnvironment();
 const [size,setSize]=useState<FABSize>('default'),[variant,setVariant]=useState<FABVariant>('tonalPrimary');
 const [icon,setIcon]=useState(true),[expanded,setExpanded]=useState(true),[visible,setVisible]=useState(true),[label,setLabel]=useState('Redactar');
 const [direction,setDirection]=useState<'ltr'|'rtl'>('ltr'),[motion,setMotion]=useState<'standard'|'expressive'>('expressive'),[count,setCount]=useState(0);
 const code=`<FAB.Extended\n  size="${size}"\n  variant="${variant}"${icon?'\n  icon="pencil-outline"':''}\n  label=${JSON.stringify(label||'Redactar')}\n  expanded={${expanded}}\n  visible={${visible}}\n  onPress={handlePress}\n/>`;
 return <MobileDesignProvider colorScheme={environment.colorScheme} motion={motion} direction={direction} reduceMotion={environment.reduced?'on':'auto'}>
  <main aria-label="Ejemplo interactivo de Extended FABs">
   <div className="playground-controls" aria-label="Configurar Extended FAB">
    <label>Tamaño<select id="fab-size" value={size} onChange={e=>setSize(e.target.value as FABSize)}>{sizes.map((s,i)=><option value={s} key={s}>{['Small · 56','Medium · 80','Large · 96'][i]}</option>)}</select></label>
    <label>Color<select id="fab-variant" value={variant} onChange={e=>setVariant(e.target.value as FABVariant)}>{variants.map((v,i)=><option key={v} value={v}>{variantNames[i]}</option>)}</select></label>
    <label>Etiqueta<input id="fab-label" maxLength={48} value={label} onChange={e=>setLabel(e.target.value)}/></label>
    <label>Movimiento<select id="fab-motion" value={motion} onChange={e=>setMotion(e.target.value as typeof motion)}><option value="expressive">Expressive</option><option value="standard">Standard</option></select></label>
    <label>Dirección<select id="fab-direction" value={direction} onChange={e=>setDirection(e.target.value as typeof direction)}><option value="ltr">Izquierda a derecha</option><option value="rtl">Derecha a izquierda</option></select></label>
    <div className="state-options"><label><input type="checkbox" id="fab-icon" checked={icon} onChange={e=>setIcon(e.target.checked)}/>Icono</label><label><input type="checkbox" id="fab-expanded" checked={expanded} onChange={e=>setExpanded(e.target.checked)}/>Expanded</label><label><input type="checkbox" id="fab-visible" checked={visible} onChange={e=>setVisible(e.target.checked)}/>Visible</label></div>
   </div>
   <div className="button-stage fab-stage" dir={direction}><View><FAB.Extended size={size} variant={variant} icon={icon?'pencil-outline':undefined} label={label||'Redactar'} expanded={expanded} visible={visible} onPress={()=>setCount(v=>v+1)} testID="example-fab"/></View></div>
   <p className="preview-guidance">En espacios estrechos, desliza la muestra horizontalmente para explorar los tamaños grandes.</p>
   <div className="example-result" role="status" aria-live="polite"><span>{icon?'La etiqueta conserva su nombre accesible al contraerse.':'Sin icono, la etiqueta permanece visible.'}</span><span><span id="fab-activation-count">{count}</span> acciones</span></div>
   <section className="example-code" aria-label="Código de la configuración"><h2>Código de la configuración</h2><pre tabIndex={0}><code>{code}</code></pre></section>
   <FABUsage direction={direction}/>
  </main><RuntimeBridge/>
 </MobileDesignProvider>;
}
