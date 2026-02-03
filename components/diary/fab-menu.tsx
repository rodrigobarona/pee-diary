import * as React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/context';

export function FABMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = React.useCallback(
    (action: string) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIsOpen(false);
      switch (action) {
        case 'urination':
          router.push('/add/urination');
          break;
        case 'fluid':
          router.push('/add/fluid');
          break;
        case 'leak':
          router.push('/add/leak');
          break;
      }
    },
    [router]
  );

  // Use text fallback on web if icons don't render
  const renderIcon = (name: string, size: number, color: string) => {
    if (Platform.OS === 'web') {
      // Use unicode symbols as fallback
      const iconMap: Record<string, string> = {
        'plus': '+',
        'close': '×',
        'toilet': '🚽',
        'cup-water': '💧',
        'water-alert': '⚠️',
      };
      if (name === 'plus' || name === 'close') {
        return (
          <Text style={{ fontSize: size, color, fontWeight: 'bold', lineHeight: size }}>
            {iconMap[name]}
          </Text>
        );
      }
    }
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      {/* Menu Items - shown when open */}
      {isOpen ? (
        <View style={styles.menuContainer}>
          <Pressable
            onPress={() => handleSelect('urination')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#83C5BE' }]}>
              {renderIcon('toilet', 20, '#006D77')}
            </View>
            <Text className="text-sm font-medium text-foreground">
              {t('entry.addUrination')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelect('fluid')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FFDDD2' }]}>
              {renderIcon('cup-water', 20, '#E29578')}
            </View>
            <Text className="text-sm font-medium text-foreground">
              {t('entry.addFluid')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelect('leak')}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
              {renderIcon('water-alert', 20, '#EF4444')}
            </View>
            <Text className="text-sm font-medium text-foreground">
              {t('entry.addLeak')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* FAB Button */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add new entry"
        accessibilityHint="Opens menu to add urination, fluid intake, or leak entry"
      >
        {Platform.OS === 'web' ? (
          <Text style={styles.fabIconText}>
            {isOpen ? '×' : '+'}
          </Text>
        ) : (
          <MaterialCommunityIcons
            name={isOpen ? 'close' : 'plus'}
            size={28}
            color="#FFFFFF"
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006D77',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  fabIconText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
