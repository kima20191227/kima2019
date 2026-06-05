import { Stack } from 'expo-router'

export default function PremiumLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1B3A6B',
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        headerBackTitle: '뒤로',
        headerShadowVisible: false,
      }}
    />
  )
}
