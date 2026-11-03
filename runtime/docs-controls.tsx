import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal,flushSync} from 'react-dom';
import {Button,IconButton,MaterialSymbol,Tooltip,MobileDesignProvider,type ButtonVariant,type ButtonSize,type IconButtonProps} from 'mobile-design';

type Configuration={theme:'light'|'dark';reduced:boolean;onAction:(host:HTMLElement)=>void|Promise<void>};
export type DocsControls={configure:(config:Configuration)=>void;mount:()=>void;clear:(container:Element)=>void};
declare global{interface Window{mobileDesignDocsControls?:DocsControls}}

function Action({host,onAction}:{host:HTMLElement;onAction:Configuration['onAction']}){
 const [busy,setBusy]=useState(false),pending=useRef(false),alive=useRef(true);
 useLayoutEffect(()=>{host.dataset.mobileDesignMounted='true';host.removeAttribute('aria-busy');return ()=>{delete host.dataset.mobileDesignMounted;};},[host]);
 useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
 const activate=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);
  try{await onAction(host);}finally{pending.current=false;if(alive.current)setBusy(false);}
 };
 const label=host.dataset.accessibilityLabel??host.dataset.label??'';
 if(host.dataset.kind==='icon'){
  const control=<IconButton icon={p=><MaterialSymbol {...p} name={host.dataset.icon??'more_vert'} filled/>}
   sizeClass={(host.dataset.size??'small') as ButtonSize} shape={host.dataset.shape==='square'?'square':'round'}
   mode={host.dataset.mode as IconButtonProps['mode']} selected={host.dataset.action==='motion'?host.dataset.selected==='true':undefined}
   accessibilityLabel={label} accessibilityState={{busy,...(host.dataset.expanded?{expanded:host.dataset.expanded==='true'}:{})}}
   onPress={activate} testID={'docs-icon-'+host.dataset.action}/>;
  // The page's native HTML dialog owns the top layer; its close action keeps
  // a browser hint until the Search family replaces that dialog composition.
  return host.closest('dialog')?control:<Tooltip title={label}>{control}</Tooltip>;
 }
 return <Button variant={(host.dataset.variant??'text') as ButtonVariant} size="small"
  icon={host.dataset.icon||undefined} accessibilityLabel={host.dataset.accessibilityLabel??host.dataset.label}
  selected={host.dataset.action==='motion'?host.dataset.selected==='true':undefined} accessibilityState={{busy}} onPress={activate}
  testID={'docs-'+host.dataset.action}>{host.dataset.label}</Button>;
}

/** One provider for page controls; portals keep each Button in the article layout. */
export function installDocsControls(){
 const rootNode=document.createElement('div');rootNode.id='mobile-design-controls-root';
 Object.assign(rootNode.style,{position:'fixed',inset:'0',display:'flex',flexDirection:'column',pointerEvents:'none',zIndex:'600'});document.body.append(rootNode);
 const root=createRoot(rootNode),targets=new Map<HTMLElement,number>();let sequence=0;
 let configuration:Configuration={theme:'light',reduced:false,onAction:()=>{}};
 const draw=()=>flushSync(()=>root.render(<MobileDesignProvider colorScheme={configuration.theme} reduceMotion={configuration.reduced?'on':'auto'}>
  {[...targets].map(([host,key])=>createPortal(<Action host={host} onAction={configuration.onAction}/>,host,key))}
 </MobileDesignProvider>));
 window.mobileDesignDocsControls={
  configure(next){configuration=next;draw();},
  mount(){for(const host of targets.keys())if(!host.isConnected)targets.delete(host);for(const host of document.querySelectorAll<HTMLElement>('[data-mobile-design-host]'))if(!targets.has(host))targets.set(host,++sequence);draw();},
  clear(container){for(const host of targets.keys())if(container===host||container.contains(host))targets.delete(host);draw();},
 };
 document.dispatchEvent(new Event('mobile-design:controls-ready'));
}
