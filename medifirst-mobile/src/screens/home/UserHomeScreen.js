import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Linking, Image, Modal,
  Platform, SafeAreaView, StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { logout } from '../../store/authSlice';

const CATEGORIES = [
  { id: 'cpr',        title: 'CPR',        icon: 'heart',       color: '#e74c3c', description: 'Cardiopulmonary Resuscitation' },
  { id: 'choking',    title: 'Choking',    icon: 'warning',     color: '#e67e22', description: 'Heimlich Maneuver' },
  { id: 'burns',      title: 'Burns',      icon: 'flame',       color: '#f39c12', description: 'Burn Treatment & Care' },
  { id: 'bleeding',   title: 'Bleeding',   icon: 'bandage',     color: '#c0392b', description: 'Stop Severe Bleeding' },
  { id: 'fractures',  title: 'Fractures',  icon: 'body',        color: '#8e44ad', description: 'Broken Bone Care' },
  { id: 'seizure',    title: 'Seizures',   icon: 'pulse',       color: '#2980b9', description: 'Seizure Response' },
  { id: 'stroke',     title: 'Stroke',     icon: 'medkit',      color: '#d35400', description: 'Stroke Emergency Care' },
  { id: 'heat_stroke',title: 'Heat Stroke',icon: 'thermometer', color: '#f39c12', description: 'Heat-Related Emergency' },
];

const QUICK_TOOLS = [
  { title: 'Nearby Hospitals',   sub: 'Find emergency care near you', icon: 'location', color: '#27ae60', bg: '#e9f7ef', action: 'hospital' },
  { title: 'Emergency Contacts', sub: 'Your saved emergency contacts', icon: 'people',   color: '#2980b9', bg: '#e8f4fb', action: 'emergency' },
  { title: 'Medical Profile',    sub: 'Blood type, allergies & more',  icon: 'person',   color: '#8e44ad', bg: '#f5eef8', action: 'profile' },
  { title: 'All Topics',         sub: 'Step-by-step emergency guides', icon: 'list',     color: '#c0392b', bg: '#fdecea', action: 'guides' },
];

const FIRST_AID_FACTS = [
  { fact: 'CPR can double or triple survival chances after cardiac arrest.',              icon: 'heart',       color: '#e74c3c' },
  { fact: 'The Heimlich maneuver removes blockages in over 80% of choking cases.',       icon: 'warning',     color: '#e67e22' },
  { fact: 'Running cool water on a burn for 20 minutes significantly reduces damage.',   icon: 'flame',       color: '#f39c12' },
  { fact: 'Applying firm pressure for 10 minutes stops most external bleeding.',         icon: 'bandage',     color: '#c0392b' },
  { fact: 'Most seizures stop on their own within 1-3 minutes without intervention.',    icon: 'pulse',       color: '#2980b9' },
  { fact: 'Heat stroke is a medical emergency that requires immediate treatment.',        icon: 'thermometer', color: '#f39c12' },
  { fact: 'Stroke is the 5th leading cause of death and a major cause of disability.',   icon: 'medkit',      color: '#d35400' },
  { fact: 'Fractures can be open (bone protrudes) or closed (bone stays under skin).',   icon: 'body',        color: '#8e44ad' },
  { fact: 'Only 46% of cardiac arrest victims outside hospitals receive bystander CPR.', icon: 'people',      color: '#16a085' },
];

