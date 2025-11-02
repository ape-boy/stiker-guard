import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { COLORS, FONT_SIZES } from '@utils/constants';

interface CameraViewProps {
  onStickerConfirm: (hasSticker: boolean) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onStickerConfirm,
  onClose,
}) => {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    } else {
      setIsLoading(false);
    }
  }, [hasPermission]);

  const handleStickerYes = () => {
    onStickerConfirm(true);
  };

  const handleStickerNo = () => {
    onStickerConfirm(false);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>카메라 준비 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 프리뷰 */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={false}
        video={false}
      />

      {/* 닫기 버튼 */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* 오버레이 UI */}
      <View style={styles.overlay}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            스티커가 부착되어 있나요?
          </Text>
          <Text style={styles.hintText}>
            후면 카메라를 확인하고 선택해주세요
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.yesButton]}
            onPress={handleStickerYes}
          >
            <Text style={styles.buttonIcon}>✓</Text>
            <Text style={styles.buttonText}>스티커 있음</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={handleStickerNo}
          >
            <Text style={styles.buttonIcon}>✗</Text>
            <Text style={styles.buttonText}>스티커 없음</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  questionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: FONT_SIZES.H3,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  hintText: {
    fontSize: FONT_SIZES.CAPTION,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    // ⚡ MEDIUM #2 수정: gap 프로퍼티는 React Native 0.76에서 비공식이므로 marginBottom 사용
  },
  button: {
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // ⚡ MEDIUM #2 수정: gap 제거
  },
  yesButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  noButton: {
    backgroundColor: COLORS.GRAY,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 8, // gap 대체
    color: 'white',
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: FONT_SIZES.BUTTON,
    fontWeight: 'bold',
    color: 'white',
  },
  permissionText: {
    fontSize: FONT_SIZES.H3,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 40,
  },
  permissionButtonText: {
    fontSize: FONT_SIZES.BUTTON,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.BODY,
    color: 'white',
    marginTop: 16,
  },
});
