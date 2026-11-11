import React from 'react';
import {
    Appbar as PaperAppbar,
    type AppbarActionProps as PaperAppbarActionProps,
    type AppbarBackActionProps as PaperAppbarBackActionProps,
    type AppbarContentProps as PaperAppbarContentProps,
    type AppbarHeaderProps as PaperAppbarHeaderProps,
    type AppbarProps as PaperAppbarProps,
} from 'react-native-paper';

import { reactNativePaper } from '@/theme/global';

export type AppbarProps = Omit<PaperAppbarProps, 'style'> & {
    style?: PaperAppbarProps['style'];
};
export type AppbarActionProps = PaperAppbarActionProps;
export type AppbarBackActionProps = PaperAppbarBackActionProps;
export type AppbarContentProps = PaperAppbarContentProps;
export type AppbarHeaderProps = PaperAppbarHeaderProps;

function AppbarRoot({ style, testID = 'appbar', ...props }: AppbarProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.appbar, style], [style]);

    return <PaperAppbar {...props} style={mergedStyle} testID={testID} />;
}

function AppbarAction({ style, testID = 'appbar-action', ...props }: AppbarActionProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.appbarAction, style], [style]);

    return <PaperAppbar.Action {...props} style={mergedStyle} testID={testID} />;
}

function AppbarBackAction({ accessibilityLabel = 'Regresar', style, testID = 'appbar-back-action', ...props }: AppbarBackActionProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.appbarBackAction, style], [style]);

    return <PaperAppbar.BackAction {...props} accessibilityLabel={accessibilityLabel} style={mergedStyle} testID={testID} />;
}

function AppbarContent({ style, testID = 'appbar-content', ...props }: AppbarContentProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.appbarContent, style], [style]);

    return <PaperAppbar.Content {...props} style={mergedStyle} testID={testID} />;
}

function AppbarHeader({ style, testID = 'appbar-header', ...props }: AppbarHeaderProps) {
    const mergedStyle = React.useMemo(() => [reactNativePaper.appbarHeader, style], [style]);

    return <PaperAppbar.Header {...props} style={mergedStyle} testID={testID} />;
}

export const Appbar = Object.assign(AppbarRoot, {
    Action: AppbarAction,
    BackAction: AppbarBackAction,
    Content: AppbarContent,
    Header: AppbarHeader,
});
