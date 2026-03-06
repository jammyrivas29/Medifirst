import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const VIDEOS = [
  { id: 1,  title: 'CPR Basics for Adults',         category: 'cpr',        duration: '3:45', videoUrl: require('../../../assets/videos/Adult.mp4'),     description: 'Learn the essential steps of performing CPR on adults in emergency situations.' },
  { id: 2,  title: 'CPR for Children',              category: 'cpr',        duration: '4:10', videoUrl: require('../../../assets/videos/chil.mp4'),      description: 'Step-by-step guide to performing CPR on children and infants safely and effectively.' },
  { id: 3,  title: 'CPR for Baby',                  category: 'cpr',        duration: '2:41', videoUrl: require('../../../assets/videos/baby.mp4'),      description: 'Step-by-step demonstration of the Heimlich maneuver to help someone who is choking.' },
  { id: 4,  title: 'Heimlich Maneuver for Choking', category: 'choking',    duration: '2:41', videoUrl: require('../../../assets/videos/choking.mp4'),   description: 'Step-by-step demonstration of the Heimlich maneuver to help someone who is choking.' },
  { id: 5,  title: 'Treating Burns Properly',       category: 'burns',      duration: '1:30', videoUrl: require('../../../assets/videos/burns.mp4'),     description: 'Learn how to properly treat first, second, and third-degree burns.' },
  { id: 6,  title: 'Controlling Severe Bleeding',   category: 'bleeding',   duration: '4:27', videoUrl: require('../../../assets/videos/bleeding.mp4'),  description: 'Techniques for applying pressure and controlling severe bleeding in emergency situations.' },
  { id: 7,  title: 'Fracture Immobilization',       category: 'fractures',  duration: '2:52', videoUrl: require('../../../assets/videos/fractures.mp4'), description: 'How to properly immobilize a fractured bone using splints and available materials.' },
  { id: 8,  title: 'Seizure Guidelines',            category: 'seizures',   duration: '2:35', videoUrl: require('../../../assets/videos/seizures.mp4'),  description: 'Learn how to safely assist someone experiencing a seizure.' },
  { id: 9,  title: 'Stroke Recognition',            category: 'stroke',     duration: '3:15', videoUrl: require('../../../assets/videos/stroke.mp4'),    description: 'Recognize the signs of a stroke and learn how to respond quickly.' },
  { id: 10, title: 'Poisoning Response',            category: 'poison',     duration: '2:20', videoUrl: require('../../../assets/videos/poison.mp4'),    description: 'Steps to take if you suspect someone has been poisoned.' },
  { id: 11, title: 'Heat Stroke Response',          category: 'heat_stroke',duration: '3:05', videoUrl: require('../../../assets/videos/heatstroke.mp4'),description: 'Learn how to respond to heat stroke and prevent it from worsening.' },
];

const CATEGORY_COLORS = {
  cpr: '#e74c3c', choking: '#e67e22', burns: '#f39c12',
  bleeding: '#c0392b', fractures: '#0ed180', seizures: '#3498db',
  heatstroke: '#e74c3c', stroke: '#9b59b6', poison: '#27ae60',
};

