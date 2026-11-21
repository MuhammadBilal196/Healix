
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { RADIUS, SPACING } from '../../theme';

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const renderCalendarDays = () => {
    const cells = [];

    // Blank padding for days before month start
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`blank-${i}`} style={styles.dayCellEmpty} />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;
      const isSelected = selectedDate === dateStr;
      const todayStr = new Date().toISOString().split('T')[0];
      const isPast = dateStr < todayStr;

      cells.push(
        <TouchableOpacity
          key={`day-${day}`}
          disabled={isPast}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isPast && styles.dayCellDisabled,
          ]}
          onPress={() => {
            onSelectDate(dateStr);
            onClose();
          }}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
              isPast && styles.dayTextDisabled,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearTitle}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday Names Header */}
          <View style={styles.weekRow}>
            {dayNames.map(d => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {renderCalendarDays()}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button mode="text" textColor={COLORS.textBody} onPress={onClose}>
              Cancel
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: COLORS.emerald,
    fontSize: 22,
    fontWeight: '800',
  },
  monthYearTitle: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerLight,
    paddingBottom: 8,
  },
  weekDayText: {
    width: '14%',
    textAlign: 'center',
    color: COLORS.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: COLORS.emerald,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: COLORS.onAccent,
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: COLORS.textBody,
  },
  actions: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
}));
