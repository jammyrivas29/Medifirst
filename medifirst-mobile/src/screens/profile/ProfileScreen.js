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

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];
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

function ModalHeader({ title, onClose }) {
  return (
    <View style={mS.header}>
      <Text style={mS.title}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={mS.closeBtn}>
        <Ionicons name="close" size={22} color="#555" />
      </TouchableOpacity>
    </View>
  );
}
const mS = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title:    { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
});

function PrivacyModal({ visible, onClose }) {
  const sections = [
    { h: '1. Information We Collect', t: 'MediFirst collects personal information you provide directly, including your name, email address, phone number, and medical profile data. We also collect emergency contact information you choose to add.' },
    { h: '2. How We Use Your Information', t: 'Your information is used solely to provide the MediFirst first aid and emergency assistance features. Medical profile data helps personalize health recommendations.' },
    { h: '3. Data Storage & Security', t: 'All personal data is stored securely on encrypted servers. We use industry-standard security measures including HTTPS encryption and secure authentication tokens.' },
    { h: '4. Data Sharing', t: 'We do not sell, trade, or share your personal information with third parties for marketing purposes.' },
    { h: '5. Location Data', t: 'MediFirst requests location access only when you use the Send My Location feature. Location data is not stored on our servers.' },
    { h: '6. Medical Information', t: 'Medical profile data is stored to provide personalized first aid guidance. This information is never shared with insurance companies, employers, or third parties.' },
    { h: '7. Your Rights', t: 'You have the right to access, correct, or delete your personal data at any time.' },
    { h: '8. Contact Us', t: 'Questions about this Privacy Policy? Contact us at: privacy@medifirst.help@gmail.com' },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ModalHeader title="Privacy Policy" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {sections.map((s, i) => (
            <View key={i} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 }}>{s.h}</Text>
              <Text style={{ fontSize: 13, color: '#555', lineHeight: 21 }}>{s.t}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AboutModal({ visible, onClose }) {
  const features = [
    { icon: 'medical',      color: '#e74c3c', bg: '#fdecea', title: 'First Aid Guides',    desc: 'Step-by-step emergency protocols' },
    { icon: 'chatbubbles',  color: '#16a085', bg: '#e8f8f5', title: 'AI Assistant',        desc: 'Instant first aid answers' },
    { icon: 'location',     color: '#27ae60', bg: '#e9f7ef', title: 'Hospital Locator',    desc: 'Find nearby emergency care' },
    { icon: 'call',         color: '#2980b9', bg: '#e8f4fb', title: 'Emergency Hotlines',  desc: 'One-tap 911 and crisis lines' },
    { icon: 'people',       color: '#8e44ad', bg: '#f5eef8', title: 'Emergency Contacts',  desc: 'Save and call contacts fast' },
    { icon: 'person-circle',color: '#d35400', bg: '#fef5ec', title: 'Medical Profile',     desc: 'Blood type, allergies and conditions' },
    { icon: 'send',         color: '#c0392b', bg: '#fdecea', title: 'GPS Location Share',  desc: 'SMS your location to contacts' },
    { icon: 'play-circle',  color: '#f39c12', bg: '#fef9e7', title: 'Video Tutorials',     desc: 'Watch first aid demonstrations' },
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ModalHeader title="About MediFirst" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* ── Logo + App Name ── */}
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            {/* Real logo image */}
            <Image
              source={require('../../../assets/logo2.png')}
              style={{ width: 110, height: 110, marginBottom: 14 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1a1a2e' }}>MediFirst</Text>
            <Text style={{ fontSize: 13, color: '#e74c3c', fontWeight: '700', marginTop: 4 }}>First Aid & Emergency Assistant</Text>
            <Text style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Version 1.0.0</Text>
          </View>

          {/* ── Divider ── */}
          <View style={{ height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 }} />

          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginBottom: 12 }}>Key Features</Text>
          {features.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.bg, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={f.icon} size={20} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1a2e' }}>{f.title}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{f.desc}</Text>
              </View>
            </View>
          ))}
          <Text style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 20 }}>MediFirst v1.0.0 — 2026 All rights reserved.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

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
            { label: 'FIRST NAME',    value: firstName, set: setFirstName, icon: 'person-outline',  kbType: 'default',       cap: 'words',   maxLen: 50  },
            { label: 'LAST NAME',     value: lastName,  set: setLastName,  icon: 'person-outline',  kbType: 'default',       cap: 'words',   maxLen: 50  },
            { label: 'EMAIL ADDRESS', value: email,     set: setEmail,     icon: 'mail-outline',    kbType: 'email-address', cap: 'none',    maxLen: 100 },
          ].map(({ label, value, set, icon, kbType, cap, maxLen }) => (
            <View key={label}>
              <Text style={eS.label}>{label}</Text>
              <View style={eS.row}>
                <Ionicons name={icon} size={17} color="#bbb" style={{ marginRight: 10 }} />
                <TextInput style={eS.input} value={value} onChangeText={set} keyboardType={kbType} autoCapitalize={cap} autoCorrect={false} maxLength={maxLen} />
                {value.trim() ? <Ionicons name="checkmark-circle" size={16} color="#27ae60" /> : null}
              </View>
            </View>
          ))}
          <Text style={eS.label}>PHONE NUMBER</Text>
          <View style={eS.row}>
            <Ionicons name="call-outline" size={17} color="#bbb" style={{ marginRight: 10 }} />
            <TextInput style={eS.input} value={phone} onChangeText={v => setPhone(v.replace(/\D/g,'').slice(0,11))} keyboardType="number-pad" maxLength={11} placeholder="09XXXXXXXXX (optional)" placeholderTextColor="#bbb" />
            {phone.length === 11 ? <Ionicons name="checkmark-circle" size={16} color="#27ae60" /> : phone.length > 0 ? <Text style={{ fontSize: 11, color: '#f39c12', fontWeight: '700' }}>{phone.length}/11</Text> : null}
          </View>
          <TouchableOpacity style={eS.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={eS.saveBtnText}>Save Changes</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const eS = StyleSheet.create({
  label:      { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1.2, marginBottom: 6 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#ececec', marginBottom: 16 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1a1a2e' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e74c3c', paddingVertical: 16, borderRadius: 12, elevation: 5, marginTop: 8 },
  saveBtnText:{ color: '#fff', fontSize: 16, fontWeight: '800' },
});

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
      ], { cancelable: true });
    } else {
      showPhotoOptions();
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Select Photo', 'Choose where to get your photo from', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  const confirmRemovePhoto = () => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: removePhoto },
    ]);
  };

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

  const savePhoto = async (uri) => {
    setProfileImage(uri);
    try { await AsyncStorage.setItem(PHOTO_KEY, uri); } catch (_) {}
  };

  const removePhoto = async () => {
    setProfileImage(null);
    try { await AsyncStorage.removeItem(PHOTO_KEY); } catch (_) {}
  };

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

  return (
    <View style={s.root}>

      <SafeAreaView style={s.appHeader}>
        {Platform.OS === 'android' && <View style={{ height: StatusBar.currentHeight || 0 }} />}
        <View style={s.hdrInner}>
          <View style={s.hdrBrand}>
            <View style={s.hdrLogoWrap}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85}>
                {profileImage
                  ? <Image source={{ uri: profileImage }} style={s.avatarImg} />
                  : <View style={s.avatarInitials}><Text style={s.avatarText}>{initials}</Text></View>
                }
              </TouchableOpacity>
              <View style={s.cameraBadge}><Ionicons name="camera" size={10} color="#fff" /></View>
            </View>
            <View>
              <Text style={s.hdrTitle}>{user?.firstName} {user?.lastName}</Text>
              <Text style={s.hdrSub}>{user?.email}</Text>
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#fff" />
                <Text style={s.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
          <View style={s.hdrActions}>
            <TouchableOpacity style={s.hdrEditBtn} onPress={() => setShowEdit(true)}>
              <Ionicons name="pencil" size={13} color="#e74c3c" />
              <Text style={s.hdrEditBtnTxt}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.hdrOutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={s.hdrOutBtnTxt}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.hdrStrip}>
          <View style={s.hdrLiveDot} />
          <Text style={s.hdrStripText}>Your medical data is private and encrypted</Text>
        </View>
      </SafeAreaView>

      <View style={s.statsWrap}>
        {[
          { num: callHistory.length, label: 'Calls',      icon: 'call',         color: '#8e44ad' },
          { num: recs.length,         label: 'Tips',        icon: 'bulb',         color: '#f39c12' },
          { num: allergyList.length,  label: 'Allergies',   icon: 'alert-circle', color: '#e74c3c' },
          { num: condList.length,     label: 'Conditions',  icon: 'fitness',      color: '#2980b9' },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={s.statItem}>
              <View style={[s.statIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={13} color={item.color} />
              </View>
              <Text style={s.statNum}>{item.num}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={s.statDiv} />}
          </React.Fragment>
        ))}
      </View>

      <View style={s.tabBar}>
        {[
          { key: 'profile',  label: 'Medical',  icon: 'medical'             },
          { key: 'contacts', label: 'Contacts', icon: 'people'              },
          { key: 'history',  label: 'History',  icon: 'time'                },
          { key: 'tips',     label: 'Tips',     icon: 'bulb'                },
          { key: 'more',     label: 'More',     icon: 'ellipsis-horizontal' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && s.tabActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
            <View style={[s.tabIconBg, activeTab === tab.key && s.tabIconBgOn]}>
              <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? '#e74c3c' : '#bbb'} />
            </View>
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelOn]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'profile' && (
          <View>
            <View style={s.secRow}>
              <View style={s.secLeft}>
                <View style={[s.secDot, { backgroundColor: '#fdecea' }]}><Ionicons name="medical" size={15} color="#e74c3c" /></View>
                <Text style={s.secTitle}>Medical Profile</Text>
              </View>
              <TouchableOpacity style={[s.editBtn, editing && s.editBtnOn]} onPress={() => setEditing(!editing)}>
                <Ionicons name={editing ? 'close' : 'pencil'} size={13} color={editing ? '#fff' : '#666'} />
                <Text style={[s.editBtnTxt, editing && { color: '#fff' }]}>{editing ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <View style={s.cardLabelRow}>
                <Ionicons name="water" size={12} color="#e74c3c" />
                <Text style={s.cardLabel}>BLOOD TYPE</Text>
              </View>
              {editing ? (
                <View style={s.bloodGrid}>
                  {BLOOD_TYPES.map(bt => (
                    <TouchableOpacity key={bt} style={[s.btChip, bloodType === bt && s.btChipOn]} onPress={() => setBloodType(bt)}>
                      <Text style={[s.btChipTxt, bloodType === bt && s.btChipTxtOn]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={s.btRow}>
                  <View style={s.btCircle}>
                    <Text style={s.btCircleTxt}>{profile?.medicalProfile?.bloodType || '-'}</Text>
                  </View>
                  <Text style={s.btHint}>
                    {(!profile?.medicalProfile?.bloodType || profile.medicalProfile.bloodType === 'Unknown')
                      ? 'Not set - tap Edit to record'
                      : 'Blood type on record'}
                  </Text>
                </View>
              )}
            </View>

            <View style={s.card}>
              <View style={s.cardLabelRow}>
                <Ionicons name="alert-circle" size={12} color="#e67e22" />
                <Text style={s.cardLabel}>ALLERGIES</Text>
              </View>
              {editing
                ? <TextInput style={s.textInput} value={allergies} onChangeText={setAllergies} placeholder="e.g. Peanuts, Penicillin (comma separated)" placeholderTextColor="#ccc" multiline />
                : allergyList.length
                    ? <View style={s.chipRow}>{allergyList.map((a, i) => <View key={i} style={s.chipOrange}><Ionicons name="alert-circle" size={10} color="#e67e22" /><Text style={s.chipOrangeTxt}>{a}</Text></View>)}</View>
                    : <Text style={s.nilText}>No allergies recorded</Text>
              }
            </View>

            <View style={s.card}>
              <View style={s.cardLabelRow}>
                <Ionicons name="fitness" size={12} color="#2980b9" />
                <Text style={s.cardLabel}>MEDICAL CONDITIONS</Text>
              </View>
              {editing
                ? <TextInput style={s.textInput} value={conditions} onChangeText={setConditions} placeholder="e.g. Diabetes, Hypertension (comma separated)" placeholderTextColor="#ccc" multiline />
                : condList.length
                    ? <View style={s.chipRow}>{condList.map((c, i) => <View key={i} style={s.chipBlue}><Ionicons name="fitness" size={10} color="#2980b9" /><Text style={s.chipBlueTxt}>{c}</Text></View>)}</View>
                    : <Text style={s.nilText}>No conditions recorded</Text>
              }
            </View>

            {editing && (
              <TouchableOpacity style={s.saveBtn} onPress={saveMedical} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={s.saveBtnTxt}>Save Medical Profile</Text></>}
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'contacts' && <EmergencyContactsTab logCall={logCall} />}

        {activeTab === 'history' && (
          <View>
            <View style={s.secRow}>
              <View style={s.secLeft}>
                <View style={[s.secDot, { backgroundColor: '#f5eef8' }]}><Ionicons name="time" size={15} color="#8e44ad" /></View>
                <Text style={s.secTitle}>Call History</Text>
              </View>
              {callHistory.length > 0 && (
                <TouchableOpacity onPress={clearCalls} style={s.clearBtn}>
                  <Ionicons name="trash-outline" size={13} color="#e74c3c" />
                  <Text style={s.clearBtnTxt}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {callHistory.length === 0
              ? <View style={s.empty}>
                  <View style={s.emptyIconBox}><Ionicons name="call-outline" size={34} color="#ddd" /></View>
                  <Text style={s.emptyTitle}>No Calls Yet</Text>
                  <Text style={s.emptyDesc}>Calls made through this app will appear here.</Text>
                </View>
              : callHistory.map(e => (
                <View key={e.id} style={s.histCard}>
                  <View style={s.histIconBox}><Ionicons name="call" size={16} color="#8e44ad" /></View>
                  <View style={s.histInfo}>
                    <Text style={s.histName}>{e.label}</Text>
                    <Text style={s.histNum}>{e.number}</Text>
                    <Text style={s.histTime}>{fmtDate(e.timestamp)}</Text>
                  </View>
                  <TouchableOpacity style={s.histCallBtn} onPress={() => logCall(e.number, e.label)}>
                    <Ionicons name="call" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            }
          </View>
        )}

        {activeTab === 'tips' && (
          <View>
            <View style={s.secRow}>
              <View style={s.secLeft}>
                <View style={[s.secDot, { backgroundColor: '#fef9e7' }]}><Ionicons name="bulb" size={15} color="#f39c12" /></View>
                <Text style={s.secTitle}>Health Tips</Text>
              </View>
            </View>
            <Text style={s.tipsSub}>Personalized based on your medical profile</Text>
            {recs.map((rec, i) => (
              <View key={i} style={[s.recCard, { borderLeftColor: URGENCY_COLORS[rec.urgency] }]}>
                <View style={s.recTop}>
                  <View style={[s.recIconBox, { backgroundColor: URGENCY_COLORS[rec.urgency] + '18' }]}>
                    <Ionicons name={rec.icon} size={18} color={URGENCY_COLORS[rec.urgency]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.recTitle}>{rec.title}</Text>
                    <View style={[s.recBadge, { backgroundColor: URGENCY_COLORS[rec.urgency] }]}>
                      <Text style={s.recBadgeTxt}>{rec.urgency?.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <Text style={s.recDesc}>{rec.desc}</Text>
              </View>
            ))}
            <View style={s.safetyBox}>
              <View style={s.safetyHead}>
                <Ionicons name="shield-checkmark" size={15} color="#27ae60" />
                <Text style={s.safetyTitle}>General Safety Reminders</Text>
              </View>
              {['Always call 911 first in a life-threatening emergency.','Keep a first aid kit at home, in your car, and at work.','Inform household members of your medical conditions.','Renew your first aid training every 2 years.','Know the location of the nearest emergency department.'].map((tip, i) => (
                <View key={i} style={s.safetyRow}>
                  <View style={s.safetyBullet} />
                  <Text style={s.safetyTip}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'more' && (
          <View>
            <Text style={s.groupLabel}>ACCOUNT</Text>
            <View style={s.settingsCard}>
              {[
                { icon: 'person', bg: '#fdecea', color: '#e74c3c', title: 'Edit Account', sub: 'Update name, email and phone', onPress: () => setShowEdit(true) },
                { icon: 'camera', bg: '#e8f4fb', color: '#2980b9', title: 'Change Profile Photo', sub: 'Take a photo or choose from gallery', onPress: pickPhoto },
              ].map((r, i) => (
                <React.Fragment key={r.title}>
                  {i > 0 && <View style={s.settingsDiv} />}
                  <TouchableOpacity style={s.settingsRow} onPress={r.onPress} activeOpacity={0.8}>
                    <View style={[s.settingsIcon, { backgroundColor: r.bg }]}><Ionicons name={r.icon} size={18} color={r.color} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.settingsTitle}>{r.title}</Text>
                      <Text style={s.settingsSub}>{r.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#ccc" />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            <Text style={s.groupLabel}>APP INFO</Text>
            <View style={s.settingsCard}>
              {[
                { icon: 'information-circle', bg: '#e8f8f5', color: '#16a085', title: 'About MediFirst', sub: 'Features, version and mission', onPress: () => setShowAbout(true) },
                { icon: 'shield-checkmark', bg: '#f5eef8', color: '#8e44ad', title: 'Privacy Policy', sub: 'How we handle your data', onPress: () => setShowPrivacy(true) },
                { icon: 'mail', bg: '#fef9e7', color: '#f39c12', title: 'Contact Support', sub: 'medifirst.help@gmail.com', onPress: () => Linking.openURL('mailto:medifirst.help@gmail.com') },
              ].map((r, i) => (
                <React.Fragment key={r.title}>
                  {i > 0 && <View style={s.settingsDiv} />}
                  <TouchableOpacity style={s.settingsRow} onPress={r.onPress} activeOpacity={0.8}>
                    <View style={[s.settingsIcon, { backgroundColor: r.bg }]}><Ionicons name={r.icon} size={18} color={r.color} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.settingsTitle}>{r.title}</Text>
                      <Text style={s.settingsSub}>{r.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#ccc" />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            <Text style={s.groupLabel}>DANGER ZONE</Text>
            <View style={s.settingsCard}>
              <TouchableOpacity style={s.settingsRow} onPress={handleLogout} activeOpacity={0.8}>
                <View style={[s.settingsIcon, { backgroundColor: '#fdecea' }]}><Ionicons name="log-out-outline" size={18} color="#e74c3c" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.settingsTitle, { color: '#e74c3c' }]}>Sign Out</Text>
                  <Text style={s.settingsSub}>You can sign back in anytime</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#ccc" />
              </TouchableOpacity>
            </View>
            <Text style={s.versionTxt}>MediFirst v1.0.0 - 2026 - Made with love for safety</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
      <EditAccountModal visible={showEdit} onClose={() => setShowEdit(false)} user={user} onSaved={fetchProfile} />
    </View>
  );
}

function EmergencyContactsTab({ logCall }) {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', relationship: '', phoneNumber: '' });
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try { const r = await api.get('/user/emergency-contacts'); setContacts(r.data.contacts || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addContact = async () => {
    if (!form.name.trim() || !form.relationship.trim() || !form.phoneNumber.trim()) { Alert.alert('Missing Fields', 'Please fill in all fields.'); return; }
    try {
      setSaving(true);
      await api.post('/user/emergency-contacts', form);
      await fetchContacts(); setForm({ name: '', relationship: '', phoneNumber: '' }); setShowForm(false);
    } catch { Alert.alert('Error', 'Failed to add contact.'); }
    finally { setSaving(false); }
  };

  const deleteContact = (id, name) => Alert.alert('Remove Contact', 'Remove ' + name + '?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { await api.delete('/user/emergency-contacts/' + id); fetchContacts(); } },
  ]);

  const COLORS = { mom: '#e74c3c', dad: '#e74c3c', mother: '#e74c3c', father: '#e74c3c', spouse: '#8e44ad', wife: '#8e44ad', husband: '#8e44ad', friend: '#2980b9', sibling: '#27ae60', brother: '#27ae60', sister: '#27ae60' };
  const initials = (n) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = (rel) => COLORS[rel?.toLowerCase()] || '#e74c3c';

  if (loading) return <View style={s.center}><ActivityIndicator size="small" color="#e74c3c" /></View>;

  return (
    <View>
      <View style={s.secRow}>
        <View style={s.secLeft}>
          <View style={[s.secDot, { backgroundColor: '#e8f4fb' }]}><Ionicons name="people" size={15} color="#2980b9" /></View>
          <Text style={s.secTitle}>Emergency Contacts</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, showForm && { backgroundColor: '#999' }]} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={15} color="#fff" />
          <Text style={s.addBtnTxt}>{showForm ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>New Emergency Contact</Text>
          {[
            { val: form.name, key: 'name', ph: 'Full Name *', kb: 'default' },
            { val: form.relationship, key: 'relationship', ph: 'Relationship (e.g. Mom, Spouse) *', kb: 'default' },
            { val: form.phoneNumber, key: 'phoneNumber', ph: 'Phone Number *', kb: 'phone-pad' },
          ].map(f => (
            <TextInput key={f.key} style={s.textInput} value={f.val} onChangeText={v => setForm({...form,[f.key]:v})} placeholder={f.ph} placeholderTextColor="#bbb" keyboardType={f.kb} />
          ))}
          <TouchableOpacity style={s.saveBtn} onPress={addContact} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="person-add" size={14} color="#fff" /><Text style={s.saveBtnTxt}>Add Contact</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {contacts.length === 0 && !showForm
        ? <View style={s.empty}>
            <View style={s.emptyIconBox}><Ionicons name="people-outline" size={34} color="#ddd" /></View>
            <Text style={s.emptyTitle}>No Contacts Yet</Text>
            <Text style={s.emptyDesc}>Add emergency contacts so responders can reach your family.</Text>
            <TouchableOpacity style={[s.saveBtn, { marginTop: 16 }]} onPress={() => setShowForm(true)}>
              <Ionicons name="add" size={14} color="#fff" /><Text style={s.saveBtnTxt}>Add First Contact</Text>
            </TouchableOpacity>
          </View>
        : contacts.map(c => (
          <View key={c._id} style={s.contactCard}>
            <View style={[s.contactAvatar, { backgroundColor: avatarColor(c.relationship) }]}>
              <Text style={s.contactAvatarTxt}>{initials(c.name)}</Text>
            </View>
            <View style={s.contactInfo}>
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
      }
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f0f2f5' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },

  appHeader: { backgroundColor: '#e74c3c', elevation: 6, shadowColor: '#c0392b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 },
  hdrInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14 },
  hdrBrand:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdrLogoWrap: { position: 'relative' },
  avatarImg:   { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  avatarInitials: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarText:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  cameraBadge:     { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#27ae60', borderWidth: 2, borderColor: '#e74c3c' },
  hdrTitle:        { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  hdrSub:          { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontStyle: 'italic' },
  verifiedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  verifiedText:    { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  hdrActions:      { gap: 6, alignItems: 'flex-end' },
  hdrEditBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16 },
  hdrEditBtnTxt:   { fontSize: 11, fontWeight: '700', color: '#e74c3c' },
  hdrOutBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  hdrOutBtnTxt:    { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  hdrStrip:        { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.12)', paddingHorizontal: 16, paddingVertical: 8 },
  hdrLiveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ecc71' },
  hdrStripText:    { fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: '500', flex: 1 },

  statsWrap: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14, borderRadius: 16, paddingVertical: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  statItem:  { flex: 1, alignItems: 'center', gap: 3 },
  statIcon:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statNum:   { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
  statLabel: { fontSize: 9, color: '#aaa', fontWeight: '600' },
  statDiv:   { width: 1, height: 30, backgroundColor: '#f0f0f0' },

  tabBar:       { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ececec', elevation: 2, marginTop: 12 },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabActive:    {},
  tabIconBg:    { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tabIconBgOn:  { backgroundColor: '#fdecea' },
  tabLabel:     { fontSize: 9, fontWeight: '600', color: '#bbb' },
  tabLabelOn:   { color: '#e74c3c', fontWeight: '800' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 14, paddingTop: 16 },

  secRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  secLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secDot:  { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  secTitle:{ fontSize: 17, fontWeight: '800', color: '#1a1a2e' },

  editBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  editBtnOn:  { backgroundColor: '#e74c3c' },
  editBtnTxt: { fontSize: 12, fontWeight: '700', color: '#666' },

  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardLabel:    { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 1.2 },

  btRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btCircle:   { width: 54, height: 54, borderRadius: 15, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f5c6c6' },
  btCircleTxt:{ fontSize: 19, fontWeight: '900', color: '#e74c3c' },
  btHint:     { fontSize: 12, color: '#aaa', flex: 1, lineHeight: 18 },
  bloodGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btChip:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#e8e8e8', backgroundColor: '#fafafa' },
  btChipOn:   { borderColor: '#e74c3c', backgroundColor: '#fdecea' },
  btChipTxt:  { fontSize: 13, fontWeight: '600', color: '#999' },
  btChipTxtOn:{ color: '#e74c3c', fontWeight: '900' },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chipOrange:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fef5ec', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#fde3c8' },
  chipOrangeTxt:{ fontSize: 12, fontWeight: '600', color: '#e67e22' },
  chipBlue:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e8f4fb', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#c5dff1' },
  chipBlueTxt:  { fontSize: 12, fontWeight: '600', color: '#2980b9' },
  nilText:      { fontSize: 13, color: '#ccc', fontStyle: 'italic' },

  textInput: { borderWidth: 1.5, borderColor: '#ececec', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa', marginBottom: 10 },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e74c3c', padding: 15, borderRadius: 12, elevation: 4, shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 },
  saveBtnTxt:{ color: '#fff', fontWeight: '800', fontSize: 15 },

  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e74c3c', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  addBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  formCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#2980b9' },
  formTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 14 },

  contactCard:      { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  contactAvatar:    { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contactAvatarTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
  contactInfo:      { flex: 1 },
  contactName:      { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  contactMeta:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  contactRel:       { fontSize: 11, color: '#aaa' },
  contactPhone:     { fontSize: 12, color: '#e74c3c', fontWeight: '700' },
  callBtn:          { width: 34, height: 34, borderRadius: 17, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  delBtn:           { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center' },

  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fdecea', borderRadius: 20 },
  clearBtnTxt: { color: '#e74c3c', fontSize: 12, fontWeight: '700' },
  histCard:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 10, alignItems: 'center', elevation: 1 },
  histIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5eef8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  histInfo:    { flex: 1 },
  histName:    { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  histNum:     { fontSize: 12, color: '#8e44ad', fontWeight: '600', marginVertical: 2 },
  histTime:    { fontSize: 11, color: '#bbb' },
  histCallBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8e44ad', justifyContent: 'center', alignItems: 'center' },

  tipsSub:     { fontSize: 12, color: '#aaa', marginBottom: 14, fontStyle: 'italic' },
  recCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 10, borderLeftWidth: 4, elevation: 1 },
  recTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  recIconBox:  { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recTitle:    { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 5 },
  recBadge:    { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  recBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  recDesc:     { fontSize: 13, color: '#666', lineHeight: 20 },
  safetyBox:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 4, elevation: 1 },
  safetyHead:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  safetyTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  safetyRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  safetyBullet:{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#27ae60', marginTop: 6 },
  safetyTip:   { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },

  groupLabel:   { fontSize: 10, fontWeight: '800', color: '#bbb', letterSpacing: 1.5, marginBottom: 8, marginTop: 8, paddingHorizontal: 2 },
  settingsCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 2 },
  settingsRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  settingsDiv:  { height: 1, backgroundColor: '#f5f5f5', marginHorizontal: 16 },
  settingsIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingsTitle:{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  settingsSub:  { fontSize: 11, color: '#aaa' },
  versionTxt:   { fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 10 },

  empty:       { alignItems: 'center', paddingVertical: 40 },
  emptyIconBox:{ width: 68, height: 68, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle:  { fontSize: 15, fontWeight: '800', color: '#ccc', marginBottom: 5 },
  emptyDesc:   { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20 },
});