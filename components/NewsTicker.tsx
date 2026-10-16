import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface Props {
  items: string[];
  height?: number;
}

export default function NewsTicker({ items, height = 34 }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Si no hay items, mostramos un placeholder
  const displayItems = items.length > 0 ? items : ['Sin noticias disponibles'];

  // Unimos los items en una sola cadena con separadores
  const fullText = displayItems.map((t) => `${t}   •••   `).join('');

  // Calculamos el ancho del contenedor
  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Calculamos el ancho del contenido (medido por el texto)
  const onContentLayout = (e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  };

  // Iniciamos / reiniciamos la animación cuando ya sabemos los anchos
  useEffect(() => {
    if (containerWidth === 0 || contentWidth === 0) return;

    // Detenemos animación previa
    animationRef.current?.stop();
    translateX.setValue(0);

    // Duración proporcional al ancho del contenido (velocidad constante ~40px/s)
    const distance = contentWidth + containerWidth;
    const duration = (distance / 40) * 1000;

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -contentWidth,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Reset instantáneo
        Animated.timing(translateX, {
          toValue: containerWidth,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
    };
  }, [containerWidth, contentWidth, fullText]);

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={onContainerLayout}
    >
      <View style={styles.fadeLeft} pointerEvents="none" />
      <View style={styles.fadeRight} pointerEvents="none" />

      <Animated.View
        style={[
          styles.track,
          { transform: [{ translateX }] },
        ]}
      >
        <View onLayout={onContentLayout} style={styles.content}>
          <Text style={styles.text} numberOfLines={1}>
            {fullText}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    position: 'relative',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
  },
  content: {
    paddingHorizontal: 12,
  },
  text: {
    color: '#D4A017',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 2,
    backgroundColor: 'rgba(20,20,20,0.9)',
    // No usamos gradiente para no meter otra dependencia
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 2,
    backgroundColor: 'rgba(20,20,20,0.9)',
  },
});