import {useEffect,useState} from 'react';
import {createMobileDesignTheme} from 'mobile-design';

type Environment={colorScheme:'light'|'dark';reduced:boolean};
export function useRuntimeEnvironment(){
 const [environment,setEnvironment]=useState<Environment>(()=>{
  const query=new URLSearchParams(location.search);
  return {colorScheme:query.get('theme')==='dark'?'dark':'light',reduced:query.get('reduced')==='true'};
 });
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='mobile-design:environment')return;
   const {theme,reduced}=event.data;
   if((theme==='light'||theme==='dark')&&typeof reduced==='boolean')setEnvironment({colorScheme:theme,reduced});
  };
  window.addEventListener('message',receive);return ()=>window.removeEventListener('message',receive);
 },[]);
 useEffect(()=>{
  document.documentElement.lang='es';document.documentElement.dataset.theme=environment.colorScheme;document.documentElement.dataset.reduced=String(environment.reduced);
  const {colors}=createMobileDesignTheme({colorScheme:environment.colorScheme});
  const roles={primary:colors.primary,'on-primary':colors.onPrimary,surface:colors.surface,low:colors.surfaceContainerLow,container:colors.surfaceContainer,high:colors.surfaceContainerHighest,raised:colors.surfaceContainerHigh,ink:colors.onSurface,muted:colors.onSurfaceVariant,outline:colors.outlineVariant};
  for(const [name,color]of Object.entries(roles))document.documentElement.style.setProperty('--'+name,String(color));
 },[environment]);
 return environment;
}
export function RuntimeBridge(){
 useEffect(()=>{
  let frame=0;const main=document.querySelector('main')!;
  const publish=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>parent.postMessage({type:'mobile-design:height',height:Math.ceil(main.getBoundingClientRect().height)},location.origin));};
  const observer=new ResizeObserver(publish);observer.observe(main);publish();
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[]);
 return null;
}
