import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosConfig';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setError('Please enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmed });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

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
              <Ionicons name="key" size={26} color="#fff" />
            </View>
            <View style={styles.welcomeInfo}>
              <Text style={styles.welcomeTitle}>Forgot Password?</Text>
              <Text style={styles.welcomeSub}>We'll send a reset link to your email</Text>
              <View style={styles.welcomeBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#fff" />
                <Text style={styles.welcomeBadgeText}>Secure · Fast · Easy</Text>
              </View>
            </View>
          </View>

          {/* Steps pills */}
          <View style={styles.pillsRow}>
            {['Enter Email', 'Get Reset Link', 'Set New Password', 'Sign In'].map((p, i, arr) => (
              <React.Fragment key={p}>
                <View style={[styles.pill, i === 0 && styles.pillActive]}>
                  <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{p}</Text>
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

          {sent ? (
            /* ── SUCCESS STATE ── */
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <Ionicons name="mail" size={40} color="#27ae60" />
              </View>
              <Text style={styles.successTitle}>Check Your Inbox!</Text>
              <Text style={styles.successDesc}>
                We sent a password reset link to{'\n'}
                <Text style={styles.successEmail}>{email}</Text>
              </Text>

              <View style={styles.successSteps}>
                {[
                  { icon: 'mail-open-outline',  text: 'Open the email we sent you' },
                  { icon: 'link-outline',        text: 'Click the reset link inside' },
                  { icon: 'lock-open-outline',   text: 'Set your new password' },
                  { icon: 'log-in-outline',      text: 'Sign in with your new password' },
                ].map((s, i) => (
                  <View key={i} style={styles.successStep}>
                    <View style={styles.successStepNum}>
                      <Text style={styles.successStepNumText}>{i + 1}</Text>
                    </View>
                    <Ionicons name={s.icon} size={18} color="#27ae60" style={{ marginRight: 10 }} />
                    <Text style={styles.successStepText}>{s.text}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.successNote}>
                <Ionicons name="information-circle-outline" size={15} color="#f39c12" />
                <Text style={styles.successNoteText}>Didn't receive it? Check your spam folder or try again.</Text>
              </View>

              <TouchableOpacity style={styles.resendBtn} onPress={() => { setSent(false); setEmail(''); }} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={17} color="#e74c3c" />
                <Text style={styles.resendBtnText}>Try a different email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                <Ionicons name="log-in-outline" size={19} color="#fff" />
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── INPUT STATE ── */
            <>
              <Text style={styles.cardTitle}>Reset Password</Text>
              <Text style={styles.cardSub}>Enter your account email and we'll send you a link to reset your password.</Text>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputRow, !!error && styles.inputRowError]}>
                <Ionicons name="mail-outline" size={19} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={18} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={15} color="#f39c12" />
                <Text style={styles.tipText}>Make sure to use the email address linked to your MediFirst account.</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || !email.trim()) && { opacity: 0.65 }]}
                onPress={handleSubmit}
                disabled={loading || !email.trim()}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={19} color="#fff" />
                    <Text style={styles.primaryBtnText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
                <Ionicons name="arrow-back-outline" size={17} color="#666" />
                <Text style={styles.backBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingTop: 95,
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

  pillsRow:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  pill:           { flex: 1, alignItems: 'center', paddingVertical: 2 },
  pillActive:     { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 8, marginHorizontal: 2, paddingVertical: 4 },
  pillText:       { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  pillTextActive: { color: '#fff', fontSize: 8.5 },
  pillDivider:    { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.25)' },

  // ══════ FORM CARD ══════
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26, paddingTop: 30, flex: 1, minHeight: 400 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  cardSub:   { fontSize: 13, color: '#aaa', marginBottom: 22, lineHeight: 19 },

  errorBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
  errorText:     { color: '#c0392b', fontSize: 13, flex: 1 },
  inputLabel:    { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, letterSpacing: 0.3 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#ececec' },
  inputRowError: { borderColor: '#e74c3c', backgroundColor: '#fef8f8' },
  inputIcon:     { marginRight: 10 },
  input:         { flex: 1, paddingVertical: 15, fontSize: 15, color: '#1a1a2e' },
  clearBtn:      { padding: 4 },
  tipBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbf0', padding: 12, borderRadius: 10, marginBottom: 22, borderLeftWidth: 3, borderLeftColor: '#f39c12' },
  tipText:       { flex: 1, fontSize: 12, color: '#856404', lineHeight: 18 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#e74c3c', paddingVertical: 16, borderRadius: 12, marginBottom: 14,
    shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  backBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  backBtnText:    { fontSize: 14, fontWeight: '600', color: '#666' },

  // Success
  successContainer:   { alignItems: 'center', paddingTop: 8 },
  successIconWrap:    { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e9f7ef', justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 3, borderColor: '#27ae60' },
  successTitle:       { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 8 },
  successDesc:        { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  successEmail:       { fontWeight: '800', color: '#e74c3c' },
  successSteps:       { width: '100%', marginBottom: 18 },
  successStep:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 8 },
  successStepNum:     { width: 22, height: 22, borderRadius: 11, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  successStepNumText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  successStepText:    { flex: 1, fontSize: 13, color: '#444', fontWeight: '500' },
  successNote:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbf0', padding: 12, borderRadius: 10, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#f39c12', width: '100%' },
  successNoteText:    { flex: 1, fontSize: 12, color: '#856404', lineHeight: 17 },
  resendBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: '#fce8e8', backgroundColor: '#fef5f5', marginBottom: 12, width: '100%', justifyContent: 'center' },
  resendBtnText:      { fontSize: 14, fontWeight: '700', color: '#e74c3c' },
});