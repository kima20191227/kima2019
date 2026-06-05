import React, { useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native'
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Organization } from '@/types'

const LANGUAGE_FILTERS = [
  '전체', '베트남', '네팔', '몽골', '인도네시아', '필리핀', '러시아', '중국', '태국',
]
const REGION_FILTERS = [
  '전체', '서울경기인천', '부산경남', '대구경북', '광주전라', '대전충청', '강원제주',
]

const INITIAL_REGION = {
  latitude: 36.5,
  longitude: 127.9,
  latitudeDelta: 6,
  longitudeDelta: 5,
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full mr-2 border ${
        active ? 'bg-primary border-primary' : 'bg-white border-gray-300'
      }`}
    >
      <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

type OrgWithCoords = Organization & { lat: number; lng: number }

function OrgMarker({ org }: { org: OrgWithCoords }) {
  return (
    <Marker
      coordinate={{ latitude: org.lat, longitude: org.lng }}
      pinColor="#1B3A6B"
    >
      <Callout tooltip>
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 12,
            width: 220,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text
            style={{ color: '#111827', fontWeight: '600', fontSize: 13 }}
            numberOfLines={2}
          >
            {org.name}
          </Text>
          {org.region ? (
            <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
              {org.region}
            </Text>
          ) : null}
          {org.languages && org.languages.length > 0 && (
            <Text style={{ color: '#1B3A6B', fontSize: 11, marginTop: 4 }}>
              {org.languages.join(' · ')}
            </Text>
          )}
          {org.description ? (
            <Text
              style={{ color: '#4B5563', fontSize: 11, marginTop: 4 }}
              numberOfLines={2}
            >
              {org.description}
            </Text>
          ) : null}
        </View>
      </Callout>
    </Marker>
  )
}

export default function MapScreen() {
  const [langFilter, setLangFilter] = useState('전체')
  const [regionFilter, setRegionFilter] = useState('전체')
  const mapRef = useRef<MapView>(null)

  const { data: orgs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['organizations', langFilter, regionFilter],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (langFilter !== '전체') params.language = langFilter
      if (regionFilter !== '전체') params.region = regionFilter
      return api.get<Organization[]>('/api/organizations', params)
    },
    select: (d) => (Array.isArray(d) ? d : (d as { data?: Organization[] }).data ?? []),
  })

  const validOrgs = useMemo(
    () => orgs.filter((o): o is OrgWithCoords => o.lat != null && o.lng != null),
    [orgs],
  )

  const markers = useMemo(
    () => validOrgs.map((org) => <OrgMarker key={org.id} org={org} />),
    [validOrgs],
  )

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary px-4 pt-14 pb-3">
        <Text className="text-white text-lg font-bold">사역 단체 지도</Text>
        <Text className="text-blue-200 text-xs mt-0.5">
          {isLoading ? '불러오는 중...' : `${validOrgs.length}개 단체 표시 중`}
        </Text>
      </View>

      <View className="bg-white border-b border-gray-100 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {REGION_FILTERS.map((r) => (
            <FilterChip
              key={r}
              label={r}
              active={regionFilter === r}
              onPress={() => setRegionFilter(r)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="bg-white border-b border-gray-100 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {LANGUAGE_FILTERS.map((l) => (
            <FilterChip
              key={l}
              label={l}
              active={langFilter === l}
              onPress={() => setLangFilter(l)}
            />
          ))}
        </ScrollView>
      </View>

      {isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B3A6B" />
          <Text className="text-gray-500 text-sm mt-3">단체 정보를 불러오는 중...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsMyLocationButton
        >
          {markers}
        </MapView>
      )}
    </View>
  )
}
