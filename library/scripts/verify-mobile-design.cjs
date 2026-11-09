/** Standalone package contracts. Native device interaction is verified separately. */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const checks = [
    'verify-mobile-design-theme.cjs',
    'verify-mobile-design-foundation.cjs',
    'verify-mobile-design-font-assets.cjs',
    'verify-mobile-design-actions.cjs',
    'verify-mobile-design-avatar.cjs',
    'verify-mobile-design-loading-scenarios.cjs',
    'verify-mobile-design-reference-examples.cjs',
    'verify-mobile-design-lists.cjs',
    'verify-mobile-design-swipe-interruptions.cjs',
    'verify-mobile-design-popup.cjs',
    'verify-mobile-design-menu.cjs',
    'verify-mobile-design-dialogs.cjs',
    'verify-mobile-design-tooltips.cjs',
    'verify-mobile-design-button-groups.cjs',
    'verify-mobile-design-loading-indicator.cjs',
    'verify-mobile-design-tabs.cjs',
    'verify-mobile-design-overlays.cjs',
    'verify-mobile-design-appbars.cjs',
    'verify-mobile-design-rail-press.cjs',
    'verify-mobile-design-navigation-layout.cjs',
    'verify-mobile-design-navigation-worklets.cjs',
    'verify-mobile-design-selection.cjs',
    'verify-material-components.cjs',
    'verify-material-carousel-interactions.cjs',
    'verify-material-date-picker-sessions.cjs',
    'verify-material-progress-lifecycle.cjs',
];
for (const script of checks) {
    const result = spawnSync(process.execPath, [path.join(__dirname, script)], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Mobile Design: all ${checks.length} package checks passed.`);
