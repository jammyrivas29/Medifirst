import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────
// 🔑 YOUR GROQ API KEY
// ─────────────────────────────────────────────
const GROQ_API_KEY = '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';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are MediFirst AI, a helpful first aid assistant built into the MediFirst emergency app.

Your role:
- Answer ONLY first aid, medical emergency, and health safety questions
- Give clear, step-by-step instructions when needed
- Always remind users to call emergency services (911 or local emergency number) for life-threatening situations
- Keep answers concise, calm, and easy to follow under stress
- Use simple language — the user may be in an emergency

If the question is NOT related to first aid or medical emergencies, politely say:
"I'm only able to help with first aid and medical emergency questions. Please ask me something related to first aid!"

Always end serious emergency answers with: ⚠️ Call 911 (or your local emergency number) immediately if this is a real emergency.`;

const QUICK_QUESTIONS = [
  'How to do CPR?',
  'Someone is choking, what do I do?',
  'How to treat a burn?',
  'How to stop bleeding?',
  'Signs of a heart attack?',
  'What to do for a broken bone?',
  'How to help someone having a seizure?',
  'What to do if someone is having a stroke?',
  'How to respond to poisoning?',
  'What to do for heat stroke?',
];

async function askGroq(userQuestion) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      messages:    [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userQuestion },
      ],
      temperature: 0.4,
      max_tokens:  512,
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }
  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';
}

// ── Animated message bubble — slides + fades in ──
function MessageBubble({ item }) {
  const slideAnim   = useRef(new Animated.Value(item.isBot ? -25 : 25)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.93)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.bubbleRow,
      item.isBot ? styles.bubbleRowBot : styles.bubbleRowUser,
      { opacity: opacityAnim, transform: [{ translateX: slideAnim }, { scale: scaleAnim }] },
    ]}>
      {item.isBot && (
        <View style={styles.avatar}>
          <Ionicons name="medkit" size={15} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, item.isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, item.isBot ? styles.bubbleTextBot : styles.bubbleTextUser]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, item.isBot ? styles.timestampBot : styles.timestampUser]}>
          {item.time}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Bouncing typing dots ──
function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -7, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue:  0, duration: 280, useNativeDriver: true }),
          Animated.delay(500),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.avatar}>
        <Ionicons name="medkit" size={15} color="#fff" />
      </View>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

export default function ChatbotScreen() {
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [messages, setMessages] = useState([{
    id:    '1',
    text:  "👋 Hi! I'm MediFirst AI Assistant.\n\nI'm powered by Groq AI and can answer any first aid or medical emergency question instantly.\n\n⚠️ For real emergencies, always call 911 first!",
    isBot: true,
    time:  now(),
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef           = useRef(null);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), text: question, isBot: false, time: now() }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askGroq(question);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: reply, isBot: true, time: now() }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id:    (Date.now() + 1).toString(),
        text:  `⚠️ ${error.message}\n\nPlease check your internet connection and try again.`,
        isBot: true,
        time:  now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Quick question chips ── */}
      <View style={styles.chipsWrap}>
        <FlatList
          data={QUICK_QUESTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chip} onPress={() => sendMessage(item)} activeOpacity={0.75}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        />
      </View>

      {/* ── Message list ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Typing dots ── */}
      {loading && <TypingIndicator />}

      {/* ── Input bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask any first aid question..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={19} color="#fff" />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f3f7' },

  // ── Chips ──
  chipsWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  chip:      { backgroundColor: '#fdecea', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#f5c6c6' },
  chipText:  { color: '#e74c3c', fontSize: 12.5, fontWeight: '600' },

  // ── Messages ──
  messageList: { padding: 16, paddingBottom: 8 },

  bubbleRow:     { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  bubbleRowBot:  { alignSelf: 'flex-start', maxWidth: '85%' },
  bubbleRowUser: { alignSelf: 'flex-end',   maxWidth: '85%', flexDirection: 'row-reverse' },

  avatar: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: '#e74c3c',
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     8,
    marginBottom:    4,
    elevation:       2,
    shadowColor:     '#e74c3c',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.3,
    shadowRadius:    4,
  },

  bubble: {
    borderRadius:      18,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  bubbleBot: {
    backgroundColor:        '#fff',
    borderBottomLeftRadius:  4,
    elevation:               2,
    shadowColor:             '#000',
    shadowOffset:            { width: 0, height: 1 },
    shadowOpacity:           0.07,
    shadowRadius:            4,
  },
  bubbleUser: {
    backgroundColor:         '#e74c3c',
    borderBottomRightRadius: 4,
    elevation:               3,
    shadowColor:             '#e74c3c',
    shadowOffset:            { width: 0, height: 2 },
    shadowOpacity:           0.35,
    shadowRadius:            6,
  },

  bubbleText:     { fontSize: 14.5, lineHeight: 22 },
  bubbleTextBot:  { color: '#222' },
  bubbleTextUser: { color: '#fff' },

  timestamp:     { fontSize: 10, marginTop: 5 },
  timestampBot:  { color: '#bbb', textAlign: 'left' },
  timestampUser: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },

  // ── Typing indicator ──
  typingWrap:   { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: {
    flexDirection:          'row',
    backgroundColor:         '#fff',
    borderRadius:            18,
    borderBottomLeftRadius:  4,
    paddingHorizontal:       16,
    paddingVertical:         14,
    alignItems:              'center',
    gap:                     5,
    elevation:               2,
    shadowColor:             '#000',
    shadowOffset:            { width: 0, height: 1 },
    shadowOpacity:           0.07,
    shadowRadius:            4,
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e74c3c' },

  // ── Input bar ──
  inputBar: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    backgroundColor:   '#fff',
    padding:           10,
    paddingHorizontal: 14,
    borderTopWidth:    1,
    borderTopColor:    '#eee',
    gap:               10,
  },
  input: {
    flex:              1,
    borderWidth:       1.5,
    borderColor:       '#e8e8e8',
    borderRadius:      22,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:          15,
    maxHeight:         110,
    color:             '#222',
    backgroundColor:   '#fafafa',
    lineHeight:        22,
  },
  sendBtn: {
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: '#e74c3c',
    justifyContent:  'center',
    alignItems:      'center',
    elevation:       4,
    shadowColor:     '#e74c3c',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.4,
    shadowRadius:    6,
  },
  sendBtnOff: { backgroundColor: '#f5a5a5', elevation: 0, shadowOpacity: 0 },
});