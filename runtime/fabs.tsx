import {useCallback,useState} from 'react';
import {View} from 'react-native';
import {FAB,MaterialSymbol,MobileDesignProvider,Tooltip,type FABProps,type FABSize,type FABVariant} from 'mobile-design';
import {RuntimeBridge,useRuntimeEnvironment} from './environment';
import {FABUsage} from './extended-fab';

const variants:FABVariant[]=['tonalPrimary','tonalSecondary','tonalTertiary','primary','secondary','tertiary'];
const names=['Primary container','Secondary container','Tertiary container','Primary','Secondary','Tertiary'];
const sizes:FABSize[]=['default','medium','large'];
export function FABsRuntime(){
 const environment=useRuntimeEnvironment();
 const [size,setSize]=useState<FABSize>('medium'),[variant,setVariant]=useState<FABVariant>('tonalPrimary');
 const [visible,setVisible]=useState(true),[symbol,setSymbol]=useState('edit'),[direction,setDirection]=useState<'ltr'|'rtl'>('ltr');
 const [motion,setMotion]=useState<'standard'|'expressive'>('expressive'),[count,setCount]=useState(0);
 const icon: FABProps['icon']=useCallback(({size,color}:{size:number;color:string})=><MaterialSymbol name={symbol} size={size} color={color} filled/>,[symbol]);
 const code=`<FAB\n  size="${size}"\n  variant="${variant}"\n  icon={(props: { size: number; color: string }) => <MaterialSymbol {...props} name="${symbol}" filled />}\n  visible={${visible}}\n  accessibilityLabel="Crear contenido"\n  onPress={handleCreate}\n/>`;
 return <MobileDesignProvider colorScheme={environment.colorScheme} direction={direction} motion={motion} reduceMotion={environment.reduced?'on':'auto'}>
  <main aria-label="Ejemplo interactivo de FABs">
   <div className="playground-controls" aria-label="Configurar FAB">
    <label>Tamaño<select id="fab-size" value={size} onChange={e=>setSize(e.target.value as FABSize)}>{sizes.map((s,i)=><option key={s} value={s}>{['FAB · 56','Medium · 80','Large · 96'][i]}</option>)}</select></label>
    <label>Color<select id="fab-variant" value={variant} onChange={e=>setVariant(e.target.value as FABVariant)}>{variants.map((v,i)=><option key={v} value={v}>{names[i]}</option>)}</select></label>
    <label>Icono<select id="fab-symbol" value={symbol} onChange={e=>setSymbol(e.target.value)}>{['edit','add','share','favorite'].map(name=><option key={name} value={name}>{name}</option>)}</select></label>
    <label>Dirección<select id="fab-direction" value={direction} onChange={e=>setDirection(e.target.value as typeof direction)}><option value="ltr">Izquierda a derecha</option><option value="rtl">Derecha a izquierda</option></select></label>
    <label>Movimiento<select id="fab-motion" value={motion} onChange={e=>setMotion(e.target.value as typeof motion)}><option value="expressive">Expressive</option><option value="standard">Standard</option></select></label>
    <div className="state-options"><label><input id="fab-visible" type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/>Visible</label></div>
   </div>
   <div className="button-stage" dir={direction}><View><Tooltip title="Crear contenido"><FAB size={size} variant={variant} icon={icon} visible={visible} accessibilityLabel="Crear contenido" onPress={()=>setCount(v=>v+1)} testID="example-fab"/></Tooltip></View></div>
   <div className="example-result" role="status"><span>Una acción principal; se oculta cuando deja de estar disponible.</span><span><span id="fab-activation-count">{count}</span> acciones</span></div>
   <section className="example-code"><h2>Código de la configuración</h2><pre tabIndex={0}><code>{code}</code></pre></section>
   <section className="sizes-section"><h2>Los tres tamaños</h2><div className="variant-examples">{sizes.map((s,i)=><div className="labeled-example" key={s}><FAB size={s} icon={icon} accessibilityLabel={'Crear con tamaño '+s} onPress={()=>setCount(v=>v+1)}/><span>{['FAB · 56','Medium · 80','Large · 96'][i]}</span></div>)}</div></section>
   <FABUsage direction={direction} extended={false}/>
  </main><RuntimeBridge/>
 </MobileDesignProvider>;
}