const formatTime = (sec) => {
  if (!sec || isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Video Player ──────────────────────────────────────────────────────────────
function VideoPlayer({ selectedVideo, onClose }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [isPlaying, setIsPlaying]     = useState(true);
  const [isReady, setIsReady]         = useState(false);

  const player = useVideoPlayer(selectedVideo.videoUrl, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
    p.play();
  });

  // ── KEY FIX: set StatusBar dark when player mounts, restore when it unmounts ──
  useEffect(() => {
    // Enter video mode: black status bar
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor('#000');

    return () => {
      // EXIT video mode: restore to app default (red header style)
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor('#e74c3c');
    };
  }, []);

  // Pause when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        try { player?.pause(); } catch (_) {}
      };
    }, [player])
  );

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    try {
      setIsReady(status === 'readyToPlay');
      if (player?.duration > 0) setDuration(player.duration);
    } catch (_) {}
  }, [status]);

  const { isPlaying: eventPlaying } = useEvent(player, 'playingChange', { isPlaying: true });
  useEffect(() => { setIsPlaying(eventPlaying); }, [eventPlaying]);

  const { currentTime: eventTime } = useEvent(player, 'timeUpdate', { currentTime: 0, bufferedPosition: 0 });
  useEffect(() => {
    if (eventTime !== undefined && eventTime >= 0) setCurrentTime(eventTime);
    try {
      if (player?.duration > 0 && duration === 0) setDuration(player.duration);
    } catch (_) {}
  }, [eventTime]);

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    try { isPlaying ? player.pause() : player.play(); } catch (_) {}
  }, [player, isPlaying]);

  const handleClose = useCallback(() => {
    try { player?.pause(); } catch (_) {}
    onClose();
  }, [player, onClose]);

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <View style={styles.playerContainer}>
      {/* Back button */}
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.closeBtnText}>Back to List</Text>
      </TouchableOpacity>

      {/* Video */}
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={false}
      />

      {/* Play / Pause */}
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtn} activeOpacity={0.8}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress bar + Timer */}
      <View style={styles.timerBar}>
        <Text style={styles.timerText}>{formatTime(currentTime)}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.timerText}>
          {duration > 0 ? formatTime(duration) : selectedVideo.duration}
        </Text>
      </View>

      {/* Loading banner */}
      {!isReady && (
        <View style={styles.loadingBanner}>
          <Text style={styles.loadingText}>⏳ Loading video...</Text>
        </View>
      )}

      {/* Video Info */}
      <ScrollView style={styles.videoInfoScroll}>
        <View style={styles.videoInfo}>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[selectedVideo.category] || '#e74c3c' }]}>
            <Text style={styles.categoryBadgeText}>{selectedVideo.category?.toUpperCase()}</Text>
          </View>
          <Text style={styles.videoTitle}>{selectedVideo.title}</Text>
          <View style={styles.videoDurationRow}>
            <Ionicons name="time-outline" size={16} color="#888" />
            <Text style={styles.videoDuration}>
              {`${formatTime(currentTime)} / ${duration > 0 ? formatTime(duration) : selectedVideo.duration}`}
            </Text>
          </View>
          <Text style={styles.videoDesc}>{selectedVideo.description}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function VideoInstructionsScreen({ route }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  // ── KEY FIX: always restore StatusBar when showing the video list ──
  useEffect(() => {
    if (!selectedVideo) {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor('#e74c3c');
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (route?.params?.autoPlay) {
      const autoVideo =
        VIDEOS.find(v => v.videoUrl === route.params.autoPlay.videoUrl) ||
        route.params.autoPlay;
      setSelectedVideo(autoVideo);
    }
  }, [route?.params?.autoPlay]);

  if (selectedVideo) {
    return (
      <VideoPlayer
        selectedVideo={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="play-circle" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Instructional Videos</Text>
            <Text style={styles.headerSub}>{VIDEOS.length} videos available</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📹 Learn First Aid with Videos</Text>

        {VIDEOS.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={styles.videoCard}
            onPress={() => setSelectedVideo(video)}
            activeOpacity={0.8}
          >
            <View style={[styles.thumbnail, { backgroundColor: CATEGORY_COLORS[video.category] || '#e74c3c' }]}>
              <Ionicons name="play-circle" size={40} color="#fff" />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{video.duration}</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={[styles.catTag, { backgroundColor: (CATEGORY_COLORS[video.category] || '#e74c3c') + '20' }]}>
                <Text style={[styles.catTagText, { color: CATEGORY_COLORS[video.category] || '#e74c3c' }]}>
                  {video.category.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{video.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{video.description}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={22} color="#f39c12" />
          <Text style={styles.tipText}>
            Watch these videos before an emergency so you'll be prepared when help is needed.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#8e44ad', padding: 20, gap: 14,
  },
  headerIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  list: { paddingBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', margin: 16, marginBottom: 10 },
  videoCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    elevation: 2, alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  thumbnail: {
    width: 100, height: 80,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  durationBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardContent:  { flex: 1, padding: 12 },
  catTag: {
    alignSelf: 'flex-start', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6, marginBottom: 6,
  },
  catTagText:  { fontSize: 10, fontWeight: '700' },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  cardDesc:    { fontSize: 12, color: '#888', lineHeight: 17 },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fffbf0', margin: 16, borderRadius: 12,
    padding: 16, gap: 12, borderLeftWidth: 4, borderLeftColor: '#f39c12',
  },
  tipText: { flex: 1, fontSize: 13, color: '#856404', lineHeight: 20 },

  // ── Player ──
  playerContainer: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  video:        { width, height: width * 9 / 16 },
  controlsRow: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000', paddingVertical: 14,
  },
  playPauseBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  timerBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 8, gap: 10,
  },
  timerText:     { color: '#fff', fontSize: 12, fontWeight: '600', minWidth: 38 },
  progressTrack: { flex: 1, height: 4, backgroundColor: '#444', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#e74c3c', borderRadius: 2 },
  loadingBanner: { backgroundColor: '#222', paddingVertical: 6, alignItems: 'center' },
  loadingText:   { color: '#aaa', fontSize: 12 },
  videoInfoScroll: { flex: 1, backgroundColor: '#fff' },
  videoInfo:       { padding: 20 },
  categoryBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8, marginBottom: 10,
  },
  categoryBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  videoTitle:        { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  videoDurationRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  videoDuration:     { fontSize: 14, color: '#888' },
  videoDesc:         { fontSize: 14, color: '#555', lineHeight: 22 },
});