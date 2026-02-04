import { Redirect } from 'expo-router';

// This screen is never rendered - the tab button intercepts and shows the add menu
// If somehow navigated to directly, redirect to home
export default function AddScreen() {
  return <Redirect href="/(tabs)" />;
}
