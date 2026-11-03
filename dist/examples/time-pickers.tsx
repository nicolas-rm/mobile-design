import { useState } from 'react';
import { Button, TimePicker } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState({ hours: 15, minutes: 45 });
  return <>
    <Button onPress={() => setVisible(true)}>Elegir hora</Button>
    <TimePicker visible={visible} value={time} is24Hour={false}
      onDismiss={() => setVisible(false)}
      onConfirm={next => { setTime(next); setVisible(false); }} />
  </>;
}
