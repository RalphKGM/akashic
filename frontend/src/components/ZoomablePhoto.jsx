import { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2.5;
const RESET_THRESHOLD = 1.08;

export default function ZoomablePhoto({ uri, isActive }) {
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  const resetZoom = (animated = true) => {
    const next = animated ? withTiming(1, { duration: 180 }) : 1;
    const nextTranslate = animated ? withTiming(0, { duration: 180 }) : 0;
    scale.value = next;
    startScale.value = 1;
    translateX.value = nextTranslate;
    translateY.value = nextTranslate;
    startTranslateX.value = 0;
    startTranslateY.value = 0;
  };

  useEffect(() => {
    if (!isActive) {
      resetZoom(false);
    }
  }, [isActive]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(startScale.value * event.scale, MIN_SCALE, MAX_SCALE);
      scale.value = nextScale;
    })
    .onEnd(() => {
      startScale.value = scale.value;
      if (scale.value <= RESET_THRESHOLD) {
        scale.value = withTiming(1, { duration: 150 });
        startScale.value = 1;
        translateX.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
        startTranslateX.value = 0;
        startTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((event) => {
      if (scale.value <= RESET_THRESHOLD) return;

      const maxX = (containerWidth.value * (scale.value - 1)) / 2;
      const maxY = (containerHeight.value * (scale.value - 1)) / 2;
      translateX.value = clamp(startTranslateX.value + event.translationX, -maxX, maxX);
      translateY.value = clamp(startTranslateY.value + event.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > RESET_THRESHOLD) {
        scale.value = withTiming(1, { duration: 180 });
        startScale.value = 1;
        translateX.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(0, { duration: 180 });
        startTranslateX.value = 0;
        startTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 180 });
        startScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        className="w-full h-full"
        onLayout={(event) => {
          containerWidth.value = event.nativeEvent.layout.width;
          containerHeight.value = event.nativeEvent.layout.height;
        }}
      >
        <Reanimated.View style={[{ width: '100%', height: '100%' }, imageAnimatedStyle]}>
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
        </Reanimated.View>
      </View>
    </GestureDetector>
  );
}
