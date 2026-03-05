import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function Loading({ fullScreen = false, message = 'Loading...' }) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color="#e74c3c" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  fullScreen: { flex: 1, backgroundColor: '#fff' },
  text: { marginTop: 10, color: '#666', fontSize: 14 }
});
