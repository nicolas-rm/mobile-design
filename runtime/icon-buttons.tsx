import {useCallback,useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {Button,IconButton,MaterialSymbol,MobileDesignProvider,Tooltip,Menu,type IconButtonProps,type ButtonSize} from 'mobile-design';
import {RuntimeBridge,useRuntimeEnvironment} from './environment';

const sizes:ButtonSize[]=['extra-small','small','medium','large','extra-large'];
const styles=['filled','tonal','outlined','standard'] as const;
type Treatment=typeof styles[number];
const mode=(value:Treatment):IconButtonProps['mode']=>value==='filled'?'contained':value==='tonal'?'contained-tonal':value==='outlined'?'outlined':undefined;
const widths=['narrow','default','wide'] as const;

function Uses(){
 const [favorite,setFavorite]=useState(false),[bookmark,setBookmark]=useState(false),[playing,setPlaying]=useState(false),[track,setTrack]=useState(0);
 const [mic,setMic]=useState(true),[camera,setCamera]=useState(true),[hand,setHand]=useState(false),[call,setCall]=useState(true);
 const [menu,setMenu]=useState(false),[status,setStatus]=useState('Elige una acción del menú.');
 const alive=useRef(true);useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
 const tracks=['Long Walk','In the Dark','A new beginning'];
 return <section className="usage-section"><h2>Ejemplos en acción</h2>
  <article className="icon-usage"><h3>Guardar y marcar como favorito</h3><p>Una selección controlada cambia forma, color y relleno del icono.</p><div className="usage-row">
   <Tooltip title={favorite?'Quitar de favoritos':'Añadir a favoritos'}><IconButton icon={props=><MaterialSymbol {...props} name="favorite" filled={favorite}/>} mode="contained-tonal" selected={favorite} accessibilityLabel={favorite?'Quitar de favoritos':'Añadir a favoritos'} onPress={()=>setFavorite(v=>!v)} testID="usage-favorite"/></Tooltip>
   <Tooltip title={bookmark?'Quitar marcador':'Guardar artículo'}><IconButton icon={props=><MaterialSymbol {...props} name="bookmark" filled={bookmark}/>} mode="outlined" selected={bookmark} accessibilityLabel={bookmark?'Quitar marcador':'Guardar artículo'} onPress={()=>setBookmark(v=>!v)} testID="usage-bookmark"/></Tooltip>
   <span role="status" id="icon-saved-state">{favorite?'En favoritos':'Sin favorito'} · {bookmark?'Artículo guardado':'Sin marcador'}</span>
  </div></article>
  <article className="icon-usage"><h3>Controles de reproducción</h3><p id="icon-track" role="status">{tracks[track]} · {playing?'Reproduciendo':'En pausa'}</p><div className="media-actions">
   <Tooltip title="Canción anterior" anchorStyle={{alignSelf:'center'}}><IconButton icon={p=><MaterialSymbol {...p} name="skip_previous" filled/>} mode="outlined" accessibilityLabel="Canción anterior" onPress={()=>setTrack(v=>(v+tracks.length-1)%tracks.length)} testID="usage-previous"/></Tooltip>
   <Tooltip title={playing?'Pausar':'Reproducir'} anchorStyle={{alignSelf:'center'}}><IconButton icon={p=><MaterialSymbol {...p} name={playing?'pause':'play_arrow'} filled/>} mode="contained" sizeClass="medium" widthVariant="wide" accessibilityLabel={playing?'Pausar':'Reproducir'} onPress={()=>setPlaying(v=>!v)} testID="usage-play"/></Tooltip>
   <Tooltip title="Canción siguiente" anchorStyle={{alignSelf:'center'}}><IconButton icon={p=><MaterialSymbol {...p} name="skip_next" filled/>} mode="outlined" accessibilityLabel="Canción siguiente" onPress={()=>setTrack(v=>(v+1)%tracks.length)} testID="usage-next"/></Tooltip>
  </div></article>
  <article className="icon-usage"><h3>Acciones en una llamada</h3>{call?<><div className="usage-row">
   <IconButton icon={p=><MaterialSymbol {...p} name={mic?'mic':'mic_off'} filled={!mic}/>} mode="contained-tonal" selected={!mic} accessibilityLabel={mic?'Silenciar micrófono':'Activar micrófono'} onPress={()=>setMic(v=>!v)} testID="usage-mic"/>
   <IconButton icon={p=><MaterialSymbol {...p} name={camera?'videocam':'videocam_off'} filled={!camera}/>} mode="contained-tonal" selected={!camera} accessibilityLabel={camera?'Apagar cámara':'Activar cámara'} onPress={()=>setCamera(v=>!v)} testID="usage-camera"/>
   <IconButton icon={p=><MaterialSymbol {...p} name="front_hand" filled={hand}/>} mode="contained-tonal" selected={hand} accessibilityLabel={hand?'Bajar la mano':'Levantar la mano'} onPress={()=>setHand(v=>!v)} testID="usage-hand"/>
   <Tooltip title="Salir de la llamada"><IconButton icon={p=><MaterialSymbol {...p} name="call_end" filled/>} mode="contained" accessibilityLabel="Salir de la llamada" onPress={()=>setCall(false)} testID="usage-leave"/></Tooltip>
   </div><p id="icon-call-state" role="status">{mic?'Micrófono activo':'Micrófono silenciado'} · {camera?'Cámara activa':'Cámara apagada'} · {hand?'Mano levantada':'Mano abajo'}</p></>:<div className="usage-row"><p role="status">Has salido de la llamada de ejemplo.</p><Button onPress={()=>setCall(true)}>Volver a unirme</Button></div>}</article>
  <article className="icon-usage"><h3>Abrir un menú</h3><p>El estado de presión permanece mientras la superficie asociada está abierta.</p><Menu visible={menu} onDismiss={()=>setMenu(false)} anchor={<IconButton icon="more_vert" accessibilityLabel="Acciones del artículo" onPress={()=>setMenu(true)} testID="usage-more"/>}>
   <Menu.Item title="Copiar título" leadingIcon="content_copy" onPress={()=>{navigator.clipboard.writeText('Mi artículo').then(()=>{if(alive.current)setStatus('Título copiado.');},()=>{if(alive.current)setStatus('No se pudo copiar.');});}}/>
   <Menu.Item title="Marcar para después" leadingIcon="bookmark" onPress={()=>{setBookmark(true);setStatus('Artículo guardado para después.');}}/>
  </Menu><p role="status" id="icon-menu-result">{status}</p></article>
 </section>;
}

export function IconButtonsRuntime(){
 const environment=useRuntimeEnvironment();
 const [size,setSize]=useState<ButtonSize>('small'),[treatment,setTreatment]=useState<Treatment>('filled');
 const [shape,setShape]=useState<'round'|'square'>('round'),[width,setWidth]=useState<typeof widths[number]>('default');
 const [toggle,setToggle]=useState(false),[selected,setSelected]=useState(false),[disabled,setDisabled]=useState(false),[loading,setLoading]=useState(false),[count,setCount]=useState(0);
 const [direction,setDirection]=useState<'ltr'|'rtl'>('ltr'),[motion,setMotion]=useState<'standard'|'expressive'>('expressive');
 const icon:IconButtonProps['icon']=useCallback(p=><MaterialSymbol {...p} name="favorite" filled={toggle?selected:true}/>,[toggle,selected]);
 const actionName=toggle?'selected ? "Quitar de favoritos" : "Añadir a favoritos"':'"Añadir a favoritos"';
 const code=`<Tooltip title={${actionName}}>\n  <IconButton\n    icon={props => <MaterialSymbol {...props} name="favorite" filled={${toggle?'selected':'true'}} />}\n    ${mode(treatment)?`mode="${mode(treatment)}"\n    `:''}sizeClass="${size}"\n    shape="${shape}"\n    widthVariant="${width}"${toggle?'\n    selected={selected}':''}${disabled?'\n    disabled':''}${loading?'\n    loading':''}\n    accessibilityLabel={${actionName}}\n    onPress={${toggle?'() => setSelected(value => !value)':'handlePress'}}\n  />\n</Tooltip>`;
 return <MobileDesignProvider colorScheme={environment.colorScheme} direction={direction} motion={motion} reduceMotion={environment.reduced?'on':'auto'}>
  <main aria-label="Ejemplo interactivo de Icon buttons">
   <div className="playground-controls" aria-label="Configurar IconButton">
    <label>Tipo<select id="icon-type" value={toggle?'toggle':'default'} onChange={e=>setToggle(e.target.value==='toggle')}><option value="default">Default</option><option value="toggle">Toggle</option></select></label>
    <label>Estilo<select id="icon-treatment" value={treatment} onChange={e=>setTreatment(e.target.value as Treatment)}>{styles.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label>Tamaño<select id="icon-size" value={size} onChange={e=>setSize(e.target.value as ButtonSize)}>{sizes.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label>Anchura<select id="icon-width" value={width} onChange={e=>setWidth(e.target.value as typeof width)}>{widths.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label>Forma<select id="icon-shape" value={shape} onChange={e=>setShape(e.target.value as typeof shape)}><option value="round">Round</option><option value="square">Square</option></select></label>
    <label>Dirección<select id="icon-direction" value={direction} onChange={e=>setDirection(e.target.value as typeof direction)}><option value="ltr">Izquierda a derecha</option><option value="rtl">Derecha a izquierda</option></select></label>
    <label>Movimiento<select id="icon-motion" value={motion} onChange={e=>setMotion(e.target.value as typeof motion)}><option value="expressive">Expressive</option><option value="standard">Standard</option></select></label>
    <div className="state-options"><label><input id="icon-disabled" type="checkbox" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/>Disabled</label><label><input id="icon-loading" type="checkbox" checked={loading} onChange={e=>setLoading(e.target.checked)}/>Loading</label>{toggle?<label><input id="icon-selected" type="checkbox" checked={selected} onChange={e=>setSelected(e.target.checked)}/>Selected</label>:null}</div>
   </div>
   <div className="button-stage" dir={direction}><View><Tooltip title={toggle&&selected?'Quitar de favoritos':'Añadir a favoritos'}><IconButton icon={icon} mode={mode(treatment)} sizeClass={size} widthVariant={width} shape={shape} selected={toggle?selected:undefined} disabled={disabled} loading={loading} accessibilityLabel={toggle&&selected?'Quitar de favoritos':'Añadir a favoritos'} onPress={()=>{setCount(v=>v+1);if(toggle)setSelected(v=>!v);}} testID="example-icon-button"/></Tooltip></View></div>
   <div className="example-result" role="status"><span>{toggle?(selected?'Seleccionado':'Sin seleccionar'):'Acción sin selección persistente'}</span><span><span id="icon-activation-count">{count}</span> acciones</span></div>
   <section className="example-code"><h2>Código de la configuración</h2><pre tabIndex={0}><code>{code}</code></pre></section>
   <section className="sizes-section"><h2>Cinco tamaños y tres anchuras</h2><div className="icon-size-examples">{sizes.map(s=><div className="icon-size-row" key={s}><h3>{s}</h3><div className="variant-examples">{widths.map(w=><div className="labeled-example" key={w}><IconButton icon={p=><MaterialSymbol {...p} name="add" filled/>} mode={mode(treatment)} sizeClass={s} widthVariant={w} shape={shape} accessibilityLabel={'Añadir · '+s+' · '+w} onPress={()=>setCount(v=>v+1)}/><span>{w}</span></div>)}</div></div>)}</div></section>
   <Uses/>
  </main><RuntimeBridge/>
 </MobileDesignProvider>;
}
