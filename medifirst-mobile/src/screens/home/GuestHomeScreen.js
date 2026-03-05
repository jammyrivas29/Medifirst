import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated, Linking, Image,
  FlatList, Platform, ActivityIndicator, SafeAreaView, StatusBar, Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../store/authSlice';

const GUIDES_DOWNLOAD_KEY   = 'medifirst_guides_downloaded';
const FIRST_LAUNCH_KEY      = 'medifirst_first_launch_done';
const TOTAL_GUIDES          = 9;

const LOCKED_FEATURES = [
  { icon: 'people', color: '#2980b9', bg: '#e8f4fb', label: 'Emergency Contacts', sub: 'Your saved emergency contacts' },
  { icon: 'person', color: '#8e44ad', bg: '#f5eef8', label: 'Medical Profile',    sub: 'Blood type, allergies & more' },
  { icon: 'send',   color: '#e67e22', bg: '#fef5ec', label: 'Send Location SMS',  sub: 'GPS location to contacts' },
  { icon: 'time',   color: '#c0392b', bg: '#fdecea', label: 'Call History',       sub: 'Your emergency call log' },
];
const MEMBER_PERKS = [
  { icon: 'people',        color: '#2980b9', bg: '#e8f4fb', label: 'Emergency\nContacts' },
  { icon: 'person',        color: '#8e44ad', bg: '#f5eef8', label: 'Medical\nProfile' },
  { icon: 'send',          color: '#e67e22', bg: '#fef5ec', label: 'Location\nSMS' },
  { icon: 'time',          color: '#c0392b', bg: '#fdecea', label: 'Call\nHistory' },
  { icon: 'heart',         color: '#e74c3c', bg: '#fdecea', label: 'Health\nTips' },
  { icon: 'notifications', color: '#16a085', bg: '#e8f8f5', label: 'Emergency\nAlerts' },
];

// What gets "downloaded" — metadata only, images are already bundled in the app
const GUIDE_PREVIEWS = [
  { id: 'local_cpr',        icon: 'heart',       color: '#e74c3c', label: 'CPR'          },
  { id: 'local_choking',    icon: 'warning',     color: '#e67e22', label: 'Choking'      },
  { id: 'local_burns',      icon: 'flame',       color: '#f39c12', label: 'Burns'        },
  { id: 'local_bleeding',   icon: 'bandage',     color: '#c0392b', label: 'Bleeding'     },
  { id: 'local_fractures',  icon: 'body',        color: '#8e44ad', label: 'Fractures'    },
  { id: 'local_seizure',    icon: 'pulse',       color: '#2980b9', label: 'Seizure'      },
  { id: 'local_stroke',     icon: 'medkit',      color: '#d35400', label: 'Stroke'       },
  { id: 'local_heatstroke', icon: 'thermometer', color: '#f39c12', label: 'Heat Stroke'  },
  { id: 'local_poison',     icon: 'skull',       color: '#27ae60', label: 'Poisoning'    },
];

