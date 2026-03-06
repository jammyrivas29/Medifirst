import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { registerUser, clearError } from '../../store/authSlice';

const RULES = {
  firstName:       { validate: v => v.trim().length >= 2,                         error: 'First name is required.' },
  lastName:        { validate: v => v.trim().length >= 2,                         error: 'Last name is required.' },
  email:           { validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), error: 'Enter a valid email.' },
  phoneNumber:     { validate: v => v === '' || /^09\d{9}$/.test(v),             error: 'Must start with 09 and be exactly 11 digits.' },
  password:        { validate: v => v.length >= 6,                                error: 'Password must be at least 6 characters.' },
  confirmPassword: { validate: (v, form) => v.length > 0 && v === form.password, error: 'Passwords do not match.' },
};

export default function RegisterScreen({ navigation }) {
  const dispatch           = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]           = useState({});
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', phoneNumber: '',
  });

  const set   = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const touch = (key)      => setTouched(prev => ({ ...prev, [key]: true }));
  const hasError = (key)   => touched[key] && !RULES[key].validate(form[key], form);

  const allValid = () =>
    ['firstName', 'lastName', 'email', 'password', 'confirmPassword'].every(k => RULES[k].validate(form[k], form)) &&
    RULES.phoneNumber.validate(form.phoneNumber, form);

  const handleRegister = async () => {
    setTouched(Object.keys(RULES).reduce((a, k) => ({ ...a, [k]: true }), {}));
    if (!allValid()) { Alert.alert('Fix Errors', 'Please correct the highlighted fields before continuing.'); return; }
    try {
      await dispatch(registerUser({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        email:       form.email.trim(),
        password:    form.password,
        phoneNumber: form.phoneNumber,
      })).unwrap();
    } catch (err) {
      Alert.alert('Registration Failed', err || 'Something went wrong.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ══ HEADER ══ */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-add" size={26} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Create Account</Text>
              <Text style={styles.userEmail}>Join MediFirst — it's completely free</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#fff" />
                <Text style={styles.verifiedText}>Free · Secure · No Ads</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            {[
              { num: '100%', label: 'Free' },
              { num: '24/7', label: 'Access' },
              { num: '8+',   label: 'Features' },
              { num: '🔒',   label: 'Private' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{s.num}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ══ FORM CARD ══ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>
          <Text style={styles.cardSub}>Fill in your details below</Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* First + Last Name */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First Name *"
                  placeholderTextColor="#bbb"
                  value={form.firstName}
                  onChangeText={v => set('firstName', v)}
                  onBlur={() => touch('firstName')}
                  autoCorrect={false}
                />
              </View>
              {hasError('firstName') && <Text style={styles.fieldError}>{RULES.firstName.error}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name *"
                  placeholderTextColor="#bbb"
                  value={form.lastName}
                  onChangeText={v => set('lastName', v)}
                  onBlur={() => touch('lastName')}
                  autoCorrect={false}
                />
              </View>
              {hasError('lastName') && <Text style={styles.fieldError}>{RULES.lastName.error}</Text>}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address *"
              placeholderTextColor="#bbb"
              value={form.email}
              onChangeText={v => set('email', v)}
              onBlur={() => touch('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {hasError('email') && <Text style={styles.fieldError}>{RULES.email.error}</Text>}

          {/* Phone */}
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="09XXXXXXXXX (optional)"
              placeholderTextColor="#bbb"
              value={form.phoneNumber}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '');
                if (cleaned.length <= 11) set('phoneNumber', cleaned);
              }}
              onBlur={() => touch('phoneNumber')}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>
          {hasError('phoneNumber') && <Text style={styles.fieldError}>{RULES.phoneNumber.error}</Text>}

          {/* Password */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password * (min 6 chars)"
              placeholderTextColor="#bbb"
              value={form.password}
              onChangeText={v => set('password', v)}
              onBlur={() => touch('password')}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#bbb" />
            </TouchableOpacity>
          </View>
          {hasError('password') && <Text style={styles.fieldError}>{RULES.password.error}</Text>}

          {/* Confirm Password */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#bbb"
              value={form.confirmPassword}
              onChangeText={v => set('confirmPassword', v)}
              onBlur={() => touch('confirmPassword')}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
          </View>
          {hasError('confirmPassword') && <Text style={styles.fieldError}>{RULES.confirmPassword.error}</Text>}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => { dispatch(clearError()); navigation.navigate('Login'); }}
          >
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={styles.linkHighlight}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f5f6f8' },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: '#e74c3c',
    paddingTop: 90, paddingHorizontal: 16, paddingBottom: 18,
    elevation: 6, shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  userRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar:        { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  userInfo:      { flex: 1 },
  userName:      { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  userEmail:     { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginBottom: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  verifiedText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
  statsRow:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  statItem:      { flex: 1, alignItems: 'center' },
  statNum:       { fontSize: 16, fontWeight: '900', color: '#fff' },
  statLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.78)', marginTop: 2, textAlign: 'center' },
  statDivider:   { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },

  card:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26, paddingTop: 30, minHeight: 540 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#aaa', marginBottom: 20 },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
  errorText: { color: '#c0392b', fontSize: 13, flex: 1 },

  nameRow: { flexDirection: 'row', marginBottom: 0 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, marginBottom: 12,
    paddingHorizontal: 14, borderWidth: 1.5,
    borderColor: '#ececec', backgroundColor: '#f8f9fa',
  },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1a1a2e' },
  eyeBtn:     { padding: 6 },

  fieldError: { fontSize: 11, color: '#e74c3c', marginTop: -8, marginBottom: 8, paddingHorizontal: 4 },

  primaryBtn: {
    backgroundColor: '#e74c3c', paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
    marginTop: 10, marginBottom: 18,
    shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  linkRow:       { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  linkText:      { fontSize: 14, color: '#aaa' },
  linkHighlight: { fontSize: 14, color: '#e74c3c', fontWeight: '700' },
});