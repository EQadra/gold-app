import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { rolesApi, type Role } from '../src/api/roles';
import { usersApi, type UserWithRoles } from '../src/api/users';
import { useAuth } from '../src/context/AuthContext';
import { PERMISSIONS, ROLES } from '../src/utils/permissions';

export default function UsersScreen() {
  const { user: me, hasPermission, hasRole } = useAuth();
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserWithRoles | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserWithRoles | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal crear usuario
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = hasPermission(PERMISSIONS.USERS_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.USERS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.USERS_DELETE);

  // Guard: super-admin no gestiona usuarios de empresa
  if (isSuperAdmin) {
    return <Redirect href="/dashboard" />;
  }

  /* ---------------- CARGA ---------------- */

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list();
      setUsers(res.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /* ---------------- ELIMINAR ---------------- */

  const onDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await usersApi.destroy(confirmDelete.id);
      setConfirmDelete(null);
      setSelected(null);
      await load();
      Alert.alert('✅ Eliminado', 'El usuario se eliminó correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- RENDER ITEM ---------------- */

  const renderItem = ({ item }: { item: UserWithRoles }) => {
    const isMe = item.id === me?.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setSelected(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {isMe ? (
              <View style={styles.meBadge}>
                <Text style={styles.meBadgeText}>TÚ</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.rolesRow}>
            {item.roles.map((r) => (
              <View
                key={r}
                style={[
                  styles.roleChip,
                  r === 'owner' && styles.roleChipOwner,
                  r === 'super-admin' && styles.roleChipSuper,
                ]}
              >
                <Text style={styles.roleChipText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#444" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {loading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color="#333" />
          <Text style={styles.empty}>Sin usuarios todavía</Text>
          {canCreate && (
            <TouchableOpacity
              onPress={() => setCreateOpen(true)}
              style={styles.cta}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Crear el primero</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#D4A017"
            />
          }
        />
      )}

      {/* FAB — botón flotante para crear usuario */}
      {canCreate && (
        <TouchableOpacity
          onPress={() => setCreateOpen(true)}
          style={styles.fab}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#0B0B0B" />
        </TouchableOpacity>
      )}

      {/* Modal detalle usuario */}
      <UserDetailModal
        user={selected}
        meId={me?.id ?? 0}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setSelected(null)}
        onEdit={(u) => {
          setSelected(null);
          router.push(`/users/${u.id}`);
        }}
        onDelete={(u) => setConfirmDelete(u)}
      />

      {/* Modal confirmar eliminación */}
      <ConfirmModal
        visible={!!confirmDelete}
        title="Eliminar usuario"
        message={`¿Seguro que quieres eliminar a ${confirmDelete?.name}?`}
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={onDelete}
        destructive
      />

      {/* Modal crear usuario */}
      <CreateUserModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          setCreateOpen(false);
          await load();
        }}
      />
    </View>
  );
}

/* ============================================================
   MODAL CREAR USUARIO
   ============================================================ */

function CreateUserModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    telefono: '',
    genero: '' as '' | 'masculino' | 'femenino' | 'otro',
    role: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Cargar roles al abrir el modal
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setLoadingRoles(true);
    (async () => {
      try {
        const res = await rolesApi.list();
        // Excluimos owner y super-admin por seguridad
        const list = (res.data ?? []).filter(
          (r) => r.name !== 'owner' && r.name !== 'super-admin'
        );
        setRoles(list);
        if (list.length > 0 && !form.role) {
          set('role', list[0].name);
        }
      } catch (e: any) {
        setError(e?.message ?? 'No se pudieron cargar los roles');
      } finally {
        setLoadingRoles(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Resetear al cerrar
  useEffect(() => {
    if (!visible) {
      setForm({
        name: '',
        email: '',
        password: '',
        telefono: '',
        genero: '',
        role: '',
      });
      setError(null);
      setShowPassword(false);
    }
  }, [visible]);

  const isValid =
    form.name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 8 &&
    form.role.length > 0;

  const onSubmit = async () => {
    if (!isValid) {
      setError('Revisa todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await usersApi.create({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        telefono: form.telefono.trim() || undefined,
        genero: form.genero || undefined,
        role: form.role,
      });

      Alert.alert('✅ Usuario creado', 'El usuario se creó correctamente.');
      await onCreated();
    } catch (e: any) {
      // Errores 422 de Laravel
      if (e?.errors) {
        const first = Object.values(e.errors)[0] as string[];
        setError(first?.[0] ?? 'Error al crear el usuario');
      } else {
        setError(e?.message ?? 'No se pudo crear el usuario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalBox, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Nuevo usuario</Text>
              <Text style={styles.modalSubtitle}>
                Añade un empleado a tu empresa
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeIconBtn}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Nombre completo *"
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="Juan Pérez"
            />

            <Field
              label="Email *"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              placeholder="juan@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Contraseña * (mín. 8 caracteres)</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={form.password}
                onChangeText={(v) => set('password', v)}
                placeholder="••••••••"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <Field
              label="Teléfono (opcional)"
              value={form.telefono}
              onChangeText={(v) => set('telefono', v)}
              placeholder="+34 600 000 000"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Género (opcional)</Text>
            <View style={styles.genderRow}>
              {(['masculino', 'femenino', 'otro'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => set('genero', form.genero === g ? '' : g)}
                  style={[
                    styles.genderPill,
                    form.genero === g && styles.genderPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderText,
                      form.genero === g && styles.genderTextActive,
                    ]}
                  >
                    {g[0].toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>Rol *</Text>
            {loadingRoles ? (
              <ActivityIndicator
                color="#D4A017"
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              />
            ) : roles.length === 0 ? (
              <Text style={styles.noRoles}>No hay roles disponibles</Text>
            ) : (
              <View style={styles.rolesGrid}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => set('role', r.name)}
                    style={[
                      styles.roleCard,
                      form.role === r.name && styles.roleCardActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={
                        form.role === r.name
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={18}
                      color={form.role === r.name ? '#D4A017' : '#666'}
                    />
                    <Text
                      style={[
                        styles.roleName,
                        form.role === r.name && styles.roleNameActive,
                      ]}
                    >
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {error ? <Text style={styles.formError}>{error}</Text> : null}

            <TouchableOpacity
              onPress={onSubmit}
              disabled={!isValid || submitting}
              style={[
                styles.submitBtn,
                (!isValid || submitting) && { opacity: 0.5 },
              ]}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#0B0B0B" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#0B0B0B" />
                  <Text style={styles.submitText}>Crear usuario</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

/* ============================================================
   MODAL DETALLE
   ============================================================ */

function UserDetailModal({
  user,
  meId,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}: {
  user: UserWithRoles | null;
  meId: number;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (u: UserWithRoles) => void;
  onDelete: (u: UserWithRoles) => void;
}) {
  if (!user) return null;
  const isOwner = user.roles.includes('owner');
  const isSuperAdmin = user.roles.includes('super-admin');
  const isMe = user.id === meId;
  const canEditThis = canUpdate;
  const canDeleteThis = canDelete && !isOwner && !isSuperAdmin && !isMe;

  return (
    <Modal
      visible={!!user}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{user.name}</Text>
              <Text style={styles.modalSubtitle}>{user.email}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeIconBtn}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <DetailRow label="Email" value={user.email} />
          {user.telefono ? (
            <DetailRow label="Teléfono" value={user.telefono} />
          ) : null}
          {user.genero ? (
            <DetailRow label="Género" value={user.genero} />
          ) : null}
          <DetailRow label="Roles" value={user.roles.join(', ')} />

          <View style={styles.modalActions}>
            {canEditThis ? (
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => onEdit(user)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color="#D4A017" />
                <Text style={styles.btnSecondaryText}>Editar</Text>
              </TouchableOpacity>
            ) : null}

            {canDeleteThis ? (
              <TouchableOpacity
                style={[styles.btn, styles.btnDanger]}
                onPress={() => onDelete(user)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color="#FFF" />
                <Text style={styles.btnDangerText}>Eliminar</Text>
              </TouchableOpacity>
            ) : null}

            {!canEditThis && !canDeleteThis ? (
              <Text style={styles.noActions}>Sin acciones disponibles</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/* ============================================================
   MODAL CONFIRMACIÓN
   ============================================================ */

function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  loading,
  onCancel,
  onConfirm,
  destructive,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { maxWidth: 340 }]}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                destructive ? styles.btnDanger : styles.btnPrimary,
              ]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text
                  style={
                    destructive
                      ? styles.btnDangerText
                      : styles.btnPrimaryText
                  }
                >
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center' },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4A017',
  },
  retryText: { color: '#D4A017', fontWeight: '700' },
  empty: { color: '#666', fontSize: 14, marginTop: 12 },
  cta: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#D4A017',
  },
  ctaText: { color: '#0B0B0B', fontWeight: '700' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0B0B0B', fontSize: 18, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  meBadge: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  meBadgeText: { color: '#0B0B0B', fontSize: 9, fontWeight: '800' },
  email: { color: '#888', fontSize: 12, marginTop: 2 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  roleChip: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleChipOwner: { backgroundColor: '#7c2d12' },
  roleChipSuper: { backgroundColor: '#1e40af' },
  roleChipText: { color: '#DDD', fontSize: 10, fontWeight: '600' },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  /* Modal genérico */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#888', fontSize: 12, marginTop: 4 },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 14 },

  /* Formulario crear usuario */
  label: { color: '#AAA', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { padding: 12, position: 'absolute', right: 0 },

  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: '#D4A017',
    borderColor: '#D4A017',
  },
  genderText: { color: '#888', fontSize: 13, fontWeight: '600' },
  genderTextActive: { color: '#0B0B0B', fontWeight: '700' },

  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#141414',
  },
  roleCardActive: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212,160,23,0.1)',
  },
  roleName: { color: '#888', fontSize: 14, fontWeight: '600' },
  roleNameActive: { color: '#FFF' },
  noRoles: { color: '#666', fontSize: 13, fontStyle: 'italic' },

  formError: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4A017',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 22,
  },
  submitText: { color: '#0B0B0B', fontWeight: '700', fontSize: 15 },

  /* Detalle */
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: { color: '#888', fontSize: 13 },
  detailValue: {
    color: '#DDD',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  noActions: { color: '#666', fontSize: 12, textAlign: 'center', flex: 1 },

  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnPrimary: { backgroundColor: '#D4A017' },
  btnPrimaryText: { color: '#0B0B0B', fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  btnSecondaryText: { color: '#D4A017', fontWeight: '700', fontSize: 14 },
  btnDanger: { backgroundColor: '#7f1d1d' },
  btnDangerText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  btnGhostText: { color: '#AAA', fontWeight: '600', fontSize: 14 },

  confirmTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmMessage: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
});