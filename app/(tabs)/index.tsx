import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { PaperBackground } from '@/components/PaperBackground';
import { TonightCard } from '@/components/TonightCard';
import { EntrySlot } from '@/components/EntrySlot';
import { FtuoTour } from '@/components/FtuoTour';
import { todayStr } from '@/lib/data';

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getUnreadNotificationCount } from '@/lib/notifications';

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getTodayLog, getOnThisDay } = useDiary();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getUnreadNotificationCount().then(setUnreadCount);
    }, [])
  );

  const today = todayStr();
  const todayLog = getTodayLog();
  const entries = todayLog?.entries ?? [];
  const onThisDay = getOnThisDay();

  const dayOfWeek = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90; // room for tab bar

  function openLog() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/log-modal');
  }

  return (
    <PaperBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date header + Notification Bell */}
        <View style={styles.headerRow}>
          <View style={styles.dateHeader}>
            <Text style={[styles.dayOfWeek, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              {dayOfWeek}
            </Text>
            <Text style={[styles.fullDate, { color: colors.mutedForeground, fontFamily: 'PlayfairDisplay_400Regular' }]}>
              {fullDate}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/notifications');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.hairline, { backgroundColor: colors.borderStrong }]} />

        {/* Logged entries for today */}
        {entries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>
              {entries.length === 4 ? "Today's 4" : `${entries.length} of 4 moments`}
            </Text>
            {entries.map((entry, i) => (
              <EntrySlot
                key={entry.id}
                entry={entry}
                slotNumber={i + 1}
                onPress={openLog}
              />
            ))}
          </View>
        )}

        {/* Tonight card / Add remaining CTA — at bottom of added memories */}
        {entries.length < 4 && (
          <TonightCard onPress={openLog} entryCount={entries.length} />
        )}

        {/* On This Day — Archival & Distinct Time Capsule Styling */}
        {onThisDay.length > 0 && (
          <View style={styles.otdSection}>
            <View style={styles.otdHeaderRow}>
              <View style={[styles.otdHeaderDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.otdHeaderTitle, { color: colors.accent }]}>
                MEMORY TIME CAPSULE
              </Text>
            </View>

            {onThisDay.slice(0, 3).map(({ book, day }) => {
              const year = day.date.slice(0, 4);
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.otdCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.borderStrong,
                    },
                  ]}
                  onPress={() => router.push({ pathname: '/book-viewer', params: { monthKey: book.monthKey } })}
                  activeOpacity={0.85}
                >
                  {/* Vintage stamp badge */}
                  <View style={styles.otdCardTop}>
                    <View style={styles.otdBadge}>
                      <Ionicons name="sparkles" size={12} color="#C47B3A" />
                      <Text style={styles.otdBadgeText}>{year} · THIS DAY</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.tertiary} />
                  </View>

                  {/* Memories recorded on that day */}
                  <View style={styles.otdEntries}>
                    {day.entries.slice(0, 2).map((e) => (
                      <View key={e.id} style={styles.otdEntryRow}>
                        <Text style={[styles.otdBullet, { color: colors.accent }]}>•</Text>
                        <Text
                          style={[styles.otdText, { color: colors.foreground }]}
                          numberOfLines={2}
                        >
                          {e.text}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.otdFooter, { color: colors.tertiary }]}>
                    Open {book.title} volume →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* First-time User Onboarding Spotlight Tour */}
      <FtuoTour />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingLeft: 72, paddingRight: 20, gap: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateHeader: { gap: 4 },
  notifBtn: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  dayOfWeek: { fontSize: 28, letterSpacing: 0.2 },
  fullDate: { fontSize: 20 },
  hairline: { height: 1, marginBottom: 4 },
  section: { gap: 0 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  /* On This Day / Archival styling */
  otdSection: { marginTop: 12, gap: 12 },
  otdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otdHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  otdHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  otdCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  otdCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(196, 123, 58, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  otdBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#C47B3A',
    letterSpacing: 0.6,
  },
  otdEntries: {
    gap: 6,
  },
  otdEntryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  otdBullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  otdText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  otdFooter: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
});
