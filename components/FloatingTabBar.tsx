import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

const NAV_ICONS: Record<string, any> = {
  index: require('@/assets/images/nav/Home.png'),
  library: require('@/assets/images/nav/Library.png'),
  discover: require('@/assets/images/nav/Discover.png'),
  search: require('@/assets/images/nav/Search.png'),
  profile: require('@/assets/images/nav/Profile.png'),
};

const TAB_LABELS: Record<string, string> = {
  index: 'Today',
  library: 'Library',
  discover: 'Discover',
  search: 'Search',
  profile: 'Profile',
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const isDark = colors.foreground === '#FFFFFF' || colors.background === '#181412';
  const activePillBg = isDark ? '#38302A' : '#EAE6E1';
  const activePillBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  const bottomOffset = Math.max(insets.bottom, isWeb ? 18 : 12);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View
        style={[
          styles.pillBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: '#1A1410',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconSource = NAV_ICONS[route.name] || NAV_ICONS.index;
          const label = TAB_LABELS[route.name] || route.name;

          const onPress = () => {
            Haptics.selectionAsync();

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.75}
              style={[
                styles.tabItem,
                isFocused && [
                  styles.tabItemActive,
                  {
                    backgroundColor: activePillBg,
                    borderColor: activePillBorder,
                  },
                ],
              ]}
            >
              <Image
                source={iconSource}
                style={[
                  styles.iconImage,
                  isFocused ? styles.iconImageActive : styles.iconImageInactive,
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  pillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 36,
    borderWidth: 1,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 30px -4px rgba(26, 20, 16, 0.18), 0 4px 12px -2px rgba(26, 20, 16, 0.08)',
        backdropFilter: 'blur(16px)',
      },
    }),
  },
  tabItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  tabItemActive: {
    borderWidth: 1,
    shadowColor: '#000000',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.24)',
        transform: 'scale(1.04)',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  iconImageActive: {
    opacity: 1,
  },
  iconImageInactive: {
    opacity: 0.38,
    ...Platform.select({
      web: {
        filter: 'grayscale(0.65) contrast(0.9)',
        transition: 'all 0.18s ease',
      },
    }),
  },
});
