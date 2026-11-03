import {useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import {FAB,Icon,MobileDesignProvider,Text,type FABMenuItemProps,type FABMenuProps,type FABSize,type FABVariant} from 'mobile-design';
import {RuntimeBridge,useRuntimeEnvironment} from './environment';
const previewInsets={top:0,right:0,bottom:0,left:0};

const createActions=[['note_add','Nota'],['checklist','Lista'],['draw','Dibujo'],['create_new_folder','Carpeta'],['description','Documento'],['notification_add','Recordatorio']];
const shareActions=[['link','Copiar enlace'],['title','Copiar título'],['description','Copiar descripción'],['person_add','Copiar invitación'],['person','Copiar autor'],['format_quote','Copiar referencia']];
const variants:FABVariant[]=['tonalPrimary','tonalSecondary','tonalTertiary','primary','secondary','tertiary'];
const variantsLabels=['Tonal primary','Tonal secondary','Tonal tertiary','Primary','Secondary','Tertiary'];
const extensionActions=[...createActions,['photo_camera','Foto'],['mic','Grabación'],['event','Evento'],['bookmark_add','Marcador'],['image','Imagen'],['music_note','Canción']];

export function FABMenuRuntime(){
 const environment=useRuntimeEnvironment();
 const [mode,setMode]=useState<'anchored'|'scroll'>('anchored'),[size,setSize]=useState<FABSize>('default'),[variant,setVariant]=useState<FABVariant>('tonalPrimary');
 const [count,setCount]=useState(4),[scenario,setScenario]=useState<'create'|'share'>('create'),[direction,setDirection]=useState<'ltr'|'rtl'>('ltr');
 const [motion,setMotion]=useState<'standard'|'expressive'>('expressive'),[short,setShort]=useState(false),[disabled,setDisabled]=useState(false),[expanded,setExpanded]=useState(false);
 const [result,setResult]=useState('Abre el menú y elige una acción.'),[actions,setActions]=useState(0),[dismissals,setDismissals]=useState(0),[records,setRecords]=useState<string[]>([]);
 const sequence=useRef(0),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
 // Copy commands preserve user activation; the menu closes while the command resolves.
 const activate=(label:string)=>{
  setActions(v=>v+1);
  if(scenario==='share'){
   const data:Record<string,string>={'Copiar enlace':'https://example.com/coleccion','Copiar título':'Mi colección','Copiar descripción':'Una colección para compartir ideas.','Copiar invitación':'Te invito a Mi colección: https://example.com/coleccion','Copiar autor':'Equipo Mobile Design','Copiar referencia':'Mi colección · Equipo Mobile Design · https://example.com/coleccion'};
   navigator.clipboard.writeText(data[label]).then(()=>{if(mounted.current)setResult(label==='Copiar enlace'?'Enlace copiado.':'Contenido copiado.');},()=>{if(mounted.current)setResult('No se pudo copiar. Intenta de nuevo desde el menú.');});
  }else{const title=label+' '+(++sequence.current);setRecords(rows=>[title,...rows]);setResult('Se creó: '+title+'.');}
 };
 const source=mode==='scroll'?extensionActions:(scenario==='create'?createActions:shareActions).slice(0,count);
 const items:FABMenuItemProps[]=source.map(([icon,label],index)=>({key:label,icon,label,disabled:disabled&&index===1,testID:'fab-menu-action-'+index,onPress:()=>activate(label)}));
 const common={expanded,onDismiss:()=>{setExpanded(false);setDismissals(v=>v+1);},trigger:{icon:scenario==='create'?'plus':'share',variant,size,accessibilityLabel:scenario==='create'?'Abrir menú de creación':'Abrir menú para compartir',onPress:()=>setExpanded(v=>!v),testID:'fab-menu-trigger'},testID:'example-fab-menu'};
 const anchoredItems:Extract<FABMenuProps,{overflow?:undefined}>['items']=count===2?[items[0],items[1]]:count===3?[items[0],items[1],items[2]]:count===4?[items[0],items[1],items[2],items[3]]:count===5?[items[0],items[1],items[2],items[3],items[4]]:[items[0],items[1],items[2],items[3],items[4],items[5]];
 const menu:FABMenuProps=mode==='scroll'?{...common,overflow:'scroll',maxHeight:short?140:264,items}:{...common,items:anchoredItems};
 const configure=<T,>(update:(value:T)=>void,value:T)=>{setExpanded(false);update(value);};
 const code=`<FAB.Menu\n  expanded={expanded}\n  onDismiss={() => setExpanded(false)}\n  trigger={{ icon: "${scenario==='create'?'plus':'share'}", size: "${size}",\n    variant: "${variant}", accessibilityLabel: "${scenario==='create'?'Abrir menú de creación':'Abrir menú para compartir'}",\n    onPress: () => setExpanded(value => !value) }}${mode==='scroll'?`\n  overflow="scroll"\n  maxHeight={${short?140:264}}`:''}\n  items={[\n${source.map(([icon,label],i)=>`    { key: "action-${i}", icon: "${icon}", label: "${label}",${disabled&&i===1?' disabled: true,':''} onPress: handle${i+1} },`).join('\n')}\n  ]}\n/>`;
 return <MobileDesignProvider colorScheme={environment.colorScheme} direction={direction} motion={motion} reduceMotion={environment.reduced?'on':'auto'}>
  <main aria-label="Ejemplo interactivo de FAB menu">
   <div className="playground-controls" aria-label="Configurar FAB menu">
    <label>Presentación<select id="fab-menu-mode" value={mode} onChange={e=>configure(setMode,e.target.value as typeof mode)}><option value="anchored">Menú anclado</option><option value="scroll">Pila desplazable · extensión</option></select></label>
    <label>Ejemplo<select id="fab-menu-scenario" value={scenario} onChange={e=>configure(setScenario,e.target.value as typeof scenario)}><option value="create">Crear</option><option value="share">Compartir</option></select></label>
    <label>Tamaño del FAB<select id="fab-menu-size" value={size} onChange={e=>configure(setSize,e.target.value as FABSize)}><option value="default">Small · 56</option><option value="medium">Medium · 80</option><option value="large">Large · 96</option></select></label>
    <label>Color del FAB<select id="fab-menu-variant" value={variant} onChange={e=>configure(setVariant,e.target.value as FABVariant)}>{variants.map((v,i)=><option key={v} value={v}>{variantsLabels[i]}</option>)}</select></label>
    <label>Número de acciones<select id="fab-menu-count" disabled={mode==='scroll'} value={count} onChange={e=>configure(setCount,Number(e.target.value))}>{[2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label>Dirección<select id="fab-menu-direction" value={direction} onChange={e=>configure(setDirection,e.target.value as typeof direction)}><option value="ltr">Izquierda a derecha</option><option value="rtl">Derecha a izquierda</option></select></label>
    <label>Movimiento<select id="fab-menu-motion" value={motion} onChange={e=>setMotion(e.target.value as typeof motion)}><option value="expressive">Expressive</option><option value="standard">Standard</option></select></label>
    <div className="state-options"><label><input id="fab-menu-short" type="checkbox" checked={short} onChange={e=>configure(setShort,e.target.checked)}/>Altura limitada</label><label><input id="fab-menu-disabled" type="checkbox" checked={disabled} onChange={e=>configure(setDisabled,e.target.checked)}/>Segunda acción no disponible</label></div>
   </div>
   <details className="example-code"><summary>Ver código</summary><pre><code>{code}</code></pre></details>
   <p className="preview-guidance">{mode==='anchored'?'El FAB abre un menú anclado. Usa flechas, Inicio/Fin, Escape y Enter o Espacio.':'Extensión del paquete: la pila se desplaza con el gesto o la rueda. El cierre permanece accesible.'}</p>
   <div className="fab-menu-scene" dir={direction}><SafeAreaInsetsContext.Provider value={previewInsets}><View style={{height:short?280:460,position:'relative',overflow:'hidden'}}>
    <View style={{padding:24,gap:16}}><Text variant="headlineSmall">{scenario==='create'?'Tu espacio':'Mi colección'}</Text><Text variant="bodyMedium">{scenario==='create'?'Crea contenido desde una sola acción principal.':'Elige cómo compartir esta colección.'}</Text>
     {records.slice(0,3).map(record=><View key={record} style={{flexDirection:'row',alignItems:'center',gap:12}}><Icon source="description" size={24}/><Text variant="bodyLarge">{record}</Text></View>)}
    </View><FAB.Menu {...menu}/>
   </View></SafeAreaInsetsContext.Provider></div>
   <div className="example-result" role="status" aria-live="polite"><span id="fab-menu-result">{result}</span><span><span id="fab-menu-actions">{actions}</span> acciones · <span id="fab-menu-dismissals">{dismissals}</span> cierres</span></div>
  </main><RuntimeBridge/>
 </MobileDesignProvider>;
}
