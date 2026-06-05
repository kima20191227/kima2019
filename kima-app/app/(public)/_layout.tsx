import { Stack } from 'expo-router'

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1B3A6B',
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: '뒤로',
      }}
    />
  )
}
