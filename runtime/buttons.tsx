import {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import {Button, MobileDesignProvider, type ButtonSize, type ButtonVariant} from 'mobile-design';
import './styles.css';

import {RuntimeBridge,useRuntimeEnvironment} from './environment';
const sizes:ButtonSize[] = ['extra-small','small','medium','large','extra-large'];
const variants:ButtonVariant[] = ['filled','tonal','elevated','outlined','text'];
const labels:Record<ButtonSize,string> = {'extra-small':'XS',small:'S',medium:'M',large:'L','extra-large':'XL'};
const defaults = {variant:'filled' as ButtonVariant,size:'small' as ButtonSize,shape:'round' as 'round'|'square',toggle:false,icon:true,disabled:false,loading:false,label:'Guardar'};

export function ButtonsRuntime() {
  const environment = useRuntimeEnvironment();
  const [config,setConfig] = useState(defaults);
  const [selected,setSelected] = useState(false);
  const [motion,setMotion] = useState<'standard'|'expressive'>('expressive');
  const [direction,setDirection] = useState<'ltr'|'rtl'>('ltr');
  const [count,setCount] = useState(0);
  const [feedback,setFeedback] = useState('Prueba el botón para ver su respuesta.');
  const [saving,setSaving] = useState(false);
  const [saved,setSaved] = useState(false);
  const [saveCount,setSaveCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const pending = useRef(false);
  useEffect(()=>()=>{clearTimeout(saveTimer.current);pending.current=false;},[]);
  const change=<K extends keyof typeof defaults>(key:K,value:typeof defaults[K])=>{
    setConfig(current=>({...current,[key]:value,...(key==='toggle'&&value&&current.variant==='text'?{variant:'filled' as ButtonVariant}:{})}));
    setFeedback('Prueba el botón para ver su respuesta.');
  };
  const activate=()=>{
    setCount(value=>value+1);
    if(config.toggle){setSelected(value=>!value);setFeedback(selected?'Elemento sin guardar.':'Elemento guardado.');}
    else setFeedback('Acción realizada.');
  };
  const save=()=>{
    if(pending.current)return;
    pending.current=true;setSaving(true);setSaved(false);
    saveTimer.current=setTimeout(()=>{pending.current=false;setSaving(false);setSaved(true);setSaveCount(value=>value+1);},1000);
  };
  const code=`<Button\n  variant="${config.variant}"\n  size="${config.size}"\n  shape="${config.shape}"${config.toggle?'\n  selected={selected}':''}${config.icon?'\n  icon="bookmark-outline"':''}${config.disabled?'\n  disabled':''}${config.loading?'\n  loading':''}\n  onPress={${config.toggle?'() => setSelected(value => !value)':'handlePress'}}\n>\n  ${config.label||'Guardar'}\n</Button>`;
  return <MobileDesignProvider colorScheme={environment.colorScheme} motion={motion} direction={direction} reduceMotion={environment.reduced?'on':'auto'}>
    <main aria-label="Ejemplo interactivo de Buttons">
      <div className="playground-controls" aria-label="Configurar Button">
        <label>Tipo<select id="button-type" value={config.toggle?'toggle':'default'} onChange={e=>change('toggle',e.target.value==='toggle')}><option value="default">Default</option><option value="toggle">Toggle</option></select></label>
        <label>Estilo<select id="button-variant" value={config.variant} onChange={e=>change('variant',e.target.value as ButtonVariant)}>{variants.filter(kind=>!config.toggle||kind!=='text').map(kind=><option key={kind} value={kind}>{kind[0].toUpperCase()+kind.slice(1)}</option>)}</select></label>
        <label>Tamaño<select id="button-size" value={config.size} onChange={e=>change('size',e.target.value as ButtonSize)}>{sizes.map(size=><option key={size} value={size}>{labels[size]} · {size}</option>)}</select></label>
        <label>Forma<select id="button-shape" value={config.shape} onChange={e=>change('shape',e.target.value as 'round'|'square')}><option value="round">Round</option><option value="square">Square</option></select></label>
        <label>Etiqueta<input id="button-label" value={config.label} maxLength={80} onChange={e=>change('label',e.target.value)}/></label>
        <label>Movimiento<select id="button-motion" value={motion} onChange={e=>setMotion(e.target.value as typeof motion)}><option value="expressive">Expressive</option><option value="standard">Standard</option></select></label>
        <label>Dirección<select id="button-direction" value={direction} onChange={e=>setDirection(e.target.value as typeof direction)}><option value="ltr">Izquierda a derecha</option><option value="rtl">Derecha a izquierda</option></select></label>
        <div className="state-options"><label><input type="checkbox" id="button-icon" checked={config.icon} onChange={e=>change('icon',e.target.checked)}/>Icono</label><label><input type="checkbox" id="button-disabled" checked={config.disabled} onChange={e=>change('disabled',e.target.checked)}/>Disabled</label><label><input type="checkbox" id="button-loading" checked={config.loading} onChange={e=>change('loading',e.target.checked)}/>Loading</label>{config.toggle?<label><input type="checkbox" id="button-selected" checked={selected} onChange={e=>setSelected(e.target.checked)}/>Selected</label>:null}</div>
      </div>
      <div className="button-stage" dir={direction}><View style={{maxWidth:'100%'}}><Button variant={config.variant} size={config.size} shape={config.shape} selected={config.toggle?selected:undefined} icon={config.icon?'bookmark-outline':undefined} disabled={config.disabled} loading={config.loading} onPress={activate} testID="example-button">{config.label||'Guardar'}</Button></View></div>
      <div className="example-result" role="status" aria-live="polite"><span>{feedback}</span><span><span id="activation-count">{count}</span> acciones</span></div>
      <details className="example-code"><summary>Ver código</summary><pre><code>{code}</code></pre></details>
      <section className="usage-section" aria-labelledby="loading-title"><h2 id="loading-title">Acción con carga</h2><p>Guardar muestra el progreso y confirma el resultado al terminar.</p><div className="usage-row"><Button variant="filled" icon={saved?'check':'content-save-outline'} loading={saving} onPress={save} testID="async-button">{saving?'Guardando':saved?'Guardado':'Guardar cambios'}</Button><span role="status" aria-live="polite" id="save-status" data-completed={saveCount}>{saving?'Guardando cambios…':saved?'Cambios guardados.':'Listo para guardar.'}</span></div></section>
      <details className="sizes-section"><summary>Explorar los cinco estilos</summary><div className="variant-examples">{variants.map(variant=><Button key={variant} variant={variant} icon="add" onPress={()=>setFeedback(variant+' activado.')} testID={'variant-'+variant}>{variant[0].toUpperCase()+variant.slice(1)}</Button>)}</div></details>
    </main>
    <RuntimeBridge/>
  </MobileDesignProvider>;
}
