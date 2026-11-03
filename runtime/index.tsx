import {registerRootComponent} from 'expo';
import {ButtonsRuntime} from './buttons';
import {ExtendedFABRuntime} from './extended-fab';
import {FABMenuRuntime} from './fab-menu';
import {FABsRuntime} from './fabs';
import {IconButtonsRuntime} from './icon-buttons';
import {SegmentedButtonsRuntime} from './segmented-buttons';
import {SplitButtonRuntime} from './split-button';
import {CardsRuntime} from './cards';
import {installDocsControls} from './docs-controls';
import './styles.css';
if(document.documentElement.hasAttribute('data-mobile-design-docs'))installDocsControls();
else{
 const component=new URLSearchParams(location.search).get('component');
 const entry=component==='segmented-buttons'?{title:'Segmented buttons',runtime:SegmentedButtonsRuntime}:component==='split-button'?{title:'Split button',runtime:SplitButtonRuntime}:component==='cards'?{title:'Cards',runtime:CardsRuntime}:component==='floating-action-button'?{title:'FABs',runtime:FABsRuntime}:component==='icon-buttons'?{title:'Icon buttons',runtime:IconButtonsRuntime}:component==='fab-menu'?{title:'FAB menu',runtime:FABMenuRuntime}:component==='extended-fab'?{title:'Extended FABs',runtime:ExtendedFABRuntime}:{title:'Buttons',runtime:ButtonsRuntime};
 document.title=entry.title+' · Mobile Design';
 registerRootComponent(entry.runtime);
}
