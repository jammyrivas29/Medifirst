import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Alert, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const EMERGENCY_NUMBERS = [
  { title: 'Emergency Services',     number: '911',            sub: 'Police · Ambulance · Fire Department', icon: 'call',         color: '#e74c3c', bg: '#fdecea' },
  { title: 'Poison Control Center',  number: '1-800-222-1222', sub: 'Toxic substance exposure & overdose',  icon: 'medkit',       color: '#2980b9', bg: '#e8f4fb' },
  { title: 'Crisis & Suicide Line',  number: '988',            sub: 'Mental health & suicide prevention',   icon: 'heart-half',   color: '#8e44ad', bg: '#f5eef8' },
  { title: 'Disaster Distress Line', number: '1-800-985-5990', sub: 'Emotional support after disasters',    icon: 'alert-circle', color: '#d35400', bg: '#fef5ec' },
];

const FIRST_AID_TIPS = [
  { icon: 'heart',       color: '#e74c3c', title: 'Cardiac Arrest / CPR', tip: 'Call 911. Give 30 compressions at 100–120/min, 2 rescue breaths. Use AED if available. Repeat until help arrives.' },
  { icon: 'warning',     color: '#e67e22', title: 'Choking',              tip: 'Give 5 firm back blows between shoulder blades, then 5 abdominal thrusts (Heimlich). Repeat until cleared.' },
  { icon: 'bandage',     color: '#c0392b', title: 'Severe Bleeding',      tip: 'Apply firm continuous pressure with a clean cloth. Do not remove. Elevate the limb if possible and call 911.' },
  { icon: 'flame',       color: '#f39c12', title: 'Burns',                tip: 'Cool under running water for 10–20 min. Do not use ice, butter, or creams. Cover loosely with a sterile bandage.' },
  { icon: 'pulse',       color: '#2980b9', title: 'Seizures',             tip: 'Clear hazards. Place on their side. Do not restrain or put anything in their mouth. Time the seizure.' },
  { icon: 'medkit',      color: '#8e44ad', title: 'Stroke',               tip: 'Call 911 immediately. Note when symptoms began. Do not give food or water. Use F.A.S.T. to identify symptoms.' },
  { icon: 'skull',       color: '#16a085', title: 'Poisoning',            tip: 'Call Poison Control (1-800-222-1222). Do not induce vomiting unless instructed. Note what was ingested.' },
  { icon: 'thermometer', color: '#27ae60', title: 'Heat Stroke',          tip: 'Move person to a cooler environment. Remove excess clothing. Apply cool, wet cloths to skin. Call 911 if severe.' },
];

