import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { registerUser, clearError } from '../../store/authSlice';

// ── Validation Rules ─────────────────────────────────────────────────────────
const RULES = {
  firstName: {
    validate: v => v.trim().length >= 2,
    error:    'First name is required.',
  },
  lastName: {
    validate: v => v.trim().length >= 2,
    error:    'Last name is required.',
  },
  email: {
    hint:     'e.g. juan@email.com',
    validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    error:    'Enter a valid email (e.g. juan@email.com).',
  },
  phoneNumber: {
    hint:     'PH format: 09XXXXXXXXX (11 digits)',
    validate: v => v === '' || /^09\d{9}$/.test(v),
    error:    'Must start with 09 and be exactly 11 digits.',
  },
  password: {
    hint:     'At least 6 characters',
    validate: v => v.length >= 6,
    error:    'Password must be at least 6 characters.',
  },
  confirmPassword: {
    hint:     'Re-type your password',
    validate: (v, form) => v.length > 0 && v === form.password,
    error:    'Passwords do not match.',
  },
};

export default function RegisterScreen({ navigation }) {
  const dispatch           = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState('');
  const [touched, setTouched]           = useState({});
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', phoneNumber: '',
  });

  const set   = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const touch = (key)      => setTouched(prev => ({ ...prev, [key]: true }));

  const isValid  = (key) => RULES[key].validate(form[key], form);
  const hasError = (key) => touched[key] && !isValid(key);

  const allValid = () =>
    ['firstName', 'lastName', 'email', 'password', 'confirmPassword'].every(isValid) &&
    RULES.phoneNumber.validate(form.phoneNumber, form);

  const handleRegister = async () => {
    const allTouched = Object.keys(RULES).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);

    if (!allValid()) {
      Alert.alert('Fix Errors', 'Please correct the highlighted fields before continuing.');
      return;
    }
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

  // ── Colours ──────────────────────────────────────────────────────────────
  const borderColor = (key) => {
    if (hasError(key))                return '#e74c3c';
    if (touched[key] && isValid(key)) return '#27ae60';
    if (focused === key)              return '#e74c3c';
    return '#ececec';
  };
  const bgColor = (key) => {
    if (hasError(key))                return '#fff5f5';
    if (touched[key] && isValid(key)) return '#f5fff8';
    if (focused === key)              return '#fff9f9';
    return '#f8f9fa';
  };
  const iconColor = (key) => {
    if (hasError(key))                return '#e74c3c';
    if (touched[key] && isValid(key)) return '#27ae60';
    if (focused === key)              return '#e74c3c';
    return '#bbb';
  };

  // ── Status icon (✓ / ✗) shown only on fields that have hints ────────────
  const StatusIcon = ({ fk }) => {
    if (!touched[fk] || !RULES[fk].hint) return null;
    return (
      <Ionicons
        name={isValid(fk) ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={isValid(fk) ? '#27ae60' : '#e74c3c'}
        style={{ marginLeft: 4 }}
      />
    );
  };

  // ── Hint / error below field — only for fields with hints ────────────────
  const FieldMessage = ({ fk }) => {
    if (!RULES[fk].hint) return null;          // no hint = no message row at all
    if (hasError(fk)) {
      return (
        <View style={styles.msgRow}>
          <Ionicons name="alert-circle" size={12} color="#e74c3c" />
          <Text style={[styles.msgText, { color: '#e74c3c' }]}>{RULES[fk].error}</Text>
        </View>
      );
    }
    if (focused === fk) {
      return (
        <View style={styles.msgRow}>
          <Ionicons name="information-circle-outline" size={12} color="#aaa" />
          <Text style={[styles.msgText, { color: '#aaa' }]}>{RULES[fk].hint}</Text>
        </View>
      );
    }
    return null;
  };

  // ── Simple inline error for name fields (no hint row, just red border) ───
  const NameError = ({ fk }) =>
    hasError(fk) ? (
      <Text style={styles.nameError}>{RULES[fk].error}</Text>
    ) : null;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════ HEADER ══════ */}
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
              { num: '100%', label: 'Free'     },
              { num: '24/7', label: 'Access'   },
              { num: '8+',   label: 'Features' },
              { num: '🔒',   label: 'Private'  },
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

        {/* ══════ FORM CARD ══════ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>
          <Text style={styles.cardSub}>Fill in your details below</Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── First Name & Last Name ── */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={[styles.inputRow, { borderColor: borderColor('firstName'), backgroundColor: bgColor('firstName') }]}>
                <Ionicons name="person-outline" size={18} color={iconColor('firstName')} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First Name *"
                  placeholderTextColor="#bbb"
                  value={form.firstName}
                  onChangeText={v => set('firstName', v)}
                  onFocus={() => setFocused('firstName')}
                  onBlur={() => { setFocused(''); touch('firstName'); }}
                  autoCorrect={false}
                />
              </View>
              <NameError fk="firstName" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={[styles.inputRow, { borderColor: borderColor('lastName'), backgroundColor: bgColor('lastName') }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name *"
                  placeholderTextColor="#bbb"
                  value={form.lastName}
                  onChangeText={v => set('lastName', v)}
                  onFocus={() => setFocused('lastName')}
                  onBlur={() => { setFocused(''); touch('lastName'); }}
                  autoCorrect={false}
                />
              </View>
              <NameError fk="lastName" />
            </View>
          </View>

          {/* ── Email ── */}
          <View style={[styles.inputRow, { borderColor: borderColor('email'), backgroundColor: bgColor('email') }]}>
            <Ionicons name="mail-outline" size={18} color={iconColor('email')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address *"
              placeholderTextColor="#bbb"
              value={form.email}
              onChangeText={v => set('email', v)}
              onFocus={() => setFocused('email')}
              onBlur={() => { setFocused(''); touch('email'); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <StatusIcon fk="email" />
          </View>
          <FieldMessage fk="email" />

          {/* ── Phone Number ── */}
          <View style={[styles.inputRow, { borderColor: borderColor('phoneNumber'), backgroundColor: bgColor('phoneNumber') }]}>
            <Ionicons name="call-outline" size={18} color={iconColor('phoneNumber')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="09XXXXXXXXX (optional)"
              placeholderTextColor="#bbb"
              value={form.phoneNumber}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '');
                if (cleaned.length <= 11) set('phoneNumber', cleaned);
              }}
              onFocus={() => setFocused('phoneNumber')}
              onBlur={() => { setFocused(''); touch('phoneNumber'); }}
              keyboardType="phone-pad"
              maxLength={11}
            />
            <Text style={[
              styles.charCount,
              form.phoneNumber.length === 11 && isValid('phoneNumber') ? { color: '#27ae60' }
              : form.phoneNumber.length > 0 ? { color: '#e74c3c' } : { color: '#bbb' },
            ]}>
              {form.phoneNumber.length}/11
            </Text>
            <StatusIcon fk="phoneNumber" />
          </View>
          <FieldMessage fk="phoneNumber" />

          {/* ── Password ── */}
          <View style={[styles.inputRow, { borderColor: borderColor('password'), backgroundColor: bgColor('password') }]}>
            <Ionicons name="lock-closed-outline" size={18} color={iconColor('password')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password * (min 6 chars)"
              placeholderTextColor="#bbb"
              value={form.password}
              onChangeText={v => set('password', v)}
              onFocus={() => setFocused('password')}
              onBlur={() => { setFocused(''); touch('password'); }}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#bbb" />
            </TouchableOpacity>
            <StatusIcon fk="password" />
          </View>
          <FieldMessage fk="password" />

          {/* Password strength bar */}
          {form.password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthBar, {
                backgroundColor:
                  form.password.length >= 8 ? '#27ae60' :
                  form.password.length >= 6 ? '#f39c12' : '#e74c3c',
              }]} />
              <Text style={styles.strengthLabel}>
                {form.password.length >= 8 ? '✓ Strong' :
                 form.password.length >= 6 ? '~ Fair'   : '✗ Too short'}
              </Text>
            </View>
          )}

          {/* ── Confirm Password ── */}
          <View style={[styles.inputRow, { borderColor: borderColor('confirmPassword'), backgroundColor: bgColor('confirmPassword') }]}>
            <Ionicons name="lock-closed-outline" size={18} color={iconColor('confirmPassword')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#bbb"
              value={form.confirmPassword}
              onChangeText={v => set('confirmPassword', v)}
              onFocus={() => setFocused('confirmPassword')}
              onBlur={() => { setFocused(''); touch('confirmPassword'); }}
              secureTextEntry={!showPassword}
              autoCorrect={false}
            />
            <StatusIcon fk="confirmPassword" />
          </View>
          <FieldMessage fk="confirmPassword" />

          {/* ── Submit ── */}
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

  // ══════ HEADER ══════
  header: {
    backgroundColor: '#e74c3c',
    paddingTop: 90, paddingHorizontal: 16, paddingBottom: 18,
    overflow: 'hidden', elevation: 6,
    shadowColor: '#c0392b', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8,
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

  // ══════ FORM CARD ══════
  card:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26, paddingTop: 30, minHeight: 540 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#aaa', marginBottom: 20 },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
  errorText: { color: '#c0392b', fontSize: 13, flex: 1 },

  nameRow: { flexDirection: 'row', marginBottom: 0 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, marginBottom: 2,
    paddingHorizontal: 14, borderWidth: 1.5,
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1a1a2e' },
  eyeBtn:    { padding: 6 },
  charCount: { fontSize: 11, fontWeight: '600', marginLeft: 4 },

  nameError: { fontSize: 11, color: '#e74c3c', marginTop: 3, marginBottom: 6, paddingHorizontal: 4 },

  msgRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 8, marginTop: 3, paddingHorizontal: 4,
  },
  msgText: { fontSize: 11, flex: 1 },

  strengthRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 2 },
  strengthBar:   { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, color: '#888', fontWeight: '600' },

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