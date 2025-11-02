import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '@stores/authStore';
import { useLocationStore } from '@stores/locationStore';
import { locationService } from '@services/locationService';
import { notificationService } from '@services/notificationService';
import { COLORS, COMPANY_LOCATION } from '@utils/constants';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const { userId } = useAuthStore();
  const { isMonitoring } = useLocationStore();

  const [locationEnabled, setLocationEnabled] = useState(isMonitoring);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // 위치 모니터링 토글
  const handleLocationToggle = async (value: boolean) => {
    if (!userId) return;

    try {
      if (value) {
        await locationService.startMonitoring(userId);
        Alert.alert('위치 추적 시작', '회사 근처 도착 시 자동으로 알림을 받습니다.');
      } else {
        await locationService.stopMonitoring();
        Alert.alert('위치 추적 중지', '위치 추적이 중지되었습니다.');
      }
      setLocationEnabled(value);
    } catch (error) {
      console.error('위치 추적 토글 실패:', error);
      Alert.alert('오류', '위치 추적 설정 변경에 실패했습니다.');
    }
  };

  // 알림 권한 토글
  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (value) {
        const granted = await notificationService.requestPermission();
        if (granted) {
          Alert.alert('알림 활성화', '체크인 알림을 받을 수 있습니다.');
          setNotificationsEnabled(true);
        } else {
          Alert.alert(
            '권한 필요',
            '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
            [
              { text: '취소', style: 'cancel' },
              {
                text: '설정 열기',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          '알림 비활성화',
          '알림을 끄면 체크인 알림을 받지 못합니다. 계정 잠금 위험이 있습니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '끄기',
              style: 'destructive',
              onPress: () => setNotificationsEnabled(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('알림 권한 토글 실패:', error);
    }
  };

  // 위치 권한 설정 열기
  const handleLocationSettings = () => {
    Alert.alert(
      '위치 권한 설정',
      '위치 권한을 "항상 허용"으로 설정해야 백그라운드에서도 동작합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '설정 열기',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  // 앱 정보
  const handleAbout = () => {
    Alert.alert(
      '스티커 가드',
      '버전: 1.0.0\n\n회사 보안 준수를 위한 카메라 스티커 자동 관리 앱\n\n개발: Sticker Guard Team',
      [{ text: '확인' }]
    );
  };

  // 이용약관
  const handleTerms = () => {
    Alert.alert(
      '이용약관',
      '이용약관 내용은 다음 링크에서 확인하세요:\n\nhttps://stickerguard.com/terms',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '웹사이트 열기',
          onPress: () => Linking.openURL('https://stickerguard.com/terms'),
        },
      ]
    );
  };

  // 개인정보처리방침
  const handlePrivacy = () => {
    Alert.alert(
      '개인정보처리방침',
      '개인정보처리방침은 다음 링크에서 확인하세요:\n\nhttps://stickerguard.com/privacy',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '웹사이트 열기',
          onPress: () => Linking.openURL('https://stickerguard.com/privacy'),
        },
      ]
    );
  };

  // 문의하기
  const handleContact = () => {
    Alert.alert(
      '문의하기',
      '문의사항이 있으시면 이메일로 연락주세요:\n\nsupport@stickerguard.com',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '이메일 보내기',
          onPress: () => Linking.openURL('mailto:support@stickerguard.com'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>푸시 알림</Text>
              <Text style={styles.settingDesc}>
                체크인 알림을 받습니다 (필수)
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#E0E0E0', true: COLORS.PRIMARY }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 위치 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>위치 설정</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>위치 추적</Text>
              <Text style={styles.settingDesc}>
                회사 근처 도착 시 자동 알림 (필수)
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: '#E0E0E0', true: COLORS.PRIMARY }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={handleLocationSettings}
          >
            <Text style={styles.linkText}>위치 권한 설정</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>📍 회사 위치 정보</Text>
            <Text style={styles.infoDetail}>
              위도: {COMPANY_LOCATION.latitude}
            </Text>
            <Text style={styles.infoDetail}>
              경도: {COMPANY_LOCATION.longitude}
            </Text>
            <Text style={styles.infoDetail}>
              반경: {COMPANY_LOCATION.radius}m
            </Text>
          </View>
        </View>

        {/* 계정 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 정보</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>사용자 ID</Text>
            <Text style={styles.infoDetail}>{userId || '알 수 없음'}</Text>
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>

          <TouchableOpacity style={styles.linkRow} onPress={handleAbout}>
            <Text style={styles.linkText}>앱 정보</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={handleTerms}>
            <Text style={styles.linkText}>이용약관</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={handlePrivacy}>
            <Text style={styles.linkText}>개인정보처리방침</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={handleContact}>
            <Text style={styles.linkText}>문의하기</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linkText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  infoDetail: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  bottomSpace: {
    height: 40,
  },
});
