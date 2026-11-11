import { Platform, type AccessibilityProps } from 'react-native';

/**
 * Screen-reader semantics shared by the app's controls.
 */

/**
 * One option of a single-choice group (volume, drink type, leak amount,
 * export range and format, language…).
 * - iOS: a button with the Selected trait, as UIKit lists with a checkmark
 *   are ("Selected, Medium, button").
 * - Android: a radio button with its checked state (TalkBack: "Medium,
 *   radio button, checked"), inside a radiogroup (choiceGroupA11y).
 */
export function choiceA11y(selected: boolean): AccessibilityProps {
  return Platform.OS === 'ios'
    ? { accessibilityRole: 'button', accessibilityState: { selected } }
    : { accessibilityRole: 'radio', accessibilityState: { checked: selected } };
}

/** The container of a single-choice group, named after its section title. */
export function choiceGroupA11y(label: string): AccessibilityProps {
  return { accessibilityRole: 'radiogroup', accessibilityLabel: label };
}

/**
 * A tab of a segmented control or a filter in a tab list (Today's
 * Week/Month, History's filters): role tab with its selected state, inside a
 * container with role tablist.
 */
export function tabA11y(selected: boolean): AccessibilityProps {
  return { accessibilityRole: 'tab', accessibilityState: { selected } };
}

export const tabListA11y: AccessibilityProps = { accessibilityRole: 'tablist' };

/**
 * An adjustable value (urgency scale, goal and amount steppers): one element
 * that VoiceOver users change by swiping up and down and TalkBack users with
 * the volume keys or the adjust actions.
 */
export function adjustableA11y({
  label,
  valueText,
  min,
  max,
  now,
  onIncrement,
  onDecrement,
}: {
  label: string;
  valueText: string;
  min?: number;
  max?: number;
  now?: number;
  onIncrement: () => void;
  onDecrement: () => void;
}): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: label,
    accessibilityValue: { min, max, now, text: valueText },
    accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }],
    onAccessibilityAction: (event) => {
      if (event.nativeEvent.actionName === 'increment') onIncrement();
      else if (event.nativeEvent.actionName === 'decrement') onDecrement();
    },
  };
}

/** Hides a purely visual element (decoration, duplicated text) from screen readers. */
export const hiddenA11y: AccessibilityProps = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
};

/** Join the parts of an accessibility label, skipping empty ones. */
export function a11yLabel(...parts: (string | number | false | null | undefined)[]): string {
  return parts
    .filter((part) => part !== false && part !== null && part !== undefined && part !== '')
    .join(', ');
}
