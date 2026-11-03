import {registerRootComponent} from 'expo';
import {ButtonsRuntime} from './buttons';
import {ExtendedFABRuntime} from './extended-fab';
import './styles.css';
const extended=new URLSearchParams(location.search).get('component')==='extended-fab';
document.title=(extended?'Extended FABs':'Buttons')+' · Mobile Design';
registerRootComponent(extended?ExtendedFABRuntime:ButtonsRuntime);
