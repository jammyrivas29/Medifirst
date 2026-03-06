import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Linking, Modal,
  SafeAreaView, StatusBar, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { logout } from '../../store/authSlice';
import api from '../../api/axiosConfig';

const BLOOD_TYPES    = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];
const URGENCY_COLORS = { critical: '#e74c3c', high: '#e67e22', medium: '#2980b9', low: '#27ae60' };

const getRecommendations = (profile) => {
  const recs = [];
  const bt         = profile?.medicalProfile?.bloodType;
  const allergies  = profile?.medicalProfile?.allergies || [];
  const conditions = profile?.medicalProfile?.medicalConditions || [];
  if (!bt || bt === 'Unknown') recs.push({ icon: 'water', color: '#e74c3c', title: 'Know Your Blood Type', desc: 'Knowing your blood type is critical in emergencies.', urgency: 'high' });
  if (allergies.length === 0) recs.push({ icon: 'alert-circle', color: '#e67e22', title: 'Document Allergies', desc: 'Recording allergies ensures emergency responders provide safe treatment.', urgency: 'medium' });
  if (conditions.some(c => c.toLowerCase().includes('diabetes'))) recs.push({ icon: 'fitness', color: '#2980b9', title: 'Diabetes First Aid Kit', desc: 'Keep glucose tablets, glucagon, and your medical ID accessible.', urgency: 'high' });
  if (conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'))) recs.push({ icon: 'heart', color: '#e74c3c', title: 'Hypertension Awareness', desc: 'Learn to recognize hypertensive crisis: severe headache, chest pain, blurred vision.', urgency: 'high' });
  if (conditions.some(c => c.toLowerCase().includes('asthma'))) recs.push({ icon: 'medical', color: '#8e44ad', title: 'Asthma Action Plan', desc: 'Always carry your inhaler. Learn triggers and have a written action plan.', urgency: 'high' });
  if (conditions.some(c => c.toLowerCase().includes('heart'))) recs.push({ icon: 'pulse', color: '#e74c3c', title: 'Cardiac Emergency Prep', desc: 'Inform household members of your condition. Keep nitroglycerin accessible.', urgency: 'high' });
  if (allergies.some(a => ['peanut','bee','shellfish'].some(k => a.toLowerCase().includes(k)))) recs.push({ icon: 'warning', color: '#c0392b', title: 'Carry an EpiPen', desc: 'Severe allergies can cause anaphylaxis. Always have an epinephrine auto-injector.', urgency: 'critical' });
  recs.push({ icon: 'people', color: '#27ae60', title: 'Add Emergency Contacts', desc: 'Ensure at least 2 to 3 emergency contacts are saved for responders.', urgency: 'medium' });
  recs.push({ icon: 'book', color: '#2980b9', title: 'Learn CPR', desc: 'CPR is the most important life-saving skill. Take a certified course.', urgency: 'medium' });
  return recs.slice(0, 5);
};

// ── Shared Modal Header ───────────────────────────────────────────────────────
function ModalHeader({ title, onClose }) {
  return (
    <View style={mS.header}>
      <TouchableOpacity onPress={onClose} style={mS.backBtn}>
        <Ionicons name="chevron-back" size={20} color="#333" />
      </TouchableOpacity>
      <Text style={mS.title}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}
const mS = StyleSheet.create({
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  title:   { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
});

// ── Privacy Modal ─────────────────────────────────────────────────────────────
function PrivacyModal({ visible, onClose }) {
  const sections = [
    { h: '1. Information We Collect', t: 'MediFirst collects personal information you provide directly, including your name, email address, phone number, and medical profile data. We also collect emergency contact information you choose to add.' },
    { h: '2. How We Use Your Information', t: 'Your information is used solely to provide the MediFirst first aid and emergency assistance features. Medical profile data helps personalize health recommendations.' },
    { h: '3. Data Storage & Security', t: 'All personal data is stored securely on encrypted servers. We use industry-standard security measures including HTTPS encryption and secure authentication tokens.' },
    { h: '4. Data Sharing', t: 'We do not sell, trade, or share your personal information with third parties for marketing purposes.' },
    { h: '5. Location Data', t: 'MediFirst requests location access only when you use the Send My Location feature. Location data is not stored on our servers.' },
    { h: '6. Medical Information', t: 'Medical profile data is stored to provide personalized first aid guidance. This information is never shared with insurance companies, employers, or third parties.' },
    { h: '7. Your Rights', t: 'You have the right to access, correct, or delete your personal data at any time.' },
    { h: '8. Contact Us', t: 'Questions? Contact us at: medifirst.help@gmail.com' },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ModalHeader title="Privacy Policy" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {sections.map((s, i) => (
            <View key={i} style={{ marginBottom: 22 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 }}>{s.h}</Text>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: 21 }}>{s.t}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── About Modal ───────────────────────────────────────────────────────────────
function AboutModal({ visible, onClose }) {
  const features = [
    { icon: 'medical',       color: '#e74c3c', bg: '#fdecea', title: 'First Aid Guides',   desc: 'Step-by-step emergency protocols' },
    { icon: 'chatbubbles',   color: '#16a085', bg: '#e8f8f5', title: 'AI Assistant',       desc: 'Instant first aid answers' },
    { icon: 'location',      color: '#27ae60', bg: '#e9f7ef', title: 'Hospital Locator',   desc: 'Find nearby emergency care' },
    { icon: 'call',          color: '#2980b9', bg: '#e8f4fb', title: 'Emergency Hotlines', desc: 'One-tap 911 and crisis lines' },
    { icon: 'people',        color: '#8e44ad', bg: '#f5eef8', title: 'Emergency Contacts', desc: 'Save and call contacts fast' },
    { icon: 'person-circle', color: '#d35400', bg: '#fef5ec', title: 'Medical Profile',    desc: 'Blood type, allergies and conditions' },
    { icon: 'send',          color: '#c0392b', bg: '#fdecea', title: 'GPS Location Share', desc: 'SMS your location to contacts' },
    { icon: 'play-circle',   color: '#f39c12', bg: '#fef9e7', title: 'Video Tutorials',    desc: 'Watch first aid demonstrations' },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ModalHeader title="About MediFirst" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Image source={require('../../../assets/logo2.png')} style={{ width: 100, height: 100, marginBottom: 14 }} resizeMode="contain" />
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#1a1a2e' }}>MediFirst</Text>
            <Text style={{ fontSize: 12, color: '#e74c3c', fontWeight: '700', marginTop: 4 }}>First Aid & Emergency Assistant</Text>
            <Text style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Version 1.0.0</Text>
          </View>
          <View style={{ height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 }} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 14 }}>Key Features</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {features.map((f, i) => (
              <View key={i} style={{ width: '46%', backgroundColor: f.bg, borderRadius: 14, padding: 14, alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: f.color + '22', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1a2e' }}>{f.title}</Text>
                <Text style={{ fontSize: 11, color: '#777', marginTop: 3, lineHeight: 16 }}>{f.desc}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 24 }}>MediFirst v1.0.0 — © 2026 All rights reserved.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Edit Account Modal ────────────────────────────────────────────────────────
function EditAccountModal({ visible, onClose, user, onSaved }) {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName,  setLastName]  = useState(user?.lastName  || '');
  const [email,     setEmail]     = useState(user?.email     || '');
  const [phone,     setPhone]     = useState(user?.phoneNumber || '');
  const [saving,    setSaving]    = useState(false);
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { Alert.alert('Missing Fields', 'First and last name are required.'); return; }
    if (!isValidEmail(email)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    try {
      setSaving(true);
      await api.put('/user/profile', { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), phoneNumber: phone.trim() });
      Alert.alert('Saved', 'Your account has been updated.');
      onSaved(); onClose();
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed to update account.'); }
    finally { setSaving(false); }
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ModalHeader title="Edit Account" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24 }} keyboardShouldPersistTaps="handled">
          {[
            { label: 'First Name',    value: firstName, set: setFirstName, icon: 'person-outline',  kbType: 'default',       cap: 'words', maxLen: 50  },
            { label: 'Last Name',     value: lastName,  set: setLastName,  icon: 'person-outline',  kbType: 'default',       cap: 'words', maxLen: 50  },
            { label: 'Email Address', value: email,     set: setEmail,     icon: 'mail-outline',    kbType: 'email-address', cap: 'none',  maxLen: 100 },
          ].map(({ label, value, set, icon, kbType, cap, maxLen }) => (
            <View key={label} style={{ marginBottom: 14 }}>
              <Text style={eS.label}>{label}</Text>
              <View style={eS.inputRow}>
                <Ionicons name={icon} size={17} color="#ccc" style={{ marginRight: 10 }} />
                <TextInput style={eS.input} value={value} onChangeText={set} keyboardType={kbType} autoCapitalize={cap} autoCorrect={false} maxLength={maxLen} />
                {value.trim() ? <Ionicons name="checkmark-circle" size={16} color="#27ae60" /> : null}
              </View>
            </View>
          ))}
          <Text style={eS.label}>Phone Number</Text>
          <View style={[eS.inputRow, { marginBottom: 24 }]}>
            <Ionicons name="call-outline" size={17} color="#ccc" style={{ marginRight: 10 }} />
            <TextInput style={eS.input} value={phone} onChangeText={v => setPhone(v.replace(/\D/g,'').slice(0,11))} keyboardType="number-pad" maxLength={11} placeholder="09XXXXXXXXX (optional)" placeholderTextColor="#ccc" />
            {phone.length === 11 ? <Ionicons name="checkmark-circle" size={16} color="#27ae60" /> : phone.length > 0 ? <Text style={{ fontSize: 11, color: '#f39c12', fontWeight: '700' }}>{phone.length}/11</Text> : null}
          </View>
          <TouchableOpacity style={eS.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={eS.saveBtnText}>Save Changes</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const eS = StyleSheet.create({
  label:      { fontSize: 11, fontWeight: '700', color: '#999', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1.5, borderColor: '#eee' },
  input:      { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1a1a2e' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e74c3c', paddingVertical: 16, borderRadius: 14, elevation: 4, shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId   = user?._id || user?.id || 'guest';

  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);
  const [bloodType, setBloodType]       = useState('Unknown');
  const [allergies, setAllergies]       = useState('');
  const [conditions, setConditions]     = useState('');
  const [saving, setSaving]             = useState(false);
  const [activeTab, setActiveTab]       = useState('profile');
  const [callHistory, setCallHistory]   = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [showAbout, setShowAbout]       = useState(false);
  const [showEdit, setShowEdit]         = useState(false);

  const CALL_KEY  = `medifirst_call_history_${userId}`;
  const PHOTO_KEY = `medifirst_profile_image_${userId}`;

  useEffect(() => { fetchProfile(); loadPhoto(); }, []);
  useFocusEffect(useCallback(() => { loadCalls(); }, [userId]));

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setProfile(res.data.user);
      setBloodType(res.data.user.medicalProfile?.bloodType || 'Unknown');
      setAllergies((res.data.user.medicalProfile?.allergies || []).join(', '));
      setConditions((res.data.user.medicalProfile?.medicalConditions || []).join(', '));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  const loadCalls = async () => {
    try { const r = await AsyncStorage.getItem(CALL_KEY); if (r) setCallHistory(JSON.parse(r)); } catch (_) {}
  };
  const loadPhoto = async () => {
    try { const s = await AsyncStorage.getItem(PHOTO_KEY); if (s) setProfileImage(s); } catch (_) {}
  };

  const pickPhoto = () => {
    if (profileImage) {
      Alert.alert('Profile Photo', 'What would you like to do?', [
        { text: 'Change Photo', onPress: showPhotoOptions },
        { text: 'Remove Photo', style: 'destructive', onPress: confirmRemovePhoto },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else { showPhotoOptions(); }
  };
  const showPhotoOptions = () => Alert.alert('Select Photo', 'Choose source', [
    { text: 'Take Photo', onPress: openCamera },
    { text: 'Choose from Gallery', onPress: openGallery },
    { text: 'Cancel', style: 'cancel' },
  ]);
  const confirmRemovePhoto = () => Alert.alert('Remove Photo', 'Remove your profile photo?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: removePhoto },
  ]);
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera access is required.'); return; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 });
    if (!r.canceled) savePhoto(r.assets[0].uri);
  };
  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'Gallery access is required.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 });
    if (!r.canceled) savePhoto(r.assets[0].uri);
  };
  const savePhoto   = async (uri) => { setProfileImage(uri); try { await AsyncStorage.setItem(PHOTO_KEY, uri); } catch (_) {} };
  const removePhoto = async ()    => { setProfileImage(null); try { await AsyncStorage.removeItem(PHOTO_KEY); } catch (_) {} };

  const logCall = async (number, label) => {
    const entry   = { number, label, timestamp: new Date().toISOString(), id: Date.now().toString() };
    const updated = [entry, ...callHistory].slice(0, 50);
    setCallHistory(updated);
    try { await AsyncStorage.setItem(CALL_KEY, JSON.stringify(updated)); } catch (_) {}
    Linking.openURL('tel:' + number);
  };
  const clearCalls = () => Alert.alert('Clear History', 'Remove all call history?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: async () => { setCallHistory([]); await AsyncStorage.removeItem(CALL_KEY); } },
  ]);
  const saveMedical = async () => {
    try {
      setSaving(true);
      await api.put('/user/medical-profile', {
        bloodType,
        allergies:         allergies.split(',').map(a => a.trim()).filter(Boolean),
        medicalConditions: conditions.split(',').map(c => c.trim()).filter(Boolean),
      });
      await fetchProfile(); setEditing(false);
      Alert.alert('Saved', 'Medical profile updated successfully.');
    } catch { Alert.alert('Error', 'Failed to update profile.'); }
    finally { setSaving(false); }
  };
  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
  ]);
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#e74c3c" /><Text style={s.loadingText}>Loading profile...</Text></View>
  );

  const recs        = getRecommendations(profile);
  const initials    = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase();
  const allergyList = profile?.medicalProfile?.allergies || [];
  const condList    = profile?.medicalProfile?.medicalConditions || [];

  const TABS = [
    { key: 'profile',  label: 'Medical',  icon: 'medical'            },
    { key: 'contacts', label: 'Contacts', icon: 'people'             },
    { key: 'history',  label: 'History',  icon: 'time'               },
    { key: 'tips',     label: 'Tips',     icon: 'bulb'               },
    { key: 'more',     label: 'More',     icon: 'ellipsis-horizontal' },
  ];

  return (
    <View style={s.root}>
      {/* ══ HEADER ══ */}
      <View style={[s.header, { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 44 }]}>
        <View style={s.hdrContent}>
          {/* Avatar */}
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={s.avatarWrap}>
            {profileImage
              ? <Image source={{ uri: profileImage }} style={s.avatarImg} />
              : <View style={s.avatarFallback}><Text style={s.avatarInitials}>{initials}</Text></View>
            }
            <View style={s.cameraPin}><Ionicons name="camera" size={8} color="#fff" /></View>
          </TouchableOpacity>

          {/* Name / email */}
          <View style={s.hdrMeta}>
            <Text style={s.hdrName} numberOfLines={1}>{user?.firstName} {user?.lastName}</Text>
            <Text style={s.hdrEmail} numberOfLines={1}>{user?.email}</Text>
            <View style={s.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={9} color="#fff" />
              <Text style={s.verifiedText}>Verified Member</Text>
            </View>
          </View>

          {/* Edit + Sign Out */}
          <View style={s.hdrActions}>
            <TouchableOpacity style={s.hdrEditBtn} onPress={() => setShowEdit(true)} activeOpacity={0.85}>
              <Ionicons name="pencil" size={12} color="#e74c3c" />
              <Text style={s.hdrEditTxt}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.hdrSignOutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={s.hdrSignOutTxt}>Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Private strip */}
        <View style={s.privacyStrip}>
          <View style={s.privacyDot} />
          <Text style={s.privacyText}>Your medical data is private and encrypted</Text>
        </View>
      </View>

      {/* ══ STATS ══ */}
      <View style={s.statsRow}>
        {[
          { n: callHistory.length,  label: 'Calls',      icon: 'call',         color: '#8e44ad', bg: '#f5eef8' },
          { n: recs.length,          label: 'Tips',        icon: 'bulb',         color: '#f39c12', bg: '#fef9e7' },
          { n: allergyList.length,   label: 'Allergies',   icon: 'alert-circle', color: '#e74c3c', bg: '#fdecea' },
          { n: condList.length,      label: 'Conditions',  icon: 'fitness',      color: '#2980b9', bg: '#e8f4fb' },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={s.statCell}>
              <View style={[s.statIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={14} color={item.color} />
              </View>
              <Text style={[s.statNum, { color: item.color }]}>{item.n}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={s.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* ══ TABS ══ */}
      <View style={s.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={s.tab} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
              <View style={[s.tabIconWrap, active && s.tabIconWrapOn]}>
                <Ionicons name={tab.icon} size={17} color={active ? '#e74c3c' : '#c0c0c0'} />
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelOn]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ CONTENT ══ */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>

        {/* ── MEDICAL TAB ── */}
        {activeTab === 'profile' && (
          <View>
            {/* Section header */}
            <View style={s.secHeader}>
              <Text style={s.secLabel}>Medical Profile</Text>
              <TouchableOpacity
                style={[s.editToggle, editing && s.editToggleOn]}
                onPress={() => setEditing(!editing)}
              >
                <Ionicons name={editing ? 'close' : 'create-outline'} size={14} color={editing ? '#fff' : '#666'} />
                <Text style={[s.editToggleTxt, editing && { color: '#fff' }]}>{editing ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>

            {/* ── 3 Feature Cards — icon at TOP ── */}
            {/* Blood Type */}
            <View style={s.featureCard}>
              <View style={[s.featureCardIcon, { backgroundColor: '#fdecea' }]}>
                <Ionicons name="water" size={22} color="#e74c3c" />
              </View>
              <Text style={s.featureCardTitle}>Blood Type</Text>
              {editing ? (
                <View style={s.bloodGrid}>
                  {BLOOD_TYPES.map(bt => (
                    <TouchableOpacity key={bt} style={[s.btChip, bloodType === bt && s.btChipOn]} onPress={() => setBloodType(bt)}>
                      <Text style={[s.btChipTxt, bloodType === bt && s.btChipTxtOn]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={s.btDisplay}>
                  <View style={s.btBig}><Text style={s.btBigTxt}>{profile?.medicalProfile?.bloodType || '—'}</Text></View>
                  <Text style={s.btHint}>{(!profile?.medicalProfile?.bloodType || profile.medicalProfile.bloodType === 'Unknown') ? 'Tap Edit to record' : 'On record'}</Text>
                </View>
              )}
            </View>

            {/* Allergies */}
            <View style={s.featureCard}>
              <View style={[s.featureCardIcon, { backgroundColor: '#fef5ec' }]}>
                <Ionicons name="alert-circle" size={22} color="#e67e22" />
              </View>
              <Text style={s.featureCardTitle}>Allergies</Text>
              {editing
                ? <TextInput style={s.textArea} value={allergies} onChangeText={setAllergies} placeholder="e.g. Peanuts, Penicillin (comma separated)" placeholderTextColor="#ccc" multiline />
                : allergyList.length
                  ? <View style={s.tagWrap}>{allergyList.map((a, i) => <View key={i} style={[s.tag, { backgroundColor: '#fef5ec', borderColor: '#fde3c8' }]}><Ionicons name="alert-circle" size={10} color="#e67e22" /><Text style={[s.tagTxt, { color: '#e67e22' }]}>{a}</Text></View>)}</View>
                  : <Text style={s.nilTxt}>No allergies recorded</Text>
              }
            </View>

            {/* Conditions */}
            <View style={s.featureCard}>
              <View style={[s.featureCardIcon, { backgroundColor: '#e8f4fb' }]}>
                <Ionicons name="fitness" size={22} color="#2980b9" />
              </View>
              <Text style={s.featureCardTitle}>Medical Conditions</Text>
              {editing
                ? <TextInput style={s.textArea} value={conditions} onChangeText={setConditions} placeholder="e.g. Diabetes, Hypertension (comma separated)" placeholderTextColor="#ccc" multiline />
                : condList.length
                  ? <View style={s.tagWrap}>{condList.map((c, i) => <View key={i} style={[s.tag, { backgroundColor: '#e8f4fb', borderColor: '#c5dff1' }]}><Ionicons name="fitness" size={10} color="#2980b9" /><Text style={[s.tagTxt, { color: '#2980b9' }]}>{c}</Text></View>)}</View>
                  : <Text style={s.nilTxt}>No conditions recorded</Text>
              }
            </View>

            {editing && (
              <TouchableOpacity style={s.saveBtn} onPress={saveMedical} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={s.saveBtnTxt}>Save Medical Profile</Text></>}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab === 'contacts' && <EmergencyContactsTab logCall={logCall} />}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <View>
            <View style={s.secHeader}>
              <Text style={s.secLabel}>Call History</Text>
              {callHistory.length > 0 && (
                <TouchableOpacity style={s.clearBtn} onPress={clearCalls}>
                  <Ionicons name="trash-outline" size={13} color="#e74c3c" />
                  <Text style={s.clearBtnTxt}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {callHistory.length === 0 ? (
              <View style={s.emptyState}>
                <View style={[s.emptyIconBox, { backgroundColor: '#f5eef8' }]}>
                  <Ionicons name="call-outline" size={32} color="#8e44ad" />
                </View>
                <Text style={s.emptyTitle}>No Calls Yet</Text>
                <Text style={s.emptyDesc}>Calls made through this app will appear here.</Text>
              </View>
            ) : (
              callHistory.map(e => (
                <View key={e.id} style={s.histCard}>
                  <View style={s.histIcon}>
                    <Ionicons name="call" size={16} color="#8e44ad" />
                  </View>
                  <View style={s.histBody}>
                    <Text style={s.histName}>{e.label}</Text>
                    <Text style={s.histNum}>{e.number}</Text>
                    <Text style={s.histTime}>{fmtDate(e.timestamp)}</Text>
                  </View>
                  <TouchableOpacity style={s.histCallBtn} onPress={() => logCall(e.number, e.label)}>
                    <Ionicons name="call" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TIPS TAB ── */}
        {activeTab === 'tips' && (
          <View>
            <View style={s.secHeader}>
              <Text style={s.secLabel}>Health Tips</Text>
            </View>
            <Text style={s.tipsSub}>Personalized based on your medical profile</Text>
            {recs.map((rec, i) => (
              <View key={i} style={s.featureCard}>
                {/* Icon at TOP */}
                <View style={[s.featureCardIcon, { backgroundColor: URGENCY_COLORS[rec.urgency] + '18' }]}>
                  <Ionicons name={rec.icon} size={22} color={URGENCY_COLORS[rec.urgency]} />
                </View>
                <View style={s.recHeadRow}>
                  <Text style={s.featureCardTitle}>{rec.title}</Text>
                  <View style={[s.urgencyBadge, { backgroundColor: URGENCY_COLORS[rec.urgency] }]}>
                    <Text style={s.urgencyBadgeTxt}>{rec.urgency?.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={s.recDesc}>{rec.desc}</Text>
              </View>
            ))}
            {/* Safety reminders */}
            <View style={s.featureCard}>
              <View style={[s.featureCardIcon, { backgroundColor: '#e9f7ef' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#27ae60" />
              </View>
              <Text style={s.featureCardTitle}>General Safety Reminders</Text>
              {['Always call 911 first in a life-threatening emergency.','Keep a first aid kit at home, in your car, and at work.','Inform household members of your medical conditions.','Renew your first aid training every 2 years.','Know the location of the nearest emergency department.'].map((tip, i) => (
                <View key={i} style={s.safetyRow}>
                  <View style={s.safetyDot} />
                  <Text style={s.safetyTxt}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── MORE TAB ── */}
        {activeTab === 'more' && (
          <View>
            {/* ACCOUNT */}
            <Text style={s.groupLabel}>ACCOUNT</Text>
            <View style={s.menuCard}>
              {[
                { icon: 'person',  bg: '#fdecea', color: '#e74c3c', title: 'Edit Account',        sub: 'Update name, email and phone',       onPress: () => setShowEdit(true) },
                { icon: 'camera',  bg: '#e8f4fb', color: '#2980b9', title: 'Change Profile Photo', sub: 'Take a photo or choose from gallery', onPress: pickPhoto },
              ].map((row, i) => (
                <React.Fragment key={row.title}>
                  {i > 0 && <View style={s.menuDivider} />}
                  <TouchableOpacity style={s.menuRow} onPress={row.onPress} activeOpacity={0.75}>
                    <View style={[s.menuIconBox, { backgroundColor: row.bg }]}>
                      <Ionicons name={row.icon} size={18} color={row.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.menuTitle}>{row.title}</Text>
                      <Text style={s.menuSub}>{row.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#ddd" />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            {/* APP INFO */}
            <Text style={s.groupLabel}>APP INFO</Text>
            <View style={s.menuCard}>
              {[
                { icon: 'information-circle', bg: '#e8f8f5', color: '#16a085', title: 'About MediFirst', sub: 'Features, version and mission',  onPress: () => setShowAbout(true) },
                { icon: 'shield-checkmark',   bg: '#f5eef8', color: '#8e44ad', title: 'Privacy Policy',  sub: 'How we handle your data',         onPress: () => setShowPrivacy(true) },
                { icon: 'mail',               bg: '#fef9e7', color: '#f39c12', title: 'Contact Support', sub: 'medifirst.help@gmail.com',         onPress: () => Linking.openURL('mailto:medifirst.help@gmail.com') },
              ].map((row, i) => (
                <React.Fragment key={row.title}>
                  {i > 0 && <View style={s.menuDivider} />}
                  <TouchableOpacity style={s.menuRow} onPress={row.onPress} activeOpacity={0.75}>
                    <View style={[s.menuIconBox, { backgroundColor: row.bg }]}>
                      <Ionicons name={row.icon} size={18} color={row.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.menuTitle}>{row.title}</Text>
                      <Text style={s.menuSub}>{row.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#ddd" />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            {/* DANGER ZONE */}
            <Text style={s.groupLabel}>SESSION</Text>
            <View style={s.menuCard}>
              <TouchableOpacity style={s.menuRow} onPress={handleLogout} activeOpacity={0.75}>
                <View style={[s.menuIconBox, { backgroundColor: '#fdecea' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.menuTitle, { color: '#e74c3c' }]}>Sign Out</Text>
                  <Text style={s.menuSub}>You can sign back in anytime</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={s.versionNote}>MediFirst v1.0.0 — 2026 — Made with care for your safety</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PrivacyModal   visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <AboutModal     visible={showAbout}   onClose={() => setShowAbout(false)} />
      <EditAccountModal visible={showEdit}  onClose={() => setShowEdit(false)} user={user} onSaved={fetchProfile} />
    </View>
  );
}

// ── EMERGENCY CONTACTS TAB ────────────────────────────────────────────────────
function EmergencyContactsTab({ logCall }) {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', relationship: '', phoneNumber: '' });
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchContacts(); }, []);
  const fetchContacts = async () => {
    try { const r = await api.get('/user/emergency-contacts'); setContacts(r.data.contacts || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const addContact = async () => {
    if (!form.name.trim() || !form.relationship.trim() || !form.phoneNumber.trim()) { Alert.alert('Missing Fields', 'Please fill in all fields.'); return; }
    try {
      setSaving(true);
      await api.post('/user/emergency-contacts', form);
      await fetchContacts(); setForm({ name: '', relationship: '', phoneNumber: '' }); setShowForm(false);
    } catch { Alert.alert('Error', 'Failed to add contact.'); } finally { setSaving(false); }
  };
  const deleteContact = (id, name) => Alert.alert('Remove Contact', 'Remove ' + name + '?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { await api.delete('/user/emergency-contacts/' + id); fetchContacts(); } },
  ]);

  const AVATAR_COLORS = { mom:'#e74c3c', dad:'#e74c3c', mother:'#e74c3c', father:'#e74c3c', spouse:'#8e44ad', wife:'#8e44ad', husband:'#8e44ad', friend:'#2980b9', sibling:'#27ae60', brother:'#27ae60', sister:'#27ae60' };
  const getInitials   = (n) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const getColor      = (rel) => AVATAR_COLORS[rel?.toLowerCase()] || '#e74c3c';

  if (loading) return <View style={s.center}><ActivityIndicator size="small" color="#e74c3c" /></View>;

  return (
    <View>
      <View style={s.secHeader}>
        <Text style={s.secLabel}>Emergency Contacts</Text>
        <TouchableOpacity style={[s.addBtn, showForm && { backgroundColor: '#aaa' }]} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={14} color="#fff" />
          <Text style={s.addBtnTxt}>{showForm ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={s.featureCard}>
          {/* Icon at TOP */}
          <View style={[s.featureCardIcon, { backgroundColor: '#e8f4fb' }]}>
            <Ionicons name="person-add" size={22} color="#2980b9" />
          </View>
          <Text style={s.featureCardTitle}>New Emergency Contact</Text>
          {[
            { val: form.name,         key: 'name',         ph: 'Full Name *',                        kb: 'default'   },
            { val: form.relationship, key: 'relationship',  ph: 'Relationship (e.g. Mom, Spouse) *',  kb: 'default'   },
            { val: form.phoneNumber,  key: 'phoneNumber',   ph: 'Phone Number *',                     kb: 'phone-pad' },
          ].map(f => (
            <TextInput key={f.key} style={s.textArea} value={f.val} onChangeText={v => setForm({...form,[f.key]:v})} placeholder={f.ph} placeholderTextColor="#ccc" keyboardType={f.kb} />
          ))}
          <TouchableOpacity style={s.saveBtn} onPress={addContact} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="person-add" size={14} color="#fff" /><Text style={s.saveBtnTxt}>Add Contact</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {contacts.length === 0 && !showForm ? (
        <View style={s.emptyState}>
          <View style={[s.emptyIconBox, { backgroundColor: '#e8f4fb' }]}>
            <Ionicons name="people-outline" size={32} color="#2980b9" />
          </View>
          <Text style={s.emptyTitle}>No Contacts Yet</Text>
          <Text style={s.emptyDesc}>Add emergency contacts so responders can reach your family.</Text>
          <TouchableOpacity style={[s.saveBtn, { marginTop: 20, paddingHorizontal: 28 }]} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={14} color="#fff" /><Text style={s.saveBtnTxt}>Add First Contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        contacts.map(c => (
          <View key={c._id} style={s.contactCard}>
            {/* Colored avatar */}
            <View style={[s.contactAvatar, { backgroundColor: getColor(c.relationship) }]}>
              <Text style={s.contactAvatarTxt}>{getInitials(c.name)}</Text>
            </View>
            <View style={s.contactBody}>
              <Text style={s.contactName}>{c.name}</Text>
              <View style={s.contactMeta}>
                <Ionicons name="heart-outline" size={10} color="#ccc" />
                <Text style={s.contactRel}>{c.relationship}</Text>
              </View>
              <View style={s.contactMeta}>
                <Ionicons name="call-outline" size={10} color="#e74c3c" />
                <Text style={s.contactPhone}>{c.phoneNumber}</Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={s.callBtn} onPress={() => logCall(c.phoneNumber, c.name)}>
                <Ionicons name="call" size={14} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtn} onPress={() => deleteContact(c._id, c.name)}>
                <Ionicons name="trash-outline" size={14} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f0f2f5' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  loadingText: { marginTop: 10, color: '#999', fontSize: 14 },

  // ── HEADER ──
  header:       { backgroundColor: '#e74c3c', elevation: 6, shadowColor: '#c0392b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  hdrContent:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 12 },

  avatarWrap:     { position: 'relative' },
  avatarImg:      { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarFallback: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 18, fontWeight: '900', color: '#fff' },
  cameraPin:      { position: 'absolute', bottom: -3, right: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e74c3c' },

  hdrMeta:       { flex: 1 },
  hdrName:       { fontSize: 15, fontWeight: '900', color: '#fff', marginBottom: 2 },
  hdrEmail:      { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginBottom: 5, fontStyle: 'italic' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  verifiedText:  { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  hdrActions:    { gap: 6 },
  hdrEditBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  hdrEditTxt:    { fontSize: 10, fontWeight: '800', color: '#e74c3c' },
  hdrSignOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  hdrSignOutTxt: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },

  privacyStrip:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.12)', paddingHorizontal: 16, paddingVertical: 8 },
  privacyDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ecc71' },
  privacyText:   { fontSize: 10, color: 'rgba(255,255,255,0.88)', fontWeight: '600', flex: 1 },

  // ── STATS ──
  statsRow:    { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14, borderRadius: 18, paddingVertical: 14, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  statCell:    { flex: 1, alignItems: 'center', gap: 3 },
  statIconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statNum:     { fontSize: 17, fontWeight: '900' },
  statLabel:   { fontSize: 9, color: '#aaa', fontWeight: '600' },
  statDivider: { width: 1, height: 28, backgroundColor: '#f0f0f0' },

  // ── TAB BAR ──
  tabBar:       { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ececec', elevation: 2, marginTop: 12 },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabIconWrap:  { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tabIconWrapOn:{ backgroundColor: '#fdecea' },
  tabLabel:     { fontSize: 9, fontWeight: '600', color: '#bbb' },
  tabLabelOn:   { color: '#e74c3c', fontWeight: '800' },

  scroll:    { flex: 1 },
  scrollPad: { padding: 14, paddingTop: 18 },

  // ── SECTION HEADER ──
  secHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  secLabel:  { fontSize: 17, fontWeight: '900', color: '#1a1a2e' },

  editToggle:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0f0f0', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  editToggleOn:  { backgroundColor: '#e74c3c' },
  editToggleTxt: { fontSize: 12, fontWeight: '700', color: '#555' },

  // ── FEATURE CARD (icon at top) ──
  featureCard:     { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  featureCardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureCardTitle:{ fontSize: 15, fontWeight: '900', color: '#1a1a2e', marginBottom: 10 },

  // Blood type display
  btDisplay: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btBig:     { width: 58, height: 58, borderRadius: 16, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f5c6c6' },
  btBigTxt:  { fontSize: 20, fontWeight: '900', color: '#e74c3c' },
  btHint:    { fontSize: 12, color: '#aaa', flex: 1, lineHeight: 18 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btChip:    { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#e8e8e8', backgroundColor: '#fafafa' },
  btChipOn:  { borderColor: '#e74c3c', backgroundColor: '#fdecea' },
  btChipTxt: { fontSize: 13, fontWeight: '600', color: '#aaa' },
  btChipTxtOn: { color: '#e74c3c', fontWeight: '900' },

  // Tags
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagTxt:  { fontSize: 12, fontWeight: '600' },
  nilTxt:  { fontSize: 13, color: '#ccc', fontStyle: 'italic' },

  textArea: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa', marginBottom: 10, textAlignVertical: 'top', minHeight: 60 },

  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e74c3c', paddingVertical: 15, borderRadius: 14, elevation: 4, shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Tips tab
  tipsSub:      { fontSize: 12, color: '#aaa', marginBottom: 14, fontStyle: 'italic' },
  recHeadRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgencyBadgeTxt:{ color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  recDesc:      { fontSize: 13, color: '#666', lineHeight: 20 },

  safetyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  safetyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#27ae60', marginTop: 6 },
  safetyTxt: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },

  // More tab
  groupLabel: { fontSize: 10, fontWeight: '800', color: '#bbb', letterSpacing: 1.5, marginBottom: 10, marginTop: 8, paddingHorizontal: 2 },
  menuCard:   { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  menuRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  menuDivider:{ height: 1, backgroundColor: '#f5f5f5', marginHorizontal: 16 },
  menuIconBox:{ width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  menuTitle:  { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  menuSub:    { fontSize: 11, color: '#aaa' },
  versionNote:{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 10 },

  // History
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fdecea', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  clearBtnTxt: { color: '#e74c3c', fontSize: 12, fontWeight: '700' },
  histCard:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  histIcon:    { width: 42, height: 42, borderRadius: 13, backgroundColor: '#f5eef8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  histBody:    { flex: 1 },
  histName:    { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  histNum:     { fontSize: 12, color: '#8e44ad', fontWeight: '600', marginVertical: 2 },
  histTime:    { fontSize: 11, color: '#bbb' },
  histCallBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#8e44ad', justifyContent: 'center', alignItems: 'center' },

  // Contacts
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e74c3c', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  addBtnTxt:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  contactCard:     { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  contactAvatar:   { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contactAvatarTxt:{ color: '#fff', fontWeight: '900', fontSize: 15 },
  contactBody:     { flex: 1 },
  contactName:     { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  contactMeta:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  contactRel:      { fontSize: 11, color: '#aaa' },
  contactPhone:    { fontSize: 12, color: '#e74c3c', fontWeight: '700' },
  callBtn:         { width: 34, height: 34, borderRadius: 11, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  delBtn:          { width: 34, height: 34, borderRadius: 11, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center' },

  // Empty states
  emptyState:  { alignItems: 'center', paddingVertical: 44 },
  emptyIconBox:{ width: 68, height: 68, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle:  { fontSize: 15, fontWeight: '800', color: '#ccc', marginBottom: 6 },
  emptyDesc:   { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },
});