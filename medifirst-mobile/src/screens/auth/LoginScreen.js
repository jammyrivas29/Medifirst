import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { login, setGuestMode } from '../../store/authSlice';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch                        = useDispatch();
  const { loading, error }              = useSelector((state) => state.auth);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter both email and password'); return; }
    try { await dispatch(login({ email, password })).unwrap(); }
    catch (err) { Alert.alert('Login Failed', err.message || 'Invalid email or password'); }
  };

  const handleGuestMode = () => dispatch(setGuestMode());

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ══════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════ */}
        <View style={styles.header}>

          {/* Welcome row */}
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeIconWrap}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <View style={styles.welcomeInfo}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSub}>Sign in to access your medical profile</Text>
              <View style={styles.welcomeBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#fff" />
                <Text style={styles.welcomeBadgeText}>Secure · Private · Always Ready</Text>
              </View>
            </View>
          </View>

          {/* Feature pills row */}
          <View style={styles.pillsRow}>
            {['Medical Profile', 'Emergency Contacts', 'AI Assistant', 'Call History'].map((p, i, arr) => (
              <React.Fragment key={p}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{p}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.pillDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════
            WHITE FORM CARD
        ══════════════════════════════════════ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Enter your credentials to continue</Text>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={19} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={19} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={19} color="#bbb" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          


          {/* Register link */}
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkHighlight}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f5f6f8' },
  scroll: { flexGrow: 1 },

  // ══════ HEADER ══════
  header: {
    backgroundColor: '#e74c3c',
    paddingTop: 90,
    paddingHorizontal: 16,
    paddingBottom: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },

  welcomeRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  welcomeIconWrap:  { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  welcomeInfo:      { flex: 1 },
  welcomeTitle:     { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  welcomeSub:       { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginBottom: 6 },
  welcomeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  welcomeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  pillsRow:    { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  pill:        { flex: 1, alignItems: 'center' },
  pillText:    { fontSize: 8.5, fontWeight: '700', color: 'rgba(255,255,255,0.88)', textAlign: 'center' },
  pillDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.25)' },

  // ══════ FORM CARD ══════
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 26,
    paddingTop: 30,
    flex: 1,
    minHeight: 420,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#aaa', marginBottom: 24 },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
  errorText: { color: '#c0392b', fontSize: 13, flex: 1 },

  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#ececec' },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, paddingVertical: 15, fontSize: 15, color: '#1a1a2e' },
  eyeBtn:    { padding: 6 },

  forgotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', marginBottom: 20, paddingVertical: 4 },
  forgotText: { fontSize: 13, fontWeight: '700', color: '#e74c3c' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#e74c3c', paddingVertical: 16,
    borderRadius: 12, marginBottom: 22,
    shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  divider:     { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ececec' },
  dividerText: { marginHorizontal: 14, color: '#bbb', fontSize: 13 },

  guestBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e8f4fb', paddingVertical: 15, borderRadius: 12, marginBottom: 24, borderWidth: 1.5, borderColor: '#90caf9' },
  guestBtnText: { color: '#2980b9', fontSize: 15, fontWeight: '700' },

  linkRow:       { flexDirection: 'row', justifyContent: 'center' },
  linkText:      { fontSize: 14, color: '#aaa' },
  linkHighlight: { fontSize: 14, color: '#e74c3c', fontWeight: '700' },
});