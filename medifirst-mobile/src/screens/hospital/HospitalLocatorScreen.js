import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Alert, ActivityIndicator, ScrollView,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const SEARCH_RADIUS = 5000;
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const KNOWN_HOSPITALS = [
  { keywords: ['cebu doctors'],           phone: '032-255-5555' },
  { keywords: ['chong hua'],              phone: '032-255-8000' },
  { keywords: ['vicente sotto', 'vsmmc'], phone: '032-253-9891' },
  { keywords: ['perpetual succour'],      phone: '032-233-8620' },
  { keywords: ['cebu south'],             phone: '032-888-2000' },
  { keywords: ['cebu city medical'],      phone: '032-255-1423' },
  { keywords: ['brokenshire'],            phone: '082-221-1993' },
  { keywords: ['sacred heart'],           phone: '032-253-3355' },
];

function lookupPhone(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const h of KNOWN_HOSPITALS) {
    if (h.keywords.some(kw => lower.includes(kw))) return h.phone;
  }
  return null;
}

function formatDistance(m) {
  if (!m && m !== 0) return 'Nearby';
  return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'] || tags['addr:suburb'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

function parseElements(elements) {
  return elements
    .map((el) => {
      const lat  = el.lat ?? el.center?.lat;
      const lon  = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || null;
      const osmPhone = tags.phone || tags['contact:phone'] || null;
      return {
        id: el.id.toString(),
        name,
        address: buildAddress(tags),
        phone: osmPhone || lookupPhone(name),
        lat,
        lng: lon,
      };
    })
    .filter(h => h.lat && h.lng && h.name);
}

// ── Race all 3 servers — use whichever responds first ────────────────────────
async function fetchNearbyHospitals(latitude, longitude) {
  const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:${SEARCH_RADIUS},${latitude},${longitude});way["amenity"="hospital"](around:${SEARCH_RADIUS},${latitude},${longitude}););out center;`;

  const tryServer = (server) =>
    fetch(server, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    })
      .then(async (res) => {
        const text = await res.text();
        if (!text.trim().startsWith('{')) throw new Error('Non-JSON response');
        const data = JSON.parse(text);
        if (!data.elements) throw new Error('No elements');
        return parseElements(data.elements);
      });

  // Promise.any — resolves with first successful response
  try {
    return await Promise.any(OVERPASS_SERVERS.map(tryServer));
  } catch {
    throw new Error('All servers unavailable. Check your internet connection and try again.');
  }
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HospitalLocatorScreen() {
  const [location,  setLocation]  = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Getting your location…');
  const [error,     setError]     = useState(null);

  useEffect(() => { initLocation(); }, []);

  const initLocation = async () => {
    setLoading(true);
    setError(null);
    setHospitals([]);
    setLoadingMsg('Getting your location…');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby hospitals.');
        setLoading(false);
        return;
      }

      // ✅ Balanced accuracy = ~1 sec instead of 5-15 sec with High
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      setLoadingMsg('Searching nearby hospitals…');

      const results = await fetchNearbyHospitals(coords.latitude, coords.longitude);

      const withDistance = results
        .map(h => ({
          ...h,
          distanceMeters: getDistanceMeters(coords.latitude, coords.longitude, h.lat, h.lng),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 20);

      setHospitals(withDistance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const callHospital = (phone, name) => {
    if (!phone) { Alert.alert('No Phone Number', `${name} has no phone number listed.`); return; }
    Alert.alert(`Call ${name}`, `Dial ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  const getDirections = (lat, lng, name) => {
    Alert.alert(`Directions to ${name}`, 'Open in Google Maps?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Maps', onPress: () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`) },
    ]);
  };

  const openAllOnMap = () => {
    if (location) {
      const { latitude, longitude } = location;
      // Search "hospitals near me" centered exactly on user's coordinates at street level
      Linking.openURL(
        `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},15z/data=!3m1!4b1`
      );
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.center}>
        <SafeAreaView style={styles.headerLoading}>
          {Platform.OS === 'android' && <View style={{ height: StatusBar.currentHeight || 0 }} />}
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}><Ionicons name="medical" size={20} color="#fff" /></View>
              <View>
                <Text style={styles.headerTitle}>Hospital Locator</Text>
                <Text style={styles.headerSub}>Find emergency care near you</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.loadingBody}>
          <View style={styles.loadingIconWrap}>
            <Ionicons name="medical" size={32} color="#e74c3c" />
          </View>
          <ActivityIndicator size="large" color="#e74c3c" style={{ marginTop: 16 }} />
          <Text style={styles.loadingTitle}>Finding Nearby Hospitals</Text>
          <Text style={styles.loadingSubtitle}>{loadingMsg}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      {/* ══ HEADER ══ */}
      <SafeAreaView style={styles.header}>
        {Platform.OS === 'android' && <View style={{ height: StatusBar.currentHeight || 0 }} />}
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}><Ionicons name="medical" size={20} color="#fff" /></View>
            <View>
              <Text style={styles.headerTitle}>Hospital Locator</Text>
              <Text style={styles.headerSub}>Find emergency care near you</Text>
            </View>
          </View>
          <View style={[styles.gpsBadge, { backgroundColor: location ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.15)' }]}>
            <View style={[styles.gpsDot, { backgroundColor: location ? '#2ecc71' : '#f39c12' }]} />
            <Text style={styles.gpsText}>{location ? 'GPS On' : 'No GPS'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        {[
          { num: hospitals.length || '—',     label: 'Found',    icon: 'business',         color: '#27ae60' },
          { num: `${SEARCH_RADIUS/1000}km`,   label: 'Radius',   icon: 'radio-button-on',  color: '#2980b9' },
          { num: 'Free',                       label: 'No Key',   icon: 'shield-checkmark', color: '#8e44ad' },
          { num: 'Live',                       label: 'Real Data',icon: 'checkmark-done',   color: '#e74c3c' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={13} color={s.color} />
              </View>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* ── View on Google Maps CTA ── */}
      <TouchableOpacity style={styles.mapCta} onPress={openAllOnMap} activeOpacity={0.85}>
        <View style={styles.mapCtaIcon}><Ionicons name="map" size={22} color="#fff" /></View>
        <View style={styles.mapCtaBody}>
          <Text style={styles.mapCtaTitle}>View All on Google Maps</Text>
          <Text style={styles.mapCtaSub}>See hospitals near your location</Text>
        </View>
        <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.8)" style={{ marginRight: 14 }} />
      </TouchableOpacity>

      {/* ── Section Title + Refresh ── */}
      <View style={styles.sectionRow}>
        <View>
          <Text style={styles.sectionLabel}>NEARBY FACILITIES</Text>
          <Text style={styles.sectionTitle}>
            {hospitals.length > 0
              ? `${hospitals.length} Hospitals Near You`
              : error ? 'Could Not Load' : 'No Hospitals Found'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={initLocation} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color="#27ae60" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* ── Error State ── */}
      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="wifi-outline" size={32} color="#e74c3c" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={initLocation}>
            <Text style={styles.retryText}>🔄 Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty State ── */}
      {!error && hospitals.length === 0 && (
        <View style={styles.errorCard}>
          <Ionicons name="business-outline" size={32} color="#ccc" />
          <Text style={styles.errorTitle}>No hospitals found within 5km</Text>
          <Text style={styles.errorSub}>Try refreshing or check your GPS signal.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={initLocation}>
            <Text style={styles.retryText}>🔄 Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Hospital Cards ── */}
      {hospitals.map((item, index) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.cardIconWrap}>
              <Ionicons name="business" size={20} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.distBadge}>
                  <Ionicons name="location" size={11} color="#e74c3c" />
                  <Text style={styles.distText}>{formatDistance(item.distanceMeters)}</Text>
                </View>
                {index === 0 && (
                  <View style={styles.nearestBadge}>
                    <Text style={styles.nearestText}>⚡ Nearest</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardAddress} numberOfLines={2}>{item.address}</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={11} color={item.phone ? '#27ae60' : '#ccc'} />
                <Text style={[styles.phoneText, !item.phone && styles.noPhone]}>
                  {item.phone ?? 'No number listed'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: item.phone ? '#27ae60' : '#ccc' }]}
              onPress={() => callHospital(item.phone, item.name)}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#2980b9' }]}
              onPress={() => getDirections(item.lat, item.lng, item.name)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8e44ad' }]}
              onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}&zoom=17`)}
              activeOpacity={0.85}
            >
              <Ionicons name="information-circle" size={16} color="#fff" />
              <Text style={styles.actionText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {hospitals.length > 0 && (
        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark" size={14} color="#aaa" />
          <Text style={styles.disclaimerText}>
            Data from OpenStreetMap. Known Cebu hospital numbers are hardcoded as fallback. In a life-threatening emergency, always call 911 immediately.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },

  // Loading state — full screen with header
  center:          { flex: 1, backgroundColor: '#f5f6f8' },
  headerLoading:   { backgroundColor: '#27ae60', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  loadingBody:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center' },
  loadingTitle:    { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginTop: 14 },
  loadingSubtitle: { fontSize: 13, color: '#888', marginTop: 6 },

  header:      { backgroundColor: '#27ae60', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  gpsBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  gpsDot:      { width: 7, height: 7, borderRadius: 4 },
  gpsText:     { fontSize: 11, fontWeight: '700', color: '#fff' },

  statsRow:    { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statItem:    { flex: 1, alignItems: 'center', gap: 3 },
  statIcon:    { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statNum:     { fontSize: 14, fontWeight: '900', color: '#1a1a2e' },
  statLabel:   { fontSize: 9, color: '#aaa', textAlign: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: '#eee' },

  mapCta:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2980b9', marginHorizontal: 16, marginTop: 14, borderRadius: 14, overflow: 'hidden', elevation: 3 },
  mapCtaIcon:  { width: 56, alignSelf: 'stretch', backgroundColor: '#1a5276', justifyContent: 'center', alignItems: 'center' },
  mapCtaBody:  { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  mapCtaTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  mapCtaSub:   { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 22, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#27ae60', letterSpacing: 1.5, marginBottom: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  refreshBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e9f7ef', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  refreshText:  { fontSize: 12, fontWeight: '700', color: '#27ae60' },

  errorCard:  { alignItems: 'center', padding: 30, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 12, marginBottom: 6 },
  errorSub:   { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
  retryBtn:   { marginTop: 14, backgroundColor: '#e74c3c', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  card:        { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardHeader:  { flexDirection: 'row', padding: 14, alignItems: 'flex-start' },
  rankBadge:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2 },
  rankText:    { fontSize: 9, fontWeight: '800', color: '#888' },
  cardIconWrap:{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo:    { flex: 1 },
  cardName:    { fontSize: 14, fontWeight: '800', color: '#1a1a2e', lineHeight: 20, marginBottom: 5 },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' },
  distBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  distText:    { fontSize: 12, color: '#e74c3c', fontWeight: '700' },
  nearestBadge:{ backgroundColor: '#fff3cd', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  nearestText: { fontSize: 10, fontWeight: '700', color: '#d68910' },
  cardAddress: { fontSize: 11, color: '#999', lineHeight: 16, marginBottom: 4 },
  phoneRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneText:   { fontSize: 11, color: '#27ae60', fontWeight: '600' },
  noPhone:     { color: '#ccc', fontStyle: 'italic', fontWeight: '400' },
  divider:     { height: 1, backgroundColor: '#f4f4f4', marginHorizontal: 14 },
  cardActions: { flexDirection: 'row', padding: 12, gap: 8 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  actionText:  { color: '#fff', fontWeight: '700', fontSize: 12 },

  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 8, padding: 14, backgroundColor: '#f0f0f0', borderRadius: 12 },
  disclaimerText: { flex: 1, fontSize: 11, color: '#999', lineHeight: 17 },
});