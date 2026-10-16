import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { PERMISSIONS, ROLES } from '../src/utils/permissions';

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  permission?: string;
  hideForSuperAdmin?: boolean;
  onlyForSuperAdmin?: boolean;
}

const MENU: MenuItem[] = [
  { label: 'Dashboard',     icon: 'home-outline',            route: '/dashboard' },
  { label: 'Calculadora',   icon: 'calculator-outline',      route: '/newtransaction' },
  { label: 'Transacciones', icon: 'swap-horizontal-outline', route: '/transactionlist', permission: PERMISSIONS.TX_VIEW },
  { label: 'Caja',          icon: 'wallet-outline',          route: '/cash',            permission: PERMISSIONS.CASH_VIEW },
  { label: 'Noticias',      icon: 'newspaper-outline',       route: '/news' },
  {
    label: 'Usuarios',
    icon: 'people-outline',
    route: '/users',
    permission: PERMISSIONS.USERS_VIEW,
    hideForSuperAdmin: true,
  },
  { label: 'Perfil',        icon: 'person-outline',          route: '/profile' },
];

const PANEL_WIDTH = 280;

export default function AppHeader(props: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, hasPermission, hasRole, logout } = useAuth();

  // Animación del panel y backdrop
  const slideX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Offset que sigue al dedo durante el swipe (parte de 0)
  const gestureX = useRef(new Animated.Value(0)).current;

  // ---- Extraer props (acepta options o props directas) ----
  const options = props?.options ?? {};
  const title: string = options.title ?? props?.title ?? '';
  const showBack: boolean = options.showBack ?? props?.showBack ?? false;
  const rightIcon: keyof typeof Ionicons.glyphMap | undefined =
    options.rightIcon ?? props?.rightIcon;
  const onRightPress: (() => void) | undefined =
    options.onRightPress ?? props?.onRightPress;

  // ---------- ABRIR ----------
  const openMenu = () => {
    setMenuVisible(true);
    slideX.setValue(-PANEL_WIDTH);
    gestureX.setValue(0);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(slideX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ---------- CERRAR ----------
  const closeMenu = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -PANEL_WIDTH,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      gestureX.setValue(0);
      setMenuVisible(false);
      after?.();
    });
  };

  // ---------- SWIPE ----------
  const panelPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) && g.dx < 0,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          gestureX.setValue(g.dx);
          const progress = Math.max(0, 1 + g.dx / PANEL_WIDTH);
          backdropOpacity.setValue(progress);
        }
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dx < -PANEL_WIDTH / 3 || g.vx < -0.5;

        if (shouldClose) {
          Animated.parallel([
            Animated.timing(gestureX, {
              toValue: -PANEL_WIDTH,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            gestureX.setValue(0);
            slideX.setValue(-PANEL_WIDTH);
            setMenuVisible(false);
          });
        } else {
          Animated.parallel([
            Animated.spring(gestureX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(gestureX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // ---------- Navegación ----------
  const goTo = (route: string) => {
    closeMenu(() => setTimeout(() => router.push(route as any), 50));
  };

  const onLogout = () => {
    closeMenu(() => {
      setTimeout(() => {
        Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Salir',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/login');
            },
          },
        ]);
      }, 150);
    });
  };

  // ---------- Filtro de items ----------
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  const visibleItems = MENU.filter((item) => {
    if (item.hideForSuperAdmin && isSuperAdmin) return false;
    if (item.onlyForSuperAdmin && !isSuperAdmin) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <>
      {/* ==================== BARRA SUPERIOR ==================== */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (showBack) router.back();
            else openMenu();
          }}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showBack ? 'arrow-back' : 'menu'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={[styles.iconBtn, styles.addBtn]}
            activeOpacity={0.8}
          >
            <Ionicons name={rightIcon} size={22} color="#0B0B0B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      {/* ==================== MENÚ LATERAL ==================== */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeMenu()}
        statusBarTranslucent
      >
        <View style={styles.menuOverlay}>
          <Animated.View
            style={[styles.menuBackdrop, { opacity: backdropOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeMenu()}
            />
          </Animated.View>

          <Animated.View
            {...panelPan.panHandlers}
            style={[
              styles.menuPanel,
              {
                transform: [
                  { translateX: Animated.add(slideX, gestureX) },
                ],
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.dragHandle} />

              <View style={styles.menuHeader}>
                <View style={styles.menuHeaderTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => closeMenu()}
                    style={styles.chevronBtn}
                    hitSlop={12}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name ?? 'Usuario'}
                </Text>
                <Text style={styles.companyName} numberOfLines={1}>
                  {user?.company?.name ?? ''}
                </Text>
              </View>

              <View style={styles.divider} />

              {visibleItems.map((item) => (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => goTo(item.route)}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={20} color="#D4A017" />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={onLogout}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.menuLabel, { color: '#FF6B6B' }]}>
                  Cerrar sesión
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 30,
    backgroundColor: '#0B0B0B',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  addBtn: { backgroundColor: '#D4A017', borderColor: '#D4A017' },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },

  menuOverlay: { flex: 1 },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#0B0B0B',
    paddingTop: 50,
    borderRightWidth: 1,
    borderRightColor: '#1F1F1F',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuHeader: { paddingHorizontal: 20, paddingBottom: 16 },
  menuHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#0B0B0B', fontSize: 24, fontWeight: '700' },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  userName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  companyName: { color: '#D4A017', fontSize: 13, marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: '#1F1F1F',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  menuLabel: { color: '#DDD', fontSize: 15, fontWeight: '500' },
});