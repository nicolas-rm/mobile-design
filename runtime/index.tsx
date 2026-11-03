import {registerRootComponent} from 'expo';
import {ButtonsRuntime} from './buttons';
import {ExtendedFABRuntime} from './extended-fab';
import {FABMenuRuntime} from './fab-menu';
import {FABsRuntime} from './fabs';
import {IconButtonsRuntime} from './icon-buttons';
import {installDocsControls} from './docs-controls';
import './styles.css';
if(document.documentElement.hasAttribute('data-mobile-design-docs'))installDocsControls();
else{
 const component=new URLSearchParams(location.search).get('component');
 const entry=component==='floating-action-button'?{title:'FABs',runtime:FABsRuntime}:component==='icon-buttons'?{title:'Icon buttons',runtime:IconButtonsRuntime}:component==='fab-menu'?{title:'FAB menu',runtime:FABMenuRuntime}:component==='extended-fab'?{title:'Extended FABs',runtime:ExtendedFABRuntime}:{title:'Buttons',runtime:ButtonsRuntime};
 document.title=entry.title+' · Mobile Design';
 registerRootComponent(entry.runtime);
}