export default function GuestHomeScreen({ navigation }) {
  const dispatch  = useDispatch();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [isDownloaded,    setIsDownloaded]    = useState(false);
  const [downloading,     setDownloading]     = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); // 0–9
  const [promptVisible,   setPromptVisible]   = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    initApp();
  }, []);

  // ── On first launch: check download status, show prompt if not yet downloaded ──
  const initApp = async () => {
    try {
      const [downloaded, launched] = await Promise.all([
        AsyncStorage.getItem(GUIDES_DOWNLOAD_KEY),
        AsyncStorage.getItem(FIRST_LAUNCH_KEY),
      ]);
      const alreadyDownloaded = downloaded === 'true';
      setIsDownloaded(alreadyDownloaded);

      // Show prompt only on first launch and only if not yet downloaded
      if (!alreadyDownloaded && launched !== 'true') {
        // Small delay so the screen renders first
        setTimeout(() => setPromptVisible(true), 600);
      }
    } catch (_) {}
  };

  // ── Dismiss prompt and mark first launch done (without downloading) ──
  const dismissPrompt = async () => {
    setPromptVisible(false);
    try { await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true'); } catch (_) {}
  };

  // ── Animated download: step through each guide with a small delay ──────────
  const handleDownload = async (fromPrompt = false) => {
    if (isDownloaded) {
      Alert.alert(
        '✅ Already Downloaded',
        `All ${TOTAL_GUIDES} guides are saved on your device and work without internet.`,
        [
          { text: 'Remove Download', style: 'destructive', onPress: confirmRemove },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    if (fromPrompt) setPromptVisible(false);

    setDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate saving each guide one-by-one (assets are already bundled)
      for (let i = 1; i <= TOTAL_GUIDES; i++) {
        await new Promise(r => setTimeout(r, 200));
        setDownloadProgress(i);
      }
      await AsyncStorage.setItem(GUIDES_DOWNLOAD_KEY, 'true');
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      setIsDownloaded(true);
      Alert.alert(
        '✅ All Guides Saved!',
        `${TOTAL_GUIDES} first-aid guides are now on your device.\nThey will load instantly — even without internet or an account.`
      );
    } catch (_) {
      Alert.alert('Error', 'Could not save guides. Please try again.');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const confirmRemove = async () => {
    try {
      await AsyncStorage.removeItem(GUIDES_DOWNLOAD_KEY);
      setIsDownloaded(false);
    } catch (_) {}
  };

  const handleCall911 = () => {
    Alert.alert('🚨 Call 911', 'Do you want to call emergency services?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
    ]);
  };

  const handleSignUp = () => { dispatch(logout()); setTimeout(() => navigation.navigate('Register'), 100); };
  const handleLogIn  = () => { dispatch(logout()); };
  const handleLockedFeature = () => {
    Alert.alert('🔒 Sign In Required', 'Create a free account or log in to access this feature.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign In',  onPress: handleLogIn },
      { text: 'Register', onPress: handleSignUp },
    ]);
  };

  return (
    <>
      {/* ══ FIRST-LAUNCH DOWNLOAD PROMPT MODAL ══ */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissPrompt}
      >
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            {/* Icon */}
            <View style={styles.promptIconWrap}>
              <Ionicons name="download" size={32} color="#fff" />
            </View>

            <Text style={styles.promptTitle}>Save Guides for Offline Use</Text>
            <Text style={styles.promptDesc}>
              Download all {TOTAL_GUIDES} first-aid guides to your device so they're available anytime — even without internet or an account.
            </Text>

            {/* Guide preview chips */}
            <View style={styles.promptChips}>
              {GUIDE_PREVIEWS.map(g => (
                <View key={g.id} style={[styles.promptChip, { backgroundColor: g.color + '15', borderColor: g.color + '40' }]}>
                  <Ionicons name={g.icon} size={11} color={g.color} />
                  <Text style={[styles.promptChipText, { color: g.color }]}>{g.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.promptInfoRow}>
              <Ionicons name="checkmark-circle" size={14} color="#27ae60" />
              <Text style={styles.promptInfoText}>Free · No account needed · Works offline</Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.promptDownloadBtn}
              onPress={() => handleDownload(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="download" size={18} color="#fff" />
              <Text style={styles.promptDownloadBtnText}>Download Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.promptSkipBtn} onPress={dismissPrompt} activeOpacity={0.7}>
              <Text style={styles.promptSkipText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
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
            <View style={styles.hdrAuthRow}>
              <TouchableOpacity style={styles.hdrLoginBtn} onPress={handleLogIn} activeOpacity={0.85}>
                <Text style={styles.hdrLoginText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hdrRegisterBtn} onPress={handleSignUp} activeOpacity={0.85}>
                <Ionicons name="person-add-outline" size={13} color="#e74c3c" />
                <Text style={styles.hdrRegisterText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Welcome strip */}
        <Animated.View style={[styles.welcomeStrip, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.welcomeLeft}>
            <Ionicons name="hand-right" size={18} color="#e74c3c" />
            <Text style={styles.welcomeText}>Welcome! Explore free tools below.</Text>
          </View>
          <TouchableOpacity onPress={handleSignUp} activeOpacity={0.85}>
            <Text style={styles.welcomeLink}>Get full access →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Emergency */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16, marginTop: 20, marginBottom: 4 }}>
          <Text style={styles.sectionLabel}>EMERGENCY</Text>
          <Text style={styles.sectionTitle}>Quick Response</Text>
        </Animated.View>
        <Animated.View style={[styles.unifiedCard, { opacity: fadeAnim }]}>
          <View style={styles.cardHeaderStrip}>
            <Ionicons name="warning" size={14} color="#e74c3c" />
            <Text style={styles.cardHeaderText}>Always available — no sign-in needed</Text>
          </View>

          {/* Call 911 */}
          <TouchableOpacity style={styles.cardRow} onPress={handleCall911} activeOpacity={0.82}>
            <View style={[styles.rowIcon, { backgroundColor: '#e74c3c' }]}><Ionicons name="call" size={20} color="#fff" /></View>
            <View style={styles.rowText}><Text style={styles.rowTitle}>Call 911</Text><Text style={styles.rowSub}>Ambulance · Fire · Police</Text></View>
            <View style={[styles.rowBadge, { backgroundColor: '#fdecea' }]}><Text style={styles.rowBadgeText}>CALL</Text></View>
          </TouchableOpacity>
          <View style={styles.cardDivider} />

          {/* First Aid Guides */}
          <TouchableOpacity style={styles.cardRow} onPress={() => navigation.navigate('Guides')} activeOpacity={0.82}>
            <View style={[styles.rowIcon, { backgroundColor: '#2980b9' }]}><Ionicons name="medical" size={20} color="#fff" /></View>
            <View style={styles.rowText}><Text style={styles.rowTitle}>First Aid Guides</Text><Text style={styles.rowSub}>CPR, burns, choking & more — offline</Text></View>
            <View style={[styles.rowBadge, { backgroundColor: '#e8f4fb' }]}><Text style={styles.rowBadgeText}>FREE</Text></View>
          </TouchableOpacity>
          <View style={styles.cardDivider} />

          {/* Download Guides */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => handleDownload(false)}
            activeOpacity={0.82}
            disabled={downloading}
          >
            <View style={[styles.rowIcon, { backgroundColor: isDownloaded ? '#27ae60' : '#8e44ad' }]}>
              {downloading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name={isDownloaded ? 'checkmark-circle' : 'download'} size={20} color="#fff" />
              }
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {downloading
                  ? `Saving guides… ${downloadProgress}/${TOTAL_GUIDES}`
                  : isDownloaded ? 'Guides Downloaded' : 'Download Guides'
                }
              </Text>
              {/* Progress bar while downloading */}
              {downloading ? (
                <View style={styles.progressBarWrap}>
                  <View style={[styles.progressBarFill, { width: `${(downloadProgress / TOTAL_GUIDES) * 100}%` }]} />
                </View>
              ) : (
                <Text style={styles.rowSub}>
                  {isDownloaded
                    ? `${TOTAL_GUIDES} guides saved — works without internet`
                    : `Save all ${TOTAL_GUIDES} guides for offline use — no account needed`
                  }
                </Text>
              )}
            </View>
            {!downloading && (
              isDownloaded
                ? <View style={[styles.rowBadge, { backgroundColor: '#e9f7ef' }]}><Text style={[styles.rowBadgeText, { color: '#27ae60' }]}>SAVED</Text></View>
                : <View style={[styles.rowBadge, { backgroundColor: '#f5eef8' }]}><Text style={[styles.rowBadgeText, { color: '#8e44ad' }]}>FREE</Text></View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Free Tools */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 }}>
          <Text style={styles.sectionLabel}>FREE TOOLS</Text>
          <Text style={styles.sectionTitle}>Available to You</Text>
        </Animated.View>
        <Animated.View style={[styles.unifiedCard, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.cardRow} onPress={() => navigation.navigate('Hospital')} activeOpacity={0.82}>
            <View style={[styles.rowIcon, { backgroundColor: '#27ae60' }]}><Ionicons name="location" size={20} color="#fff" /></View>
            <View style={styles.rowText}><Text style={styles.rowTitle}>Nearby Hospitals</Text><Text style={styles.rowSub}>Find emergency care near you</Text></View>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.cardRow} onPress={() => navigation.navigate('Chatbot')} activeOpacity={0.82}>
            <View style={[styles.rowIcon, { backgroundColor: '#16a085' }]}><Ionicons name="chatbubbles" size={20} color="#fff" /></View>
            <View style={styles.rowText}><Text style={styles.rowTitle}>MediFirst AI</Text><Text style={styles.rowSub}>Ask any first aid question</Text></View>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
        </Animated.View>

        {/* Members Only */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 }}>
          <Text style={styles.sectionLabel}>MEMBERS ONLY</Text>
          <Text style={styles.sectionTitle}>Sign In to Unlock</Text>
        </Animated.View>
        <Animated.View style={[styles.unifiedCard, { opacity: fadeAnim }]}>
          <View style={styles.lockBanner}>
            <Ionicons name="lock-closed" size={13} color="#856404" />
            <Text style={styles.lockBannerText}>These features require a free account</Text>
          </View>
          {LOCKED_FEATURES.map((f, idx) => (
            <React.Fragment key={f.label}>
              <TouchableOpacity style={[styles.cardRow, { opacity: 0.7 }]} onPress={handleLockedFeature} activeOpacity={0.75}>
                <View style={[styles.rowIcon, { backgroundColor: f.bg }]}><Ionicons name={f.icon} size={20} color={f.color} /></View>
                <View style={styles.rowText}><Text style={[styles.rowTitle, { color: '#666' }]}>{f.label}</Text><Text style={styles.rowSub}>{f.sub}</Text></View>
                <Ionicons name="lock-closed" size={15} color="#ddd" />
              </TouchableOpacity>
              {idx < LOCKED_FEATURES.length - 1 && <View style={styles.cardDivider} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* Sign up promo */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16, marginTop: 24, marginBottom: 14 }}>
          <Text style={styles.sectionLabel}>WITH A FREE ACCOUNT</Text>
          <Text style={styles.sectionTitle}>Everything You Get</Text>
        </Animated.View>
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16 }}>
          <View style={styles.perkGrid}>
            {MEMBER_PERKS.map((p) => (
              <View key={p.label} style={styles.perkCard}>
                <View style={[styles.perkIconWrap, { backgroundColor: p.bg }]}><Ionicons name={p.icon} size={24} color={p.color} /></View>
                <Text style={styles.perkLabel}>{p.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.registerBtn} onPress={handleSignUp} activeOpacity={0.85}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.registerBtnText}>Create Free Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogIn} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>Already have an account?</Text>
            <Text style={styles.loginBtnHighlight}> Log In</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.tip}>
          <Ionicons name="information-circle" size={17} color="#f39c12" />
          <Text style={styles.tipText}>In any emergency, <Text style={{ fontWeight: '700' }}>call 911 first</Text> before attempting first aid.</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating chat button */}
      <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.navigate('Chatbot')} activeOpacity={0.85}>
        <Ionicons name="chatbubbles" size={26} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f7f8fa' },
  contentContainer: { paddingBottom: 20 },

  // ── Header ──
  appHeader:       { backgroundColor: '#e74c3c', elevation: 6, shadowColor: '#c0392b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 },
  hdrInner:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  hdrBrand:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdrLogoWrap:     { position: 'relative' },
  hdrLogoImg:      { width: 48, height: 48 },
  hdrPulseDot:     { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e74c3c' },
  hdrTitle:        { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  hdrSub:          { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontStyle: 'italic' },
  hdrAuthRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hdrLoginBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  hdrLoginText:    { fontSize: 13, fontWeight: '700', color: '#fff' },
  hdrRegisterBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: '#fff' },
  hdrRegisterText: { fontSize: 13, fontWeight: '700', color: '#e74c3c' },

  welcomeStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  welcomeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  welcomeText:  { fontSize: 12, color: '#555', fontWeight: '500' },
  welcomeLink:  { fontSize: 12, color: '#e74c3c', fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#c0392b', letterSpacing: 1.5, marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },

  unifiedCard:     { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeaderStrip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fef5f5', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#fce8e8' },
  cardHeaderText:  { fontSize: 11, color: '#c0392b', fontWeight: '700', letterSpacing: 0.4 },
  cardRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 13 },
  cardDivider:     { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  rowIcon:         { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  rowText:         { flex: 1 },
  rowTitle:        { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  rowSub:          { fontSize: 11, color: '#999', marginTop: 2 },
  rowBadge:        { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  rowBadgeText:    { fontSize: 11, fontWeight: '800', color: '#555', letterSpacing: 0.4 },

  // ── Progress bar ──
  progressBarWrap: { height: 4, backgroundColor: '#f0e6fc', borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  progressBarFill: { height: 4, backgroundColor: '#8e44ad', borderRadius: 4 },

  lockBanner:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fef9e7', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#fef0c0' },
  lockBannerText: { fontSize: 11, color: '#856404', fontWeight: '700' },

  perkGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 18 },
  perkCard:    { width: '30%', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5 },
  perkIconWrap:{ width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
  perkLabel:   { fontSize: 11, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', lineHeight: 15 },

  registerBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27ae60', borderRadius: 14, paddingVertical: 15, gap: 9, marginBottom: 10, elevation: 4 },
  registerBtnText:   { fontSize: 15, fontWeight: '800', color: '#fff' },
  loginBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: '#e0e0e0' },
  loginBtnText:      { fontSize: 14, color: '#888' },
  loginBtnHighlight: { fontSize: 14, fontWeight: '700', color: '#3498db' },

  tip:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fffbf0', marginHorizontal: 16, marginTop: 22, borderRadius: 12, padding: 14, gap: 10, borderLeftWidth: 4, borderLeftColor: '#f39c12' },
  tipText: { flex: 1, fontSize: 12, color: '#7d6608', lineHeight: 18 },

  floatingBtn: { position: 'absolute', bottom: 50, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#c0392b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },

  // ── First-launch download prompt ──
  promptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  promptCard:    { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 },

  promptIconWrap:  { width: 68, height: 68, borderRadius: 20, backgroundColor: '#8e44ad', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  promptTitle:     { fontSize: 20, fontWeight: '900', color: '#1a1a2e', textAlign: 'center', marginBottom: 10 },
  promptDesc:      { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  promptChips:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginBottom: 14 },
  promptChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  promptChipText:  { fontSize: 11, fontWeight: '700' },

  promptInfoRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  promptInfoText:  { fontSize: 12, color: '#27ae60', fontWeight: '600' },

  promptDownloadBtn:     { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#8e44ad', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 10, width: '100%', justifyContent: 'center', elevation: 4 },
  promptDownloadBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  promptSkipBtn:         { paddingVertical: 10 },
  promptSkipText:        { fontSize: 13, color: '#aaa', fontWeight: '600' },
});