
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AllergyItem {
  id?: string;
  allergen: string;
  severity: string;
}

interface ConditionItem {
  id?: string;
  name: string;
}

interface ContactItem {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
}

interface PatientObject {
  patientName: string;
  cnic?: string;
  dob?: string;
  gender?: string;
  bloodType?: string;
  allergies?: AllergyItem[];
  chronicConditions?: ConditionItem[];
  emergencyContacts?: ContactItem[];
  onViewFullRecordPress?: () => void;
}

interface PatientMedicalSummaryCardProps {
  patient?: PatientObject;
  patientName?: string;
  cnic?: string;
  dob?: string;
  gender?: string;
  bloodType?: string;
  allergies?: AllergyItem[];
  chronicConditions?: ConditionItem[];
  emergencyContacts?: ContactItem[];
  onViewFullRecordPress?: () => void;
}

export const PatientMedicalSummaryCard: React.FC<PatientMedicalSummaryCardProps> = ({
  patient,
  patientName: patientNameProp,
  cnic: cnicProp,
  dob: dobProp,
  gender: genderProp,
  bloodType: bloodTypeProp,
  allergies: allergiesProp = [],
  chronicConditions: chronicConditionsProp = [],
  emergencyContacts: emergencyContactsProp = [],
  onViewFullRecordPress: onViewFullRecordPressProp,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  // Merge patient object with flat props, patient object takes precedence
  const name = patient?.patientName ?? patientNameProp;
  const cnic = patient?.cnic ?? cnicProp;
  const dob = patient?.dob ?? dobProp;
  const gender = patient?.gender ?? genderProp;
  const bloodType = patient?.bloodType ?? bloodTypeProp;
  const allergies = patient?.allergies ?? allergiesProp;
  const chronicConditions = patient?.chronicConditions ?? chronicConditionsProp;
  const emergencyContacts = patient?.emergencyContacts ?? emergencyContactsProp;
  const onViewFullRecordPress = patient?.onViewFullRecordPress ?? onViewFullRecordPressProp;

  // Fade-in entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Pulse animation for severe allergy banner
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Looping pulse for allergy banner
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, pulseAnim]);

  const severeAllergies = allergies.filter(a => a.severity === 'SEVERE');

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* Patient Basic Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.patientName}>{name}</Text>
          <Text style={styles.patientSub}>
            {gender || 'Patient'}
            {dob ? ` · DOB: ${dob}` : ''}
            {cnic ? ` · CNIC: ${cnic}` : ''}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {bloodType && (
            <View style={styles.bloodTypeChip}>
              <Text style={styles.bloodTypeText}>🩸 {bloodType}</Text>
            </View>
          )}
          {onViewFullRecordPress && (
            <TouchableOpacity onPress={onViewFullRecordPress}>
              <Text style={styles.linkText}>Full Record ›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Severe Allergy Warning Banner — pulsing */}
      {severeAllergies.length > 0 && (
        <Animated.View style={[styles.allergyWarningBanner, { opacity: pulseAnim }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>SEVERE ALLERGY WARNING</Text>
            <Text style={styles.warningText}>
              {severeAllergies.map(a => a.allergen).join(', ')}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Chronic Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chronic Conditions:</Text>
        {chronicConditions.length > 0 ? (
          <View style={styles.chipRow}>
            {chronicConditions.map((c, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{c.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noneText}>No chronic conditions logged.</Text>
        )}
      </View>

      {/* Emergency Contacts */}
      {emergencyContacts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact:</Text>
          {emergencyContacts.slice(0, 1).map((contact, i) => (
            <View key={i} style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  {contact.name} ({contact.relationship})
                </Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              >
                <Text style={styles.callIcon}>📞 Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  patientName: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
  },
  patientSub: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  linkText: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
  bloodTypeChip: {
    backgroundColor: COLORS.redLight,
    borderColor: COLORS.redLight,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  bloodTypeText: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '700',
  },
  allergyWarningBanner: {
    backgroundColor: COLORS.redLight,
    borderColor: COLORS.red,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '800',
  },
  warningText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  section: {
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  chipText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: '600',
  },
  noneText: {
    color: COLORS.textBody,
    fontSize: 11,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '700',
  },
  contactPhone: {
    color: COLORS.textBody,
    fontSize: 10,
  },
  callBtn: {
    backgroundColor: COLORS.emeraldFill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  callIcon: {
    color: COLORS.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
}));
