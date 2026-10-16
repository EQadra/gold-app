import { newsApi, type NewsPayload } from '@/src/api/news';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
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
import NewsTicker from '../components/NewsTicker';
import { useAuth } from '../src/context/AuthContext';
import type { News } from '../src/types/api';
import { ROLES } from '../src/utils/permissions';

/* ============================================================
   HELPERS
   ============================================================ */

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   PANTALLA
   ============================================================ */

export default function NewsScreen() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<News | null>(null);

  // Modal crear/editar
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<News | null>(null);

  // Confirmar eliminación
  const [confirmDelete, setConfirmDelete] = useState<News | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------- Carga ---------- */

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await newsApi.list();
      setNews(res.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar noticias');
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

  /* ---------- Crear / Editar ---------- */

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (n: News) => {
    setSelected(null);
    setEditing(n);
    setFormOpen(true);
  };

  const onSave = async (payload: NewsPayload) => {
    if (editing) {
      await newsApi.update(editing.id, payload);
      Alert.alert('✅ Actualizada', 'La noticia se actualizó correctamente.');
    } else {
      await newsApi.create(payload);
      Alert.alert('✅ Publicada', 'La noticia se publicó correctamente.');
    }
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  /* ---------- Eliminar ---------- */

  const onDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await newsApi.destroy(confirmDelete.id);
      setConfirmDelete(null);
      setSelected(null);
      await load();
      Alert.alert('✅ Eliminada', 'La noticia se eliminó correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Render ---------- */

  const tickerItems = news.map((n) => n.titulo);

  const renderItem = ({ item }: { item: News }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => setSelected(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color="#D4A017" />
          <Text style={styles.dateText}>
            {formatDate(item.fecha_publicacion)}
          </Text>
        </View>
        {item.url ? (
          <Ionicons name="link-outline" size={16} color="#666" />
        ) : null}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.titulo}
      </Text>

      <Text style={styles.cardDescription} numberOfLines={3}>
        {item.descripcion}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardReadMore}>Leer más</Text>
        <Ionicons name="arrow-forward" size={14} color="#D4A017" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>

      {tickerItems.length > 0 && (
        <View style={styles.tickerWrapper}>
          <NewsTicker items={tickerItems} />
        </View>
      )}

      {loading && news.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#333" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : news.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="newspaper-outline" size={64} color="#333" />
          <Text style={styles.empty}>Sin noticias por ahora</Text>
          {isSuperAdmin && (
            <TouchableOpacity
              onPress={openCreate}
              style={styles.cta}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Publicar la primera</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#D4A017"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB solo super-admin */}
      {isSuperAdmin && (
        <TouchableOpacity
          onPress={openCreate}
          style={styles.fab}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#0B0B0B" />
        </TouchableOpacity>
      )}

      {/* Modal detalle */}
      <NewsDetailModal
        news={selected}
        canManage={isSuperAdmin}
        onClose={() => setSelected(null)}
        onEdit={openEdit}
        onDelete={(n) => setConfirmDelete(n)}
      />

      {/* Modal crear/editar */}
      <NewsFormModal
        visible={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={onSave}
      />

      {/* Confirmar borrado */}
      <ConfirmModal
        visible={!!confirmDelete}
        title="Eliminar noticia"
        message={`¿Seguro que quieres eliminar "${confirmDelete?.titulo}"?`}
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={onDelete}
        destructive
      />
    </View>
  );
}

/* ============================================================
   DETALLE
   ============================================================ */

function NewsDetailModal({
  news,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: {
  news: News | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (n: News) => void;
  onDelete: (n: News) => void;
}) {
  if (!news) return null;

  const openUrl = () => {
    if (news.url) Linking.openURL(news.url);
  };

  return (
    <Modal
      visible={!!news}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { maxHeight: '88%' }]}>
          <View style={styles.modalHeader}>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={12} color="#D4A017" />
              <Text style={styles.dateText}>
                {formatDate(news.fecha_publicacion)}
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{news.titulo}</Text>
            <View style={styles.divider} />
            <Text style={styles.modalBody}>{news.descripcion}</Text>

            {news.url ? (
              <TouchableOpacity
                onPress={openUrl}
                style={styles.linkBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={18} color="#0B0B0B" />
                <Text style={styles.linkBtnText}>Abrir enlace</Text>
              </TouchableOpacity>
            ) : null}

            {canManage ? (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => onEdit(news)}
                  style={[styles.btn, styles.btnSecondary]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#D4A017" />
                  <Text style={styles.btnSecondaryText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(news)}
                  style={[styles.btn, styles.btnDanger]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color="#FFF" />
                  <Text style={styles.btnDangerText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   FORM CREAR/EDITAR
   ============================================================ */

function NewsFormModal({
  visible,
  editing,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: News | null;
  onClose: () => void;
  onSave: (payload: NewsPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<NewsPayload>({
    titulo: '',
    descripcion: '',
    url: '',
    fecha_publicacion: todayISO(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof NewsPayload>(k: K, v: NewsPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Sincronizar cuando se abre el modal
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setForm({
        titulo: editing.titulo ?? '',
        descripcion: editing.descripcion ?? '',
        url: editing.url ?? '',
        fecha_publicacion:
          editing.fecha_publicacion?.slice(0, 10) ?? todayISO(),
      });
    } else {
      setForm({
        titulo: '',
        descripcion: '',
        url: '',
        fecha_publicacion: todayISO(),
      });
    }
    setError(null);
  }, [visible, editing]);

  const isValid =
    form.titulo.trim().length > 2 && form.descripcion.trim().length > 4;

  const onSubmit = async () => {
    if (!isValid) {
      setError('Rellena al menos título y descripción.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        url: form.url?.trim() || null,
        fecha_publicacion: form.fecha_publicacion,
      });
    } catch (e: any) {
      if (e?.errors) {
        const first = Object.values(e.errors)[0] as string[];
        setError(first?.[0] ?? 'Error al guardar');
      } else {
        setError(e?.message ?? 'No se pudo guardar');
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
              <Text style={styles.modalTitleSm}>
                {editing ? 'Editar noticia' : 'Nueva noticia'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {editing
                  ? 'Modifica los campos necesarios'
                  : 'Publica una noticia global'}
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
            <Text style={styles.label}>Título *</Text>
            <TextInput
              value={form.titulo}
              onChangeText={(v) => set('titulo', v)}
              placeholder="Ej: El oro sube un 3% esta semana"
              placeholderTextColor="#666"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>
              Descripción *
            </Text>
            <TextInput
              value={form.descripcion}
              onChangeText={(v) => set('descripcion', v)}
              placeholder="Detalle de la noticia..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={5}
              style={[
                styles.input,
                { minHeight: 110, textAlignVertical: 'top' },
              ]}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>
              URL (opcional)
            </Text>
            <TextInput
              value={form.url ?? ''}
              onChangeText={(v) => set('url', v)}
              placeholder="https://..."
              placeholderTextColor="#666"
              keyboardType="url"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>
              Fecha de publicación
            </Text>
            <TextInput
              value={form.fecha_publicacion}
              onChangeText={(v) => set('fecha_publicacion', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              autoCapitalize="none"
              style={styles.input}
            />

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
                  <Ionicons
                    name={editing ? 'save-outline' : 'send-outline'}
                    size={18}
                    color="#0B0B0B"
                  />
                  <Text style={styles.submitText}>
                    {editing ? 'Guardar cambios' : 'Publicar noticia'}
                  </Text>
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

/* ============================================================
   CONFIRMAR
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
                    destructive ? styles.btnDangerText : styles.btnPrimaryText
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
  tickerWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
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

  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,160,23,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    color: '#D4A017',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardDescription: { color: '#AAA', fontSize: 13, lineHeight: 19 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
  },
  cardReadMore: { color: '#D4A017', fontSize: 12, fontWeight: '600' },

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
    maxWidth: 460,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 14,
  },
  modalTitleSm: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#888', fontSize: 12, marginTop: 4 },
  modalBody: { color: '#CCC', fontSize: 14, lineHeight: 21 },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 14 },

  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4A017',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 20,
  },
  linkBtnText: { color: '#0B0B0B', fontWeight: '700', fontSize: 14 },

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

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
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
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
});