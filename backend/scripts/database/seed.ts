import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo patients, nurses, doctors, paramedics, hospitals and ambulances...');

  const rawPassword = 'abc123$%';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  // ─────────────────────────────────────────────
  // 0. ADMINISTRATOR (from backend/.env)
  //    Creates the admin, or resets its password to the .env value if it already exists.
  // ─────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are not set in backend/.env, so no administrator was created.');
  } else if (adminPassword.length < 12) {
    console.warn('⚠️  ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters, so no administrator was created.');
  } else {
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin && existingAdmin.role !== 'ADMIN') {
      console.warn(`⚠️  ${adminEmail} already belongs to a ${existingAdmin.role} account. Choose a different ADMIN_BOOTSTRAP_EMAIL.`);
    } else if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: adminHash,
          status: 'ACTIVE',
          deletedAt: null,
          mfaEnabled: false,
          emailVerificationRequired: false,
          admin: { upsert: { create: {}, update: {} } },
        },
      });
      console.log(`✅ Administrator password reset from .env: ${adminEmail}`);
    } else {
      await prisma.user.create({
        data: {
          email: adminEmail,
          // Avoid a crash if another account already uses the default admin phone number.
          phone: (await prisma.user.findUnique({ where: { phone: '+923000000000' } })) ? `+92300000${Date.now().toString().slice(-4)}` : '+923000000000',
          fullName: 'Healix System Administrator',
          passwordHash: adminHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          admin: { create: {} },
        },
      });
      console.log(`✅ Created Administrator: ${adminEmail}`);
    }
  }

  // ─────────────────────────────────────────────
  // 1. SEED 3 PATIENTS
  // ─────────────────────────────────────────────
  const patientData = [
    {
      email: 'patient1@gmail.com',
      phone: '+923001111111',
      fullName: 'Tariq Mahmood',
      cnic: '35202-1111111-1',
      dob: new Date('1985-04-12'),
      gender: 'MALE',
      address: 'House 42, Block C, Model Town, Lahore',
      latitude: 31.48,
      longitude: 74.32,
      emergencyContacts: [
        { name: 'Saima Tariq', phone: '+923001111112', relationship: 'Wife' },
      ],
      chronicConditions: [{ name: 'Hypertension', diagnosedDate: new Date('2020-01-15'), notes: 'Controlled with Meds' }],
      allergies: [{ allergen: 'Penicillin', severity: 'SEVERE' as const }],
    },
    {
      email: 'patient2@gmail.com',
      phone: '+923002222222',
      fullName: 'Ayesha Bibi',
      cnic: '35202-2222222-2',
      dob: new Date('1992-09-24'),
      gender: 'FEMALE',
      address: 'Flat 4B, Falcon Complex, Gulberg III, Lahore',
      latitude: 31.52,
      longitude: 74.35,
      emergencyContacts: [
        { name: 'Bilal Bibi', phone: '+923002222223', relationship: 'Brother' },
      ],
      chronicConditions: [{ name: 'Type 2 Diabetes', diagnosedDate: new Date('2021-06-10'), notes: 'Diet and Metformin' }],
      allergies: [{ allergen: 'Peanuts', severity: 'MODERATE' as const }],
    },
    {
      email: 'patient3@gmail.com',
      phone: '+923003333333',
      fullName: 'Usman Ghani',
      cnic: '35202-3333333-3',
      dob: new Date('1978-11-05'),
      gender: 'MALE',
      address: 'Street 12, Phase 5, DHA, Lahore',
      latitude: 31.47,
      longitude: 74.38,
      emergencyContacts: [
        { name: 'Zahra Ghani', phone: '+923003333334', relationship: 'Daughter' },
      ],
      chronicConditions: [{ name: 'Asthma', diagnosedDate: new Date('2018-03-20'), notes: 'Inhaler as needed' }],
      allergies: [{ allergen: 'Dust Mites', severity: 'MILD' as const }],
    },
  ];

  for (const p of patientData) {
    const existingUser = await prisma.user.findUnique({ where: { email: p.email } });
    if (existingUser) {
      console.log(`ℹ️  Updating existing patient: ${p.email}`);
      await prisma.user.update({
        where: { email: p.email },
        data: { passwordHash, status: 'ACTIVE' },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        email: p.email,
        phone: p.phone,
        fullName: p.fullName,
        passwordHash,
        role: 'PATIENT',
        status: 'ACTIVE',
        patient: {
          create: {
            cnic: p.cnic,
            dob: p.dob,
            gender: p.gender,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
            emergencyContacts: { create: p.emergencyContacts },
            chronicConditions: { create: p.chronicConditions },
            allergies: { create: p.allergies },
          },
        },
      },
    });
    console.log(`✅ Created Patient: ${p.email}`);
  }

  // ─────────────────────────────────────────────
  // 2. SEED 3 NURSES
  // ─────────────────────────────────────────────
  const nurseData = [
    {
      email: 'nurse1@gmail.com',
      phone: '+923011111111',
      fullName: 'Sadia Malik',
      cnic: '35202-4444444-4',
      pncNumber: 'PNC-N1001',
      licenseNumber: 'RN-88421',
      experience: 6,
      bio: 'Certified Registered Nurse specializing in wound care, post-op recovery, and diabetes monitoring.',
      photoUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78905',
      specializations: ['WOUND_CARE', 'DIABETES_CARE', 'ELDERLY_CARE'],
      qualifications: [
        { title: 'BS Nursing (BSN)', issuingBody: 'University of Health Sciences', yearObtained: 2018 },
        { title: 'Certified Wound Care Specialist', issuingBody: 'Pakistan Nursing Council', yearObtained: 2020 },
      ],
    },
    {
      email: 'nurse2@gmail.com',
      phone: '+923012222222',
      fullName: 'Fatima Noor',
      cnic: '35202-5555555-5',
      pncNumber: 'PNC-N1002',
      licenseNumber: 'RN-99312',
      experience: 8,
      bio: 'Senior Clinical Nurse practitioner with expertise in IV therapy, palliative care, and pediatric nursing.',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2',
      specializations: ['IV_THERAPY', 'PALLIATIVE_CARE', 'PEDIATRIC_CARE'],
      qualifications: [
        { title: 'BSc Nursing Science', issuingBody: 'Aga Khan University', yearObtained: 2016 },
        { title: 'Diploma in Advanced IV Infusion', issuingBody: 'College of Nursing Lahore', yearObtained: 2019 },
      ],
    },
    {
      email: 'nurse3@gmail.com',
      phone: '+923013333333',
      fullName: 'Zainab Ahmed',
      cnic: '35202-6666666-6',
      pncNumber: 'PNC-N1003',
      licenseNumber: 'RN-77104',
      experience: 5,
      bio: 'Compassionate Home Care Nurse focused on elderly rehabilitation, maternal care, and general nursing.',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
      specializations: ['ELDERLY_CARE', 'MATERNAL_CARE', 'GENERAL_NURSING'],
      qualifications: [
        { title: 'Bachelor of Science in Nursing', issuingBody: 'King Edward Medical University', yearObtained: 2019 },
      ],
    },
  ];

  for (const n of nurseData) {
    const existingUser = await prisma.user.findUnique({ where: { email: n.email } });
    if (existingUser) {
      console.log(`ℹ️  Updating existing nurse: ${n.email}`);
      await prisma.user.update({
        where: { email: n.email },
        data: { passwordHash, status: 'ACTIVE' },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        email: n.email,
        phone: n.phone,
        fullName: n.fullName,
        passwordHash,
        role: 'NURSE',
        status: 'ACTIVE',
        nurse: {
          create: {
            cnic: n.cnic,
            pncNumber: n.pncNumber,
            licenseNumber: n.licenseNumber,
            experience: n.experience,
            bio: n.bio,
            photoUrl: n.photoUrl,
            available: true,
            verificationStatus: 'VERIFIED',
            verificationApprovedAt: new Date(),
            qualifications: { create: n.qualifications },
            specializations: {
              create: n.specializations.map(spec => ({ specialization: spec })),
            },
            availabilitySlots: {
              create: [
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
              ],
            },
            score: {
              create: {
                skillScore: 92,
                experienceScore: 88,
                reliabilityScore: 95,
                performanceScore: 90,
                compositeScore: 91.5,
                totalVisits: 45,
                avgRating: 4.9,
              },
            },
          },
        },
      },
    });
    console.log(`✅ Created Nurse: ${n.email}`);
  }

  // ─────────────────────────────────────────────
  // 3. SEED 3 DOCTORS
  // ─────────────────────────────────────────────
  const doctorData = [
    {
      email: 'doctor1@gmail.com',
      phone: '+923021111111',
      fullName: 'Dr. Shahzad Hassan',
      cnic: '35202-7777777-7',
      pmdcNumber: 'PMDC-99201-P',
      bio: 'Consultant Physician & Cardiologist with 12 years clinical experience in hospital & home consultation.',
    },
    {
      email: 'doctor2@gmail.com',
      phone: '+923022222222',
      fullName: 'Dr. Maria Farooq',
      cnic: '35202-8888888-8',
      pmdcNumber: 'PMDC-88312-P',
      bio: 'Senior Diabetologist & Endocrinologist specializing in chronic disease care management.',
    },
    {
      email: 'doctor3@gmail.com',
      phone: '+923023333333',
      fullName: 'Dr. Imran Qureshi',
      cnic: '35202-9999999-9',
      pmdcNumber: 'PMDC-77405-P',
      bio: 'General Practitioner & Emergency Medicine Specialist available for telemedicine and urgent home visits.',
    },
  ];

  for (const d of doctorData) {
    const existingUser = await prisma.user.findUnique({ where: { email: d.email } });
    if (existingUser) {
      console.log(`ℹ️  Updating existing doctor: ${d.email}`);
      await prisma.user.update({
        where: { email: d.email },
        data: { passwordHash, status: 'ACTIVE' },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        email: d.email,
        phone: d.phone,
        fullName: d.fullName,
        passwordHash,
        role: 'DOCTOR',
        status: 'ACTIVE',
        doctor: {
          create: {
            cnic: d.cnic,
            pmdcNumber: d.pmdcNumber,
            bio: d.bio,
            verificationStatus: 'VERIFIED',
            verificationApprovedAt: new Date(),
          },
        },
      },
    });
    console.log(`✅ Created Doctor: ${d.email}`);
  }

  // ─────────────────────────────────────────────
  // 4. SEED 2 PARAMEDICS
  // ─────────────────────────────────────────────
  const paramedicData = [
    { email: 'paramedic1@gmail.com', phone: '+923031111111', fullName: 'Usman Ali', cnic: '35202-1212121-1', certificationNumber: 'EMT-L-4417' },
    { email: 'paramedic2@gmail.com', phone: '+923032222222', fullName: 'Hamza Riaz', cnic: '35202-2323232-2', certificationNumber: 'EMT-L-5520' },
  ];

  for (const m of paramedicData) {
    const existingUser = await prisma.user.findUnique({ where: { email: m.email } });
    if (existingUser) {
      console.log(`ℹ️  Updating existing paramedic: ${m.email}`);
      await prisma.user.update({ where: { email: m.email }, data: { passwordHash, status: 'ACTIVE' } });
      continue;
    }

    await prisma.user.create({
      data: {
        email: m.email,
        phone: m.phone,
        fullName: m.fullName,
        passwordHash,
        role: 'PARAMEDIC',
        status: 'ACTIVE',
        paramedic: {
          create: {
            cnic: m.cnic,
            certificationNumber: m.certificationNumber,
            verificationStatus: 'VERIFIED',
          },
        },
      },
    });
    console.log(`✅ Created Paramedic: ${m.email}`);
  }

  // ─────────────────────────────────────────────
  // 5. SEED 4 DEMO HOSPITALS (fictional names, Lahore coordinates)
  // ─────────────────────────────────────────────
  const hospitalData = [
    { name: 'Gulberg General Hospital (Demo)', latitude: 31.515, longitude: 74.345, capacityStatus: 'AVAILABLE', affordabilityTier: 'MEDIUM', isCharity: false },
    { name: 'Model Town Medical Centre (Demo)', latitude: 31.484, longitude: 74.326, capacityStatus: 'LIMITED', affordabilityTier: 'HIGH', isCharity: false },
    { name: 'DHA Care Hospital (Demo)', latitude: 31.474, longitude: 74.391, capacityStatus: 'AVAILABLE', affordabilityTier: 'HIGH', isCharity: false },
    { name: 'Mozang Charity Hospital (Demo)', latitude: 31.553, longitude: 74.313, capacityStatus: 'AVAILABLE', affordabilityTier: 'LOW', isCharity: true },
  ];

  for (const h of hospitalData) {
    const existing = await prisma.hospital.findFirst({ where: { name: h.name } });
    if (existing) {
      await prisma.hospital.update({ where: { id: existing.id }, data: { ...h, capacityUpdatedAt: new Date() } });
      console.log(`ℹ️  Updated hospital: ${h.name}`);
    } else {
      await prisma.hospital.create({ data: h });
      console.log(`✅ Created Hospital: ${h.name}`);
    }
  }

  // ─────────────────────────────────────────────
  // 6. SEED 3 HEALIX FLEET AMBULANCES
  // ─────────────────────────────────────────────
  const ambulanceData = [
    { vehicleNumber: 'HX-01', plateNumber: 'LEA-1101', type: 'BASIC', contactNumber: '+923041111111' },
    { vehicleNumber: 'HX-02', plateNumber: 'LEA-1102', type: 'ADVANCED', contactNumber: '+923042222222' },
    { vehicleNumber: 'HX-03', plateNumber: 'LEA-1103', type: 'ICU', contactNumber: '+923043333333' },
  ];

  for (const a of ambulanceData) {
    // Existing vehicles keep their current status so an active dispatch is never reset.
    await prisma.ambulance.upsert({
      where: { vehicleNumber: a.vehicleNumber },
      update: { plateNumber: a.plateNumber, type: a.type, contactNumber: a.contactNumber },
      create: { ...a, provider: 'Healix Fleet', status: 'AVAILABLE' },
    });
    console.log(`✅ Ambulance ready: ${a.vehicleNumber}`);
  }

  console.log('\n🎉 DEMO DATA SEEDED: 3 patients, 3 nurses, 3 doctors, 2 paramedics, 4 hospitals, 3 ambulances.');
  console.log('🔑 Common Password for ALL seeded users: abc123$%');
  console.log('🔑 Administrator: the email and password set in ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD (backend/.env).');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