function SectionHeader({ label, title, icon, iconColor, iconBg }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionIconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={13} color={iconColor} />
        </View>
        <Text style={[styles.sectionLabel, { color: iconColor }]}>{label}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function EmergencyScreen() {
  const [locating, setLocating] = useState(false);

  const callNumber = (number, title) => {
    Alert.alert(`📞 ${title}`, `Call ${number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL(`tel:${number}`) },
    ]);
  };

  const shareLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Location access is required.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const msg = `🚨 EMERGENCY! I need help!\nMy location: ${mapsLink}\nLat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
      const smsUrl = `sms:?body=${encodeURIComponent(msg)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) { await Linking.openURL(smsUrl); Alert.alert('Success', 'SMS app opened with your location!'); }
      else Alert.alert('Location Retrieved', `Your location:\n${mapsLink}`, [{ text: 'OK' }, { text: 'Open Maps', onPress: () => Linking.openURL(mapsLink) }]);
    } catch { Alert.alert('Error', 'Could not get location. Check your settings.'); }
    finally { setLocating(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

      {/* ══ HEADER ══ */}
      <SafeAreaView style={styles.appHeader}>
        {Platform.OS === 'android' && (
          <View style={{ height: StatusBar.currentHeight || 0 }} />
        )}
        <View style={styles.hdrInner}>
          <View style={styles.hdrBrand}>
            <View style={styles.hdrLogoWrap}>
              <View style={styles.hdrIconBox}>
                <Ionicons name="call" size={22} color="#fff" />
              </View>
              <View style={styles.hdrPulseDot} />
            </View>
            <View>
              <Text style={styles.hdrTitle}>Emergency Center</Text>
              <Text style={styles.hdrSub}>Critical services & guidance</Text>
            </View>
          </View>
          <View style={styles.hdrBadge}>
            <Ionicons name="warning" size={12} color="#e74c3c" />
            <Text style={styles.hdrBadgeText}>EMERGENCY</Text>
          </View>
        </View>
        <View style={styles.hdrStrip}>
          <View style={styles.hdrLiveDot} />
          <Text style={styles.hdrStripText}>Services Available 24 / 7 — Tap to call instantly</Text>
        </View>
      </SafeAreaView>

      {/* ── Stats row ── */}
      <View style={styles.statsWrap}>
        {[
          { num: '4',    label: 'Hotlines',  icon: 'call',      color: '#e74c3c' },
          { num: '8',    label: 'Protocols', icon: 'clipboard', color: '#2980b9' },
          { num: '24/7', label: 'Available', icon: 'time',      color: '#8e44ad' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={13} color={s.color} />
              </View>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* ── Alert banner ── */}
      <View style={styles.alertBanner}>
        <Ionicons name="information-circle" size={16} color="#7d6608" />
        <Text style={styles.alertBannerText}>In any life-threatening situation, call 911 first. Do not delay professional help.</Text>
      </View>

      {/* ══ QUICK ACTIONS ══ */}
      <SectionHeader label="QUICK ACTIONS" title="Immediate Response" icon="flash" iconColor="#e74c3c" iconBg="#fdecea" />

      <View style={styles.unifiedCard}>
        <View style={styles.cardHeaderStrip}>
          <Ionicons name="flash" size={14} color="#e74c3c" />
          <Text style={styles.cardHeaderText}>Tap to act immediately</Text>
        </View>
        <TouchableOpacity style={styles.cardRow} onPress={() => callNumber('911', 'Emergency Services')} activeOpacity={0.82}>
          <View style={[styles.rowIcon, { backgroundColor: '#e74c3c' }]}>
            <Ionicons name="call" size={22} color="#fff" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Call 911</Text>
            <Text style={styles.rowSub}>Ambulance · Fire · Police</Text>
          </View>
          <View style={[styles.rowBadge, { backgroundColor: '#fdecea' }]}>
            <Text style={styles.rowBadgeText}>CALL</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardDivider} />
        <TouchableOpacity style={styles.cardRow} onPress={shareLocation} disabled={locating} activeOpacity={0.82}>
          <View style={[styles.rowIcon, { backgroundColor: '#27ae60' }]}>
            <Ionicons name={locating ? 'hourglass-outline' : 'location'} size={22} color="#fff" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{locating ? 'Getting Location…' : 'Send My Location'}</Text>
            <Text style={styles.rowSub}>SMS your GPS coordinates to contacts</Text>
          </View>
          <View style={[styles.rowBadge, { backgroundColor: '#e9f7ef' }]}>
            <Text style={styles.rowBadgeText}>SMS</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ══ EMERGENCY NUMBERS ══ */}
      <SectionHeader label="EMERGENCY NUMBERS" title="Call for Help" icon="call" iconColor="#e74c3c" iconBg="#fdecea" />

      <View style={styles.unifiedCard}>
        {EMERGENCY_NUMBERS.map((e, idx) => (
          <React.Fragment key={e.number}>
            <TouchableOpacity style={styles.cardRow} onPress={() => callNumber(e.number, e.title)} activeOpacity={0.82}>
              <View style={[styles.rowIcon, { backgroundColor: e.bg }]}>
                <Ionicons name={e.icon} size={21} color={e.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{e.title}</Text>
                <Text style={[styles.rowNumber, { color: e.color }]}>{e.number}</Text>
                <Text style={styles.rowSub}>{e.sub}</Text>
              </View>
              <View style={[styles.rowIconBtn, { backgroundColor: e.bg }]}>
                <Ionicons name="call" size={15} color={e.color} />
              </View>
            </TouchableOpacity>
            {idx < EMERGENCY_NUMBERS.length - 1 && <View style={styles.cardDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* ══ FIRST AID PROTOCOLS ══ */}
      <SectionHeader label="QUICK REFERENCE" title="First Aid Protocols" icon="medical" iconColor="#8e44ad" iconBg="#f5eef8" />

      <View style={styles.unifiedCard}>
        {FIRST_AID_TIPS.map((item, idx) => (
          <React.Fragment key={item.title}>
            <View style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>{item.title}</Text>
                <Text style={styles.tipText}>{item.tip}</Text>
              </View>
            </View>
            {idx < FIRST_AID_TIPS.length - 1 && <View style={styles.cardDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* ── Disclaimer ── */}
      <View style={styles.disclaimer}>
        <Ionicons name="shield-checkmark" size={15} color="#aaa" />
        <Text style={styles.disclaimerText}>
          This app provides general first aid guidance only and is not a substitute for professional medical advice. Always seek qualified emergency assistance immediately.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f6f8' },
  contentContainer: { paddingBottom: 20 },

  appHeader: { backgroundColor: '#e74c3c', elevation: 6, shadowColor: '#c0392b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 },
  hdrInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  hdrBrand:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdrLogoWrap: { position: 'relative' },
  hdrIconBox:  { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  hdrPulseDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#27ae60', borderWidth: 2, borderColor: '#e74c3c' },
  hdrTitle:    { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  hdrSub:      { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontStyle: 'italic' },
  hdrBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  hdrBadgeText:{ fontSize: 11, fontWeight: '800', color: '#e74c3c' },
  hdrStrip:    { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.12)', paddingHorizontal: 16, paddingVertical: 8 },
  hdrLiveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ecc71' },
  hdrStripText:{ fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: '500', flex: 1 },

  statsWrap:   { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statItem:    { flex: 1, alignItems: 'center', gap: 3 },
  statIconBox: { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statNum:     { fontSize: 15, fontWeight: '900', color: '#1a1a2e' },
  statLabel:   { fontSize: 9, color: '#aaa', textAlign: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: '#eee' },

  alertBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef9e7', borderLeftWidth: 4, borderLeftColor: '#f39c12', marginHorizontal: 16, marginTop: 14, borderRadius: 10, padding: 12 },
  alertBannerText: { flex: 1, fontSize: 12, color: '#7d6608', lineHeight: 18, fontWeight: '500' },

  sectionHeader:   { paddingHorizontal: 16, marginTop: 22, marginBottom: 12 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  sectionIconBox:  { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sectionLabel:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  sectionTitle:    { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },

  unifiedCard:     { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeaderStrip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fef5f5', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#fce8e8' },
  cardHeaderText:  { fontSize: 11, color: '#c0392b', fontWeight: '700', letterSpacing: 0.4 },
  cardRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 13 },
  cardDivider:     { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  rowIcon:         { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  rowText:         { flex: 1 },
  rowTitle:        { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  rowNumber:       { fontSize: 17, fontWeight: '900', marginTop: 1, marginBottom: 2 },
  rowSub:          { fontSize: 11, color: '#999', lineHeight: 16 },
  rowBadge:        { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  rowBadgeText:    { fontSize: 11, fontWeight: '800', color: '#555', letterSpacing: 0.4 },
  rowIconBtn:      { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  tipRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 13, alignItems: 'flex-start' },
  tipIcon:  { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  tipBody:  { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  tipText:  { fontSize: 12, color: '#666', lineHeight: 18 },

  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginHorizontal: 16, marginTop: 20, padding: 14, backgroundColor: '#f0f0f0', borderRadius: 12 },
  disclaimerText: { flex: 1, fontSize: 11, color: '#999', lineHeight: 17 },
});