const SOURCES = [
  { category: '🫀 CPR & Cardiac Arrest', color: '#e74c3c', items: [{ title: 'WikiHow — How to Perform CPR on an Adult, Child, Baby', url: 'https://www.wikihow.com/Perform-CPR' }] },
  { category: '😮‍💨 Choking', color: '#e67e22', items: [{ title: 'WikiHow — How to Help a Choking Victim', url: 'https://www.wikihow.com/Help-a-Choking-Victim' }] },
  { category: '🔥 Burns & Wounds', color: '#f39c12', items: [{ title: 'WikiHow — How to Treat a Burn', url: 'https://www.wikihow.com/Treat-a-Burn' }] },
  { category: '🩹 Bleeding & Wounds', color: '#c0392b', items: [{ title: 'WikiHow — How to Stop a Cut from Bleeding', url: 'https://www.wikihow.com/Stop-Bleeding' }] },
  { category: '🦴 Fractures & Broken Bones', color: '#8e44ad', items: [{ title: 'WikiHow — How to Treat a Broken Foot', url: 'https://www.wikihow.com/Treat-a-Foot-Fracture' }] },
  { category: '⚡ Seizures', color: '#2980b9', items: [{ title: 'WikiHow — How to Help Someone Having a Seizure', url: 'https://www.wikihow.com/Stop-a-Seizure' }] },
  { category: '🧠 Stroke', color: '#d35400', items: [{ title: 'WikiHow — How to Recognize a Stroke', url: 'https://www.wikihow.com/Identify-if-Someone-Had-a-Stroke' }] },
  { category: '🌡️ Heat Stroke', color: '#f39c12', items: [{ title: 'WikiHow — How to Treat Heat Stroke', url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/extreme-heat-safety/heat-check.html' }] },
  { category: '☠️ Poisoning', color: '#27ae60', items: [{ title: 'WikiHow — How to Treat Poisoning', url: 'https://www.wikihow.com/Treat-Poisoning' }] },
  { category: '🏥 Hospital & Emergency Locator', color: '#27ae60', items: [{ title: 'OpenStreetMap — Overpass API', url: 'https://overpass-api.de' }, { title: 'OpenStreetMap Foundation', url: 'https://www.openstreetmap.org' }] },
  { category: '🤖 AI Assistant', color: '#16a085', items: [{ title: 'Groq AI — LLaMA 3.3 Model', url: 'https://console.groq.com' }, { title: 'Meta LLaMA 3 — Open Source LLM', url: 'https://ai.meta.com/llama/' }] },
  { category: '📱 App Technology', color: '#34495e', items: [{ title: 'React Native — Mobile Framework', url: 'https://reactnative.dev' }, { title: 'Expo — Development Platform', url: 'https://expo.dev' }, { title: 'Node.js + MongoDB — Backend', url: 'https://nodejs.org' }] },
];

function InfoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={infoStyles.container}>
        <View style={infoStyles.header}>
          <View style={infoStyles.headerLeft}>
            <View style={infoStyles.headerIcon}><Ionicons name="information-circle" size={22} color="#fff" /></View>
            <View>
              <Text style={infoStyles.headerTitle}>Sources & References</Text>
              <Text style={infoStyles.headerSub}>MediFirst App v1.0.0</Text>
            </View>
          </View>
          <TouchableOpacity style={infoStyles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>
        <View style={infoStyles.disclaimer}>
          <Ionicons name="warning" size={14} color="#856404" />
          <Text style={infoStyles.disclaimerText}>MediFirst provides general first aid guidance only. Always consult a medical professional for emergencies.</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {SOURCES.map((section) => (
            <View key={section.category} style={infoStyles.section}>
              <View style={infoStyles.sectionHeader}>
                <View style={[infoStyles.sectionDot, { backgroundColor: section.color }]} />
                <Text style={infoStyles.sectionTitle}>{section.category}</Text>
              </View>
              {section.items.map((item, idx) => (
                <TouchableOpacity key={idx} style={infoStyles.sourceRow} onPress={() => Linking.openURL(item.url)} activeOpacity={0.75}>
                  <View style={infoStyles.sourceRowLeft}>
                    <Ionicons name="link" size={13} color={section.color} />
                    <Text style={infoStyles.sourceTitle}>{item.title}</Text>
                  </View>
                  <Ionicons name="open-outline" size={14} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={infoStyles.appInfo}>
            <Text style={infoStyles.appInfoTitle}>MediFirst — First Aid Assistant</Text>
            <Text style={infoStyles.appInfoText}>Version 1.0.0 · Built for emergency preparedness</Text>
            <Text style={infoStyles.appInfoText}>© 2026 MediFirst Team. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function UserHomeScreen({ navigation }) {
  const dispatch  = useDispatch();
  const { user }  = useSelector((state) => state.auth);
  const firstName = user?.firstName || null;
  const [locating,    setLocating]    = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const handleToolPress = (action) => {
    switch (action) {
      case 'hospital':  navigation.navigate('Hospital'); break;
      case 'emergency': navigation.navigate('Emergency'); break;
      case 'profile':   navigation.navigate('Profile'); break;
      case 'guides':    navigation.navigate('Guides', { screen: 'GuidesList' }); break;
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleCall911 = () => {
    Alert.alert('🚨 Call 911', 'Do you want to call emergency services?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
    ]);
  };

  const shareLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Location permission is required.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const message  = `🚨 EMERGENCY! I need help!\nMy location: ${mapsLink}`;
      const smsUrl   = `sms:?body=${encodeURIComponent(message)}`;
      const canOpen  = await Linking.canOpenURL(smsUrl);
      if (canOpen) { await Linking.openURL(smsUrl); Alert.alert('Success', 'SMS app opened with your location!'); }
      else Alert.alert('Location Retrieved', `Your location:\n${mapsLink}`);
    } catch { Alert.alert('Error', 'Could not get location.'); }
    finally { setLocating(false); }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>

        {/* ══ HEADER ══ */}
        <SafeAreaView style={styles.appHeader}>
          {Platform.OS === 'android' && <View style={{ height: StatusBar.currentHeight || 0 }} />}
          <View style={styles.hdrInner}>
            <View style={styles.hdrBrand}>
              <View style={styles.hdrLogoWrap}>
                <Image source={require('../../../assets/logo2.png')} style={styles.hdrLogoImg} resizeMode="contain" />
                <View style={styles.hdrPulseDot}><Ionicons name="pulse" size={8} color="#fff" /></View>
              </View>
              <View>
                <Text style={styles.hdrTitle}>MediFirst</Text>
                <Text style={styles.hdrSub}>First Aid Assistant</Text>
              </View>
            </View>
            <View style={styles.hdrActions}>
              <TouchableOpacity style={styles.hdrIconBtn} onPress={() => setInfoVisible(true)} activeOpacity={0.85}>
                <Ionicons name="information-circle-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.hdrIconBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
                <Ionicons name="person-circle" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.hdrIconBtn, styles.hdrSignOutBtn]} onPress={handleLogout} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.hdrStrip}>
            <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.hdrStripText}>Welcome back, {firstName}! Stay safe today.</Text>
          </View>
        </SafeAreaView>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>QUICK ACCESS</Text><Text style={styles.sectionTitle}>Your Tools</Text></View>
        <View style={styles.toolsGrid}>
          {QUICK_TOOLS.map((tool) => (
            <TouchableOpacity key={tool.title} style={styles.toolCard} onPress={() => handleToolPress(tool.action)} activeOpacity={0.8}>
              <View style={[styles.toolIcon, { backgroundColor: tool.bg }]}><Ionicons name={tool.icon} size={22} color={tool.color} /></View>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolSub}>{tool.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>EMERGENCY</Text><Text style={styles.sectionTitle}>Quick Response</Text></View>
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyCardHeader}><Ionicons name="warning" size={15} color="#e74c3c" /><Text style={styles.emergencyCardHeaderText}>Tap below in case of emergency</Text></View>
          <TouchableOpacity style={styles.emergencyRow} onPress={handleCall911} activeOpacity={0.82}>
            <View style={styles.emergencyRowIcon911}><Ionicons name="call" size={22} color="#fff" /></View>
            <View style={styles.emergencyRowText}><Text style={styles.emergencyRowTitle}>Call 911</Text><Text style={styles.emergencyRowSub}>Ambulance · Fire · Police</Text></View>
            <View style={[styles.emergencyBadge, { backgroundColor: '#fdecea' }]}><Text style={styles.emergencyBadgeText}>CALL</Text></View>
          </TouchableOpacity>
          <View style={styles.emergencyDivider} />
          <TouchableOpacity style={styles.emergencyRow} onPress={shareLocation} disabled={locating} activeOpacity={0.82}>
            <View style={styles.emergencyRowIconSMS}><Ionicons name={locating ? 'hourglass-outline' : 'location'} size={22} color="#fff" /></View>
            <View style={styles.emergencyRowText}><Text style={styles.emergencyRowTitle}>{locating ? 'Locating…' : 'Send My Location'}</Text><Text style={styles.emergencyRowSub}>SMS your GPS to emergency contact</Text></View>
            <View style={[styles.emergencyBadge, { backgroundColor: '#e9f7ef' }]}><Text style={styles.emergencyBadgeText}>SMS</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>FIRST AID GUIDES</Text><Text style={styles.sectionTitle}>Choose a Topic</Text></View>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.card} onPress={() => navigation.navigate('Guides', { screen: 'GuidesList', params: { category: cat.id } })} activeOpacity={0.78}>
              <View style={[styles.cardIconWrap, { backgroundColor: cat.color + '18' }]}><Ionicons name={cat.icon} size={24} color={cat.color} /></View>
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.cardDesc}>{cat.description}</Text>
              <View style={[styles.cardAccent, { backgroundColor: cat.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>DID YOU KNOW?</Text><Text style={styles.sectionTitle}>First Aid Facts</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.factsScroll}>
          {FIRST_AID_FACTS.map((item, idx) => (
            <View key={idx} style={styles.factCard}>
              <View style={[styles.factIcon, { backgroundColor: item.color + '18' }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
              <Text style={styles.factText}>{item.fact}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Tip — last item, no spacer below */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}><Ionicons name="bulb" size={16} color="#f39c12" /><Text style={styles.tipTitle}>Quick Tip</Text></View>
          <Text style={styles.tipText}>In any emergency, always <Text style={{ fontWeight: '700', color: '#c0392b' }}>call 911 first</Text> before attempting first aid.</Text>
        </View>

      </ScrollView>

      {/* ══ FLOATING CHAT BUBBLE ══ */}
      <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.navigate('Chatbot')} activeOpacity={0.85}>
        <Ionicons name="chatbubbles" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ══ INFO / SOURCES MODAL ══ */}
      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f6f8' },
  contentContainer: { paddingBottom: 16 },

  appHeader:     { backgroundColor: '#e74c3c', elevation: 6, shadowColor: '#c0392b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 },
  hdrInner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  hdrBrand:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdrLogoWrap:   { position: 'relative' },
  hdrLogoImg:    { width: 48, height: 48 },
  hdrPulseDot:   { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e74c3c' },
  hdrTitle:      { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  hdrSub:        { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontStyle: 'italic' },
  hdrActions:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hdrIconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  hdrSignOutBtn: { backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  hdrStrip:      { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.12)', paddingHorizontal: 16, paddingVertical: 8 },
  hdrStripText:  { fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: '500', flex: 1 },

  sectionHeader: { paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionLabel:  { fontSize: 11, fontWeight: '700', color: '#c0392b', letterSpacing: 1.5, marginBottom: 4 },
  sectionTitle:  { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', gap: 12 },
  toolCard:  { width: '47%', backgroundColor: '#fff', borderRadius: 13, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  toolIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  toolTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  toolSub:   { fontSize: 11, color: '#888', lineHeight: 15 },

  emergencyCard:           { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  emergencyCardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fef5f5', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#fce8e8' },
  emergencyCardHeaderText: { fontSize: 11, color: '#c0392b', fontWeight: '700', letterSpacing: 0.4 },
  emergencyRow:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  emergencyDivider:        { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  emergencyRowIcon911:     { width: 46, height: 46, borderRadius: 13, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center' },
  emergencyRowIconSMS:     { width: 46, height: 46, borderRadius: 13, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  emergencyRowText:        { flex: 1 },
  emergencyRowTitle:       { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  emergencyRowSub:         { fontSize: 11, color: '#999', marginTop: 2 },
  emergencyBadge:          { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  emergencyBadgeText:      { fontSize: 11, fontWeight: '800', color: '#555', letterSpacing: 0.5 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', marginTop: 4 },
  card:         { width: '48%', backgroundColor: '#fff', borderRadius: 13, padding: 15, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardIconWrap: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
  cardTitle:    { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 3 },
  cardDesc:     { fontSize: 11, color: '#888', lineHeight: 15 },
  cardAccent:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  factsScroll: { paddingHorizontal: 16, gap: 12 },
  factCard:    { width: 190, backgroundColor: '#fff', borderRadius: 13, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  factIcon:    { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
  factText:    { fontSize: 12, color: '#444', lineHeight: 18 },

  tipCard:   { margin: 16, marginTop: 20, backgroundColor: '#fffbf0', borderRadius: 13, padding: 15, borderLeftWidth: 4, borderLeftColor: '#f39c12' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  tipTitle:  { fontSize: 14, fontWeight: '700', color: '#856404' },
  tipText:   { fontSize: 13, color: '#856404', lineHeight: 19 },

  floatingBtn: {
    position: 'absolute', bottom: 30, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#e74c3c',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
  },
});

const infoStyles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f5f6f8' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e74c3c', paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  closeBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef9e7', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#fef0c0' },
  disclaimerText: { flex: 1, fontSize: 11, color: '#856404', lineHeight: 16 },
  section:       { marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionDot:    { width: 10, height: 10, borderRadius: 5 },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  sourceRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  sourceRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sourceTitle:   { fontSize: 13, color: '#333', fontWeight: '500', flex: 1 },
  appInfo:      { backgroundColor: '#fff', borderRadius: 13, padding: 16, marginTop: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  appInfoTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  appInfoText:  { fontSize: 12, color: '#888', marginBottom: 3, textAlign: 'center' },
});