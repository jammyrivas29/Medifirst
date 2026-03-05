import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Linking, Modal,
  StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGuideById } from '../../api/firstAidApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GUIDE_VIDEO_MAP = {
  local_cpr:        { videoUrl: require('../../../assets/videos/cpr.mp4'),        title: 'How to Perform CPR',            duration: '3:50', category: 'cpr'        },
  local_choking:    { videoUrl: require('../../../assets/videos/choking.mp4'),    title: 'Heimlich Maneuver for Choking', duration: '2:41', category: 'choking'    },
  local_burns:      { videoUrl: require('../../../assets/videos/burns.mp4'),      title: 'Treating Burns Properly',       duration: '1:30', category: 'burns'      },
  local_bleeding:   { videoUrl: require('../../../assets/videos/bleeding.mp4'),   title: 'Controlling Severe Bleeding',   duration: '4:27', category: 'bleeding'   },
  local_fractures:  { videoUrl: require('../../../assets/videos/fractures.mp4'),  title: 'Fracture Immobilization',       duration: '2:52', category: 'fractures'  },
  local_seizure:    { videoUrl: require('../../../assets/videos/seizures.mp4'),   title: 'Seizure Guidelines',            duration: '2:35', category: 'seizures'   },
  local_stroke:     { videoUrl: require('../../../assets/videos/stroke.mp4'),     title: 'Stroke Recognition',            duration: '3:15', category: 'stroke'     },
  local_poison:     { videoUrl: require('../../../assets/videos/poison.mp4'),     title: 'Poisoning Response',            duration: '2:20', category: 'poison'     },
  local_heatstroke: { videoUrl: require('../../../assets/videos/heatstroke.mp4'), title: 'Heat Stroke Response',          duration: '3:05', category: 'heat_stroke'},
};

const SEVERITY_COLORS = {
  critical: '#e74c3c', high: '#e67e22', medium: '#f39c12', low: '#27ae60',
};
const SEVERITY_BG = {
  critical: '#fdecea', high: '#fef5ec', medium: '#fef9e7', low: '#e9f7ef',
};
const PLACEHOLDER_ICONS = {
  cpr: 'heart', choking: 'warning', burns: 'flame', bleeding: 'bandage',
  fractures: 'body', seizures: 'pulse', seizure: 'pulse', stroke: 'sunny',
  poison: 'skull', other: 'list',
};

// ─── CPR mode config (matches GuidesListScreen CPR_MODES keys) ────────────────
const CPR_MODE_CONFIG = [
  {
    key:     'adult',
    label:   'Adult',
    ageNote: 'Ages 8 and older',
    icon:    'person',
    color:   '#e74c3c',
    bg:      '#fdecea',
    details: ['Use 2 hands', 'Push 2 inches deep', '30 compressions : 2 breaths'],
  },
  {
    key:     'child',
    label:   'Child',
    ageNote: 'Ages 1 – 7',
    icon:    'body',
    color:   '#e67e22',
    bg:      '#fef5ec',
    details: ['Use 1 or 2 hands', 'Push 2 inches deep', '30 compressions : 2 breaths'],
  },
  {
    key:     'baby',
    label:   'Baby / Infant',
    ageNote: 'Under 1 year old',
    icon:    'happy',
    color:   '#8e44ad',
    bg:      '#f5eef8',
    details: ['Use 2 fingers only', 'Push 1.5 inches deep', '30 compressions : 2 breaths'],
  },
];

// ── Fullscreen Image Modal ────────────────────────────────────────────────────
function ImageModal({ visible, imageSource, caption, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={modalStyles.imgContainer}>
          {imageSource && (
            <Image source={imageSource} style={modalStyles.fullImg} resizeMode="contain" />
          )}
        </TouchableOpacity>
        <View style={modalStyles.footer}>
          {caption
            ? <Text style={modalStyles.captionText}>{caption}</Text>
            : <Text style={modalStyles.tapHintText}>Tap anywhere to close</Text>
          }
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn:     { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  imgContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.72, justifyContent: 'center', alignItems: 'center' },
  fullImg:      { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.72 },
  footer:       { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  captionText:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  tapHintText:  { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
});

// ── CPR Selector Component ────────────────────────────────────────────────────
function CprSelector({ guide, onSelect, sevColor, sevBg }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={cprStyles.container} showsVerticalScrollIndicator={false}>

      {/* Info card — same style as normal guide's info card */}
      <View style={[cprStyles.infoCard, { backgroundColor: sevBg, borderLeftColor: sevColor }]}>
        <View style={cprStyles.infoCardTop}>
          <View style={[cprStyles.sevBadge, { backgroundColor: sevColor }]}>
            <Text style={cprStyles.sevBadgeText}>{guide.severity?.toUpperCase()}</Text>
          </View>
          <View style={cprStyles.catBadge}>
            <Text style={cprStyles.catBadgeText}>CPR</Text>
          </View>
        </View>
        <Text style={cprStyles.infoDesc}>{guide.description}</Text>
      </View>

      {/* Prompt */}
      <View style={cprStyles.promptRow}>
        <Ionicons name="help-circle" size={24} color={sevColor} />
        <View style={{ flex: 1 }}>
          <Text style={cprStyles.promptTitle}>Who needs CPR?</Text>
          <Text style={cprStyles.promptSub}>Select the victim's age group to see the correct technique</Text>
        </View>
      </View>

      {/* One card per CPR mode */}
      {CPR_MODE_CONFIG.map((mode) => (
        <TouchableOpacity
          key={mode.key}
          style={[cprStyles.modeCard, { borderLeftColor: mode.color }]}
          onPress={() => onSelect(mode.key)}
          activeOpacity={0.78}
        >
          {/* Coloured header band */}
          <View style={[cprStyles.modeHeader, { backgroundColor: mode.bg }]}>
            <View style={[cprStyles.modeIconWrap, { backgroundColor: mode.color }]}>
              <Ionicons name={mode.icon} size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[cprStyles.modeLabel, { color: mode.color }]}>{mode.label}</Text>
              <Text style={cprStyles.modeAge}>{mode.ageNote}</Text>
            </View>
            <View style={[cprStyles.startBtn, { backgroundColor: mode.color }]}>
              <Text style={cprStyles.startBtnText}>Start</Text>
              <Ionicons name="arrow-forward" size={13} color="#fff" />
            </View>
          </View>

          {/* Key technique details */}
          <View style={cprStyles.detailsRow}>
            {mode.details.map((d, i) => (
              <View key={i} style={cprStyles.detailItem}>
                <Ionicons name="checkmark-circle" size={13} color={mode.color} />
                <Text style={cprStyles.detailText}>{d}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      {/* Warnings — same as normal guide warnings card */}
      {guide.warnings?.length > 0 && (
        <View style={cprStyles.warnCard}>
          <View style={cprStyles.warnHeader}>
            <Ionicons name="warning" size={20} color="#e67e22" />
            <Text style={cprStyles.warnTitle}>Important Warnings</Text>
          </View>
          {guide.warnings.map((w, i) => (
            <View key={i} style={cprStyles.warnRow}>
              <View style={cprStyles.warnDot} />
              <Text style={cprStyles.warnText}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const cprStyles = StyleSheet.create({
  container:    { padding: 16 },
  infoCard:     { borderRadius: 14, padding: 16, marginBottom: 20, borderLeftWidth: 5 },
  infoCardTop:  { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  sevBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sevBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  catBadge:     { backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  catBadgeText: { color: '#444', fontSize: 11, fontWeight: '700' },
  infoDesc:     { fontSize: 14, color: '#444', lineHeight: 21 },

  promptRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  promptTitle:  { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 3 },
  promptSub:    { fontSize: 12, color: '#888', lineHeight: 18 },

  modeCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 14,
    borderLeftWidth: 5, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
  },
  modeHeader:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  modeIconWrap: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  modeLabel:    { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  modeAge:      { fontSize: 12, color: '#888' },
  startBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  detailsRow:   { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  detailItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText:   { fontSize: 12.5, color: '#555', lineHeight: 18 },

  warnCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 4, borderLeftWidth: 4, borderLeftColor: '#e67e22', elevation: 2 },
  warnHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  warnTitle:    { fontSize: 16, fontWeight: '800', color: '#e67e22' },
  warnRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  warnDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e67e22', marginTop: 6 },
  warnText:     { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GuideDetailScreen({ navigation, route }) {
  const { guideId, localGuide } = route.params || {};

  const [guide, setGuide]               = useState(localGuide || null);
  const [loading, setLoading]           = useState(!localGuide);
  const [activeStep, setActiveStep]     = useState(0);
  const [imgErrors, setImgErrors]       = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage]     = useState(null);
  const [modalCaption, setModalCaption] = useState('');
  // null = show CPR selector  |  'adult' | 'child' | 'baby' = show that mode's steps
  const [cprMode, setCprMode]           = useState(null);
  const scrollRef = useRef(null);

  const guideKey    = guideId || localGuide?._id;
  const linkedVideo = GUIDE_VIDEO_MAP[guideKey] || null;
  const isCpr       = guide?.hasCprModes === true;

  useEffect(() => { if (!localGuide) fetchGuide(); }, [guideId]);
  // Reset CPR selection whenever guide changes
  useEffect(() => { setCprMode(null); setActiveStep(0); }, [guideKey]);

  const fetchGuide = async () => {
    try {
      const data = await getGuideById(guideId);
      if (data?.guide) setGuide(data.guide);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleImgError = (idx) => setImgErrors(prev => ({ ...prev, [idx]: true }));

  const scrollToStep = (idx) => {
    setActiveStep(idx);
    scrollRef.current?.scrollTo({ y: idx * 340, animated: true });
  };

  const openImage = (imageSource, caption = '') => {
    setModalImage(imageSource);
    setModalCaption(caption);
    setModalVisible(true);
  };

  const call911 = () => {
    Alert.alert('🚨 Call 911', 'Do you want to call emergency services?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
    ]);
  };

  const handleWatchVideo = () => {
    if (!linkedVideo) return;
    navigation.navigate('Videos', { autoPlay: linkedVideo });
  };

  // Back: inside CPR mode → go back to selector first; otherwise leave screen
  const handleBack = () => {
    if (isCpr && cprMode) { setCprMode(null); setActiveStep(0); }
    else navigation.goBack();
  };

  // ── Loading / error ──────────────────────────────────────────────────────
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#e74c3c" />
      <Text style={styles.loadingText}>Loading guide…</Text>
    </View>
  );

  if (!guide) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
      <Text style={styles.errorText}>Guide not found.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Resolve severity colours (adapt when in a CPR mode) ─────────────────
  const activeModeConfig = isCpr && cprMode ? CPR_MODE_CONFIG.find(m => m.key === cprMode) : null;
  const sevColor         = activeModeConfig ? activeModeConfig.color : (SEVERITY_COLORS[guide.severity] || '#999');
  const sevBg            = activeModeConfig ? activeModeConfig.bg    : (SEVERITY_BG[guide.severity]     || '#f5f5f5');

  // ── Steps to render ──────────────────────────────────────────────────────
  const stepsToRender  = isCpr && cprMode ? (guide.cprModes?.[cprMode]?.steps || []) : (guide.steps || []);
  const totalSteps     = stepsToRender.length;
  const placeholderIcon= PLACEHOLDER_ICONS[guide.category] || 'medical';

  // ── Nav title ────────────────────────────────────────────────────────────
  const navTitle = isCpr && activeModeConfig
    ? `CPR — ${activeModeConfig.label} (${activeModeConfig.ageNote})`
    : guide.title;

  return (
    <View style={styles.root}>

      {/* ── Fullscreen Image Modal ── */}
      <ImageModal
        visible={modalVisible}
        imageSource={modalImage}
        caption={modalCaption}
        onClose={() => setModalVisible(false)}
      />

      {/* ── Sticky Header ── */}
      <View style={[styles.stickyHeader, { backgroundColor: sevColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.stickyTitle} numberOfLines={1}>{navTitle}</Text>

        {/* CPR: "Change" pill to go back to selector without leaving screen */}
        {isCpr && activeModeConfig && (
          <TouchableOpacity
            onPress={() => { setCprMode(null); setActiveStep(0); }}
            style={styles.changeBtn}
          >
            <Ionicons name="swap-horizontal" size={13} color="#fff" />
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={call911} style={styles.sos}>
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.sosText}>911</Text>
        </TouchableOpacity>
      </View>

      {/* ── CPR Selector OR Normal Step View ── */}
      {isCpr && !cprMode ? (
        /* Show the age-group picker */
        <CprSelector
          guide={guide}
          onSelect={setCprMode}
          sevColor={sevColor}
          sevBg={sevBg}
        />
      ) : (
        /* Normal step-by-step view (works for all guides AND selected CPR mode) */
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Info Card ── */}
          <View style={[styles.infoCard, { backgroundColor: sevBg, borderLeftColor: sevColor }]}>
            <View style={styles.infoCardTop}>
              <View style={[styles.sevBadge, { backgroundColor: sevColor }]}>
                <Text style={styles.sevBadgeText}>
                  {isCpr && activeModeConfig ? activeModeConfig.label.toUpperCase() : guide.severity?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>
                  {isCpr ? 'CPR' : guide.category?.toUpperCase()}
                </Text>
              </View>
              {isCpr && activeModeConfig && (
                <View style={[styles.catBadge, { backgroundColor: sevColor + '22' }]}>
                  <Text style={[styles.catBadgeText, { color: sevColor }]}>{activeModeConfig.ageNote}</Text>
                </View>
              )}
            </View>
            <Text style={styles.infoDesc}>
              {isCpr && activeModeConfig
                ? activeModeConfig.details.join(' · ')
                : guide.description
              }
            </Text>
          </View>

          {/* ── Step Navigator Pills ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {stepsToRender.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.pill, activeStep === idx && { backgroundColor: sevColor, borderColor: sevColor }]}
                onPress={() => scrollToStep(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillNum, activeStep === idx && { color: '#fff' }]}>{idx + 1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.stepsSectionLabel}>STEP-BY-STEP INSTRUCTIONS</Text>

          {/* ── Steps ── */}
          {stepsToRender.map((step, idx) => {
            const hasImg   = step.image && !imgErrors[idx];
            const isActive = activeStep === idx;
            const isLast   = idx === totalSteps - 1;
            const imgSrc   = hasImg
              ? (typeof step.image === 'string' ? { uri: step.image } : step.image)
              : null;

            return (
              <React.Fragment key={idx}>
                <TouchableOpacity
                  style={[styles.stepCard, isActive && { borderColor: sevColor, borderWidth: 2 }]}
                  onPress={() => setActiveStep(idx)}
                  activeOpacity={0.9}
                >
                  {/* Step Header */}
                  <View style={[styles.stepHeader, { backgroundColor: sevBg }]}>
                    <View style={[styles.stepNum, { backgroundColor: sevColor }]}>
                      <Text style={styles.stepNumText}>{step.stepNumber}</Text>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>

                  {/* Step Image */}
                  {hasImg ? (
                    <TouchableOpacity
                      activeOpacity={0.92}
                      onPress={() => openImage(imgSrc, step.imageCaption || '')}
                      style={styles.stepImgWrap}
                    >
                      <Image
                        source={imgSrc}
                        style={styles.stepImg}
                        resizeMode="cover"
                        onError={() => handleImgError(idx)}
                      />
                      <View style={styles.expandBadge}>
                        <Ionicons name="expand-outline" size={13} color="#fff" />
                        <Text style={styles.expandBadgeText}>Tap to expand</Text>
                      </View>
                      {step.imageCaption && (
                        <View style={styles.imgCaptionBar}>
                          <Ionicons name="camera-outline" size={12} color="#fff" />
                          <Text style={styles.imgCaption}>{step.imageCaption}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.stepImgPlaceholder, { backgroundColor: sevBg }]}>
                      <Ionicons name={placeholderIcon} size={52} color={sevColor} />
                      <Text style={[styles.placeholderLabel, { color: sevColor }]}>Step {step.stepNumber}</Text>
                    </View>
                  )}

                  {/* Step Description */}
                  <View style={styles.stepBody}>
                    <Text style={styles.stepDesc}>{step.description}</Text>
                  </View>
                </TouchableOpacity>

                {/* Watch Video Button — after the LAST step */}
                {isLast && linkedVideo && (
                  <TouchableOpacity
                    style={[styles.watchVideoBtn, { backgroundColor: sevColor, shadowColor: sevColor }]}
                    onPress={handleWatchVideo}
                    activeOpacity={0.85}
                  >
                    <View style={styles.watchVideoLeft}>
                      <View style={styles.watchVideoIconWrap}>
                        <Ionicons name="play-circle" size={32} color="#fff" />
                      </View>
                      <View style={styles.watchVideoInfo}>
                        <Text style={styles.watchVideoLabel}>WATCH VIDEO GUIDE</Text>
                        <Text style={styles.watchVideoTitle} numberOfLines={1}>{linkedVideo.title}</Text>
                        <View style={styles.watchVideoDurRow}>
                          <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
                          <Text style={styles.watchVideoDur}>{linkedVideo.duration} min</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                )}
              </React.Fragment>
            );
          })}

          {/* ── Warnings ── */}
          {guide.warnings?.length > 0 && (
            <View style={styles.warningsCard}>
              <View style={styles.warningsHeader}>
                <Ionicons name="warning" size={20} color="#e67e22" />
                <Text style={styles.warningsTitle}>Important Warnings</Text>
              </View>
              {guide.warnings.map((w, i) => (
                <View key={i} style={styles.warningRow}>
                  <View style={styles.warningDot} />
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── When to Call Emergency ── */}
          {guide.whenToCallEmergency?.length > 0 && (
            <View style={styles.emergencyCard}>
              <View style={styles.emergencyCardHeader}>
                <Ionicons name="medical" size={20} color="#e74c3c" />
                <Text style={styles.emergencyCardTitle}>When to Call 911</Text>
              </View>
              {guide.whenToCallEmergency.map((item, i) => (
                <View key={i} style={styles.emergencyRow}>
                  <Ionicons name="alert-circle" size={14} color="#e74c3c" />
                  <Text style={styles.emergencyRowText}>{item}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.call911Btn} onPress={call911} activeOpacity={0.85}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.call911Text}>Call 911 Now</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles (identical to the original file) ───────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f6f8' },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
  errorText:   { marginTop: 12, color: '#999', fontSize: 16 },
  backBtn:     { marginTop: 20, backgroundColor: '#e74c3c', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },

  // Header
  stickyHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 18, paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  backArrow:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  stickyTitle:  { flex: 1, fontSize: 16, fontWeight: '800', color: '#fff' },
  changeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  changeBtnText:{ color: '#fff', fontWeight: '700', fontSize: 12 },
  sos:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  sosText:      { color: '#fff', fontWeight: '900', fontSize: 13 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  // Info card
  infoCard:     { borderRadius: 14, padding: 16, marginBottom: 16, borderLeftWidth: 5 },
  infoCardTop:  { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  sevBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sevBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  catBadge:     { backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  catBadgeText: { color: '#444', fontSize: 11, fontWeight: '700' },
  infoDesc:     { fontSize: 14, color: '#444', lineHeight: 21 },

  // Pills
  pillsRow: { paddingBottom: 12, gap: 8, paddingRight: 16 },
  pill:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  pillNum:  { fontSize: 13, fontWeight: '800', color: '#555' },

  stepsSectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1.5, marginBottom: 14 },

  // Step card
  stepCard:    { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, borderWidth: 1.5, borderColor: 'transparent' },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  stepNum:     { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  stepTitle:   { flex: 1, fontSize: 15, fontWeight: '800', color: '#1a1a2e' },

  stepImgWrap:      { position: 'relative' },
  stepImg:          { width: '100%', height: 200 },
  expandBadge:      { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.48)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  expandBadgeText:  { color: '#fff', fontSize: 11, fontWeight: '600' },
  imgCaptionBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.52)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7 },
  imgCaption:       { color: '#fff', fontSize: 12, fontStyle: 'italic', flex: 1 },
  stepImgPlaceholder:{ height: 140, justifyContent: 'center', alignItems: 'center', gap: 8 },
  placeholderLabel: { fontSize: 13, fontWeight: '700' },

  stepBody: { padding: 14 },
  stepDesc: { fontSize: 14, color: '#444', lineHeight: 22 },

  // Watch video
  watchVideoBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
  watchVideoLeft:    { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  watchVideoIconWrap:{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  watchVideoInfo:    { flex: 1 },
  watchVideoLabel:   { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, marginBottom: 3 },
  watchVideoTitle:   { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  watchVideoDurRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchVideoDur:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  // Warnings
  warningsCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e67e22', elevation: 2 },
  warningsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  warningsTitle:  { fontSize: 16, fontWeight: '800', color: '#e67e22' },
  warningRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  warningDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e67e22', marginTop: 6 },
  warningText:    { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },

  // Emergency
  emergencyCard:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c', elevation: 2 },
  emergencyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  emergencyCardTitle:  { fontSize: 16, fontWeight: '800', color: '#e74c3c' },
  emergencyRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  emergencyRowText:    { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  call911Btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e74c3c', borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  call911Text:         { color: '#fff', fontSize: 16, fontWeight: '900' },
});