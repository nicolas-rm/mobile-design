import { useState } from 'react';
import { RadioButton } from 'mobile-design';

// Render inside MobileDesignProvider. Sheets also require GestureHandlerRootView.
export default function Example() {
  const [value, setValue] = useState('standard');
  return <RadioButton.Group value={value} onValueChange={setValue}>
    <RadioButton.Item value="standard" label="Calidad estándar" />
    <RadioButton.Item value="high" label="Calidad alta" />
  </RadioButton.Group>;
}
