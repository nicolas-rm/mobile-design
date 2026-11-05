import { RemainingRuntime } from './remaining';
import { CatalogWindow } from './catalog-window';
import remainingFamilies from './remaining-families.json';
import { AppBarsRuntime } from './app-bars';
import { AppBarWindow } from './appbar-window';
import { BadgesRuntime } from './badges';
import { BadgeWindow } from './badge-window';
import { registerRootComponent } from 'expo';
import { ButtonsRuntime } from './buttons';
import { ExtendedFABRuntime } from './extended-fab';
import { FABMenuRuntime } from './fab-menu';
import { FABsRuntime } from './fabs';
import { IconButtonsRuntime } from './icon-buttons';
import { SegmentedButtonsRuntime } from './segmented-buttons';
import { SplitButtonRuntime } from './split-button';
import { CardsRuntime } from './cards';
import { TypographyRuntime } from './typography';
import { ButtonGroupsRuntime } from './button-groups';
import { AutocompleteRuntime, SelectRuntime } from './choice-examples';
import { installDocsControls } from './docs-controls';
import { CatalogPopupPreviewRuntime, isCatalogPopupPreview, popupPreviewTitles } from './catalog-card-previews';
import './styles.css';
if (document.documentElement.hasAttribute('data-mobile-design-docs')) installDocsControls();
else {
    const query = new URLSearchParams(location.search);
    const component = query.get('component');
    if (component === 'catalog-popup-preview') {
        const requested = query.get('preview') ?? '';
        const preview = isCatalogPopupPreview(requested) ? requested : 'tooltips';
        document.documentElement.dataset.catalogPopupPreview = '';
        document.body.inert = true;
        document.title = 'Vista previa de ' + popupPreviewTitles[preview] + ' · Mobile Design';
        registerRootComponent(() => <CatalogPopupPreviewRuntime component={preview} />);
    } else if (component === 'select' || component === 'autocomplete') {
        document.title = (component === 'select' ? 'Select' : 'Autocomplete') + ' · Mobile Design';
        registerRootComponent(component === 'select' ? SelectRuntime : AutocompleteRuntime);
    } else {
        const entry =
            component === 'catalog-window'
                ? { title: 'Componente · ejemplos', runtime: CatalogWindow }
                : component && component in remainingFamilies
                  ? { title: remainingFamilies[component as keyof typeof remainingFamilies].title, runtime: RemainingRuntime }
                  : component === 'app-bars'
                    ? { title: 'App bars', runtime: AppBarsRuntime }
                    : component === 'app-bars-window'
                      ? { title: 'App bars · ejemplo', runtime: AppBarWindow }
                      : component === 'badges'
                        ? { title: 'Badges', runtime: BadgesRuntime }
                        : component === 'badges-window'
                          ? { title: 'Badges · ejemplo', runtime: BadgeWindow }
                          : component === 'button-groups'
                            ? { title: 'Button groups', runtime: ButtonGroupsRuntime }
                            : component === 'text'
                              ? { title: 'Text y tipografía', runtime: TypographyRuntime }
                              : component === 'segmented-buttons'
                                ? { title: 'Segmented buttons', runtime: SegmentedButtonsRuntime }
                                : component === 'split-button'
                                  ? { title: 'Split button', runtime: SplitButtonRuntime }
                                  : component === 'cards'
                                    ? { title: 'Cards', runtime: CardsRuntime }
                                    : component === 'floating-action-button'
                                      ? { title: 'FABs', runtime: FABsRuntime }
                                      : component === 'icon-buttons'
                                        ? { title: 'Icon buttons', runtime: IconButtonsRuntime }
                                        : component === 'fab-menu'
                                          ? { title: 'FAB menu', runtime: FABMenuRuntime }
                                          : component === 'extended-fab'
                                            ? { title: 'Extended FABs', runtime: ExtendedFABRuntime }
                                            : { title: 'Buttons', runtime: ButtonsRuntime };
        document.title = entry.title + ' · Mobile Design';
        registerRootComponent(entry.runtime);
    }
}
