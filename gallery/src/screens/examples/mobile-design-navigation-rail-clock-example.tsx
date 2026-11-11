import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Button, ExtendedFAB, NavigationRail, NavigationRailModal, Switch, Text, TopAppBar, useLocale, useMobileTheme } from 'mobile-design/react-native';

const destinations = [
    { key: 'alarm', label: 'Alarm', icon: 'alarm', selectedIcon: 'alarm_fill1' },
    { key: 'clock', label: 'Clock', icon: 'schedule', selectedIcon: 'schedule_fill1' },
    { key: 'timer', label: 'Timer', icon: 'hourglass_bottom', selectedIcon: 'hourglass_bottom_fill1' },
    { key: 'stopwatch', label: 'Stopwatch', icon: 'timer', selectedIcon: 'timer_fill1' },
    { key: 'bedtime', label: 'Bedtime', icon: 'bed', selectedIcon: 'bed_fill1', hiddenWhenCollapsed: true },
    { key: 'sleep', label: 'Sleep well', icon: 'bedtime', selectedIcon: 'bedtime_fill1', hiddenWhenCollapsed: true },
];
const minutes = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Local clock workspace: resizing/expansion preserves the running timer and destination. */
export function NavigationRailClockExample() {
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const standard = useWindowDimensions().width >= 600;
    const [value, setValue] = useState('timer');
    const [expanded, setExpanded] = useState(false);
    const [modal, setModal] = useState(false);
    const [remaining, setRemaining] = useState(600);
    const [running, setRunning] = useState(false);
    const [alarm, setAlarm] = useState(true);
    const deadline = useRef(0);
    useEffect(() => {
        if (!running) return;
        const tick = () => {
            const next = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
            setRemaining(next);
            if (next === 0) setRunning(false);
        };
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [running]);
    useEffect(() => { if (standard) setModal(false); }, [standard]);
    const addTimer = () => {
        setValue('timer');
        setRunning(false);
        setRemaining(600);
        setModal(false);
    };
    const fab = (showLabel: boolean) => <ExtendedFAB
        expanded={showLabel} icon="hourglass_bottom" label="Add timer" elevation={0}
        onPress={addTimer} testID="catalog-rail-clock-add" />;
    return (
        <View style={{ height: 620, flexDirection: rtl ? 'row-reverse' : 'row', overflow: 'hidden', backgroundColor: theme.colors.surfaceContainer }} testID="catalog-rail-clock-example">
            {standard ? <NavigationRail
                items={destinations} value={value} onValueChange={setValue}
                expanded={expanded} onExpandedChange={setExpanded} expandedWidth={256}
                accessibilityLabel="Clock destinations" fab={fab(expanded)}
                style={{ paddingTop: 44, paddingBottom: 0 }} testID="catalog-rail-clock" /> : null}
            <View style={{ flex: 1, minWidth: 0 }}>
                <TopAppBar title={destinations.find((item) => item.key === value)?.label ?? 'Clock'} statusBarHeight={0}
                    navigationIcon={!standard ? 'menu' : undefined} navigationLabel="Open Clock navigation"
                    onNavigationPress={!standard ? () => setModal(true) : undefined} />
                <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} testID="catalog-rail-clock-content">
                    {value === 'timer' ? <>
                        <View style={{ minHeight: 320, borderRadius: 28, justifyContent: 'center', alignItems: 'center', gap: 24, backgroundColor: theme.colors.primaryContainer }}>
                            <Text variant="displayLarge" style={{ color: theme.colors.onPrimaryContainer }} testID="catalog-rail-clock-time">{minutes(remaining)}</Text>
                            <Text>10 minutes</Text>
                            <Button variant="filled" icon={running ? 'pause' : 'play_arrow'} onPress={() => {
                                if (running) {
                                    setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
                                    setRunning(false);
                                } else {
                                    const duration = remaining || 600;
                                    deadline.current = Date.now() + duration * 1000;
                                    setRemaining(duration);
                                    setRunning(true);
                                }
                            }} testID="catalog-rail-clock-start">{running ? 'Pause' : 'Start'}</Button>
                        </View>
                        <Text accessibilityLiveRegion="polite">{running ? 'Timer running' : remaining === 0 ? 'Timer complete' : 'Timer paused'}</Text>
                    </> : value === 'alarm' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={{ flex: 1 }}><Text variant="headlineLarge">07:00</Text><Text>Every day</Text></View>
                        <Switch value={alarm} onValueChange={setAlarm} accessibilityLabel="Daily alarm at 07:00" testID="catalog-rail-clock-alarm" />
                    </View> : <View style={{ minHeight: 220, justifyContent: 'center', gap: 16 }}>
                        <Text variant="headlineMedium">{destinations.find((item) => item.key === value)?.label}</Text>
                        <Text>{value === 'clock' ? 'Local time and world clocks' : value === 'stopwatch' ? 'Your timer keeps its state while visiting another destination.' : 'Secondary destinations appear when navigation expands.'}</Text>
                    </View>}
                    <Text>The navigation stays in place while this content scrolls.</Text>
                </ScrollView>
            </View>
            <NavigationRailModal title="Clock" open={modal && !standard} onOpenChange={setModal}
                items={destinations} value={value} onValueChange={setValue} fab={fab(true)} testID="catalog-rail-clock-modal" />
        </View>
    );
}
