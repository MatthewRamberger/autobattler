import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
  color: string;
  fontSize?: number;
  onDone?: () => void;
}

export default function FloatingNumber({ text, color, fontSize = 16, onDone }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -32, duration: 900, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 120, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start(() => onDone?.());
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { transform: [{ translateY }, { scale }], opacity }]}
    >
      <Text style={[styles.text, { color, fontSize, textShadowColor: '#000' }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    alignItems: 'center',
  },
  text: {
    fontWeight: '900',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
