import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, UserStatus } from '../entities/user.entity';
import { UserIdentity, Provider } from '../entities/user-identity.entity';
import { Profile } from '../entities/profile.entity';
import { Registration, RegistrationStatus } from '../entities/registration.entity';
import { RegistrationChild } from '../entities/registration-child.entity';
import { ArrivalSchedule } from '../entities/arrival-schedule.entity';
import { Admin } from '../entities/admin.entity';

const MINISTRY_FEE_TEENS = 150_000;
const MINISTRY_FEE_SINGLE_MARRIED_BATAM = 150_000;
const MINISTRY_FEE_SINGLE_MARRIED_OTHER = 300_000;
const CHILD_FEE = 75_000;
const GKDI_BATAM = 'GKDI Batam';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: `.env.${nodeEnv}.local` });
config({ path: `.env.${nodeEnv}` });
config({ path: '.env.local' });
config({ path: '.env' });

const CHURCH_OPTIONS = ['GKDI Batam', 'GKDI Bangka', 'GKDI Jambi', 'GKDI Palembang', 'GKDI Lampung', 'GKDI Siantar', 'GKDI Jakarta'];

/** Prefix Registration ID berdasarkan asal gereja */
const REG_ID_PREFIX: Record<string, string> = {
  'GKDI Batam': 'BT',
  'GKDI Lampung': 'LM',
  'GKDI Bangka': 'BK',
  'GKDI Palembang': 'PL',
  'GKDI Jambi': 'JB',
};
const REG_ID_OTHER_PREFIX = 'EX';

const CHILD_NAMES = ['Andi', 'Bella', 'Cahya', 'Dina', 'Eko', 'Fitri', 'Gilang', 'Hana', 'Indra', 'Jasmine', 'Kevin', 'Luna', 'Mario', 'Nadia', 'Oscar', 'Putri', 'Rizki', 'Sari', 'Tono', 'Umi'];

const FIRST_NAMES = [
  'Budi', 'Siti', 'Ahmad', 'Dewi', 'Rudi', 'Lina', 'Hadi', 'Maya', 'Joko', 'Rina',
  'Ari', 'Sari', 'Dedi', 'Nina', 'Eko', 'Lisa', 'Fajar', 'Dina', 'Gunawan', 'Rita',
  'Bambang', 'Yuni', 'Hendra', 'Kartika', 'Iwan', 'Wulan', 'Joko', 'Sinta', 'Agus', 'Dewi',
];

const LAST_NAMES = [
  'Santoso', 'Wijaya', 'Prasetyo', 'Kurniawan', 'Setiawan', 'Sari', 'Hidayat', 'Putri',
  'Saputra', 'Lestari', 'Rahman', 'Sari', 'Nugroho', 'Sari', 'Wibowo', 'Sari',
  'Permana', 'Kusuma', 'Hartono', 'Susanto', 'Gunawan', 'Rahman', 'Suryadi', 'Wibowo',
];

const SPECIAL_NOTES_OPTIONS = [
  null,
  'Alergi seafood',
  'Vegetarian',
  'Diabetes',
  'Hipertensi',
  'Tidak ada',
  'Alergi kacang',
  'Makanan halal',
  'Diet rendah garam',
  'Laktosa intoleran',
];

const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'];

const GENDER_OPTIONS = ['Pria', 'Wanita'];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const STATUS_OPTIONS: RegistrationStatus[] = [
  RegistrationStatus.BELUM_TERDAFTAR,
  RegistrationStatus.PENDING,
  RegistrationStatus.TERDAFTAR,
  RegistrationStatus.DAFTAR_ULANG,
];

const REJECT_REASONS = [
  'Bukti pembayaran tidak jelas',
  'Data tidak lengkap',
  'Silakan daftar ulang dengan bukti yang valid',
  'Nominal transfer tidak sesuai',
];

function calcRegistrationAmount(ministry: string, churchName: string, childFees: number): { baseAmount: number; uniqueCode: string; totalAmount: number } {
  let baseAmount = 0;
  if (ministry === 'Teens/Campus') {
    baseAmount = MINISTRY_FEE_TEENS;
  } else if (ministry === 'Single/S2' || ministry === 'Married') {
    baseAmount = churchName === GKDI_BATAM ? MINISTRY_FEE_SINGLE_MARRIED_BATAM : MINISTRY_FEE_SINGLE_MARRIED_OTHER;
  } else {
    baseAmount = MINISTRY_FEE_SINGLE_MARRIED_OTHER;
  }
  baseAmount += childFees;
  const uniqueCode = String(Math.floor(100 + Math.random() * 900));
  const totalAmount = baseAmount + parseInt(uniqueCode, 10);
  return { baseAmount, uniqueCode, totalAmount };
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPhoneNumber(): string {
  const prefix = ['0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819', '0821', '0822', '0823', '0852', '0853', '0856', '0857', '0858', '0859'];
  const randomPrefix = getRandomElement(prefix);
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `${randomPrefix}${randomNumber}`;
}

function getRandomEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const randomDomain = getRandomElement(domains);
  const randomNumber = Math.floor(Math.random() * 10000) + index * 1000;
  return `participant${index + 1}.${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNumber}@${randomDomain}`;
}

function generateRegistrationId(churchName: string, usedIds: Set<string>): string {
  const prefix = REG_ID_PREFIX[churchName] ?? REG_ID_OTHER_PREFIX;
  for (let attempt = 0; attempt < 200; attempt++) {
    const num = Math.floor(100 + Math.random() * 900);
    const regId = `${prefix}${num}`;
    if (!usedIds.has(regId)) {
      usedIds.add(regId);
      return regId;
    }
  }
  // Fallback: angka unik dari counter (sangat jarang terjadi)
  const fallbackNum = (100 + (usedIds.size % 900)) % 1000;
  const fallback = `${prefix}${String(fallbackNum).padStart(3, '0')}`;
  usedIds.add(fallback);
  return fallback;
}

async function seedParticipants() {
  const dataSource = new DataSource({
    type: 'mysql',
    url: process.env.DATABASE_URL,
    entities: [User, UserIdentity, Profile, Registration, RegistrationChild, ArrivalSchedule, Admin],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const identityRepository = dataSource.getRepository(UserIdentity);
    const profileRepository = dataSource.getRepository(Profile);
    const registrationRepository = dataSource.getRepository(Registration);
    const registrationChildRepository = dataSource.getRepository(RegistrationChild);

    // Load existing registration IDs untuk memastikan uniqueness
    const existingRegs = await registrationRepository.find({ where: {}, select: ['registrationId'] });
    const usedIds = new Set<string>(existingRegs.map((r) => r.registrationId).filter(Boolean) as string[]);

    for (let i = 0; i < 30; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const email = getRandomEmail(firstName, lastName, i);
      const phoneNumber = getRandomPhoneNumber();
      const churchName = getRandomElement(CHURCH_OPTIONS);
      const ministry = getRandomElement(MINISTRY_OPTIONS);
      const gender = getRandomElement(GENDER_OPTIONS);
      const specialNotes = getRandomElement(SPECIAL_NOTES_OPTIONS);

      // Status distribution: lebih banyak Terdaftar dan Pending untuk testing
      const statusRand = Math.random();
      let status: RegistrationStatus;
      if (statusRand < 0.15) {
        status = RegistrationStatus.BELUM_TERDAFTAR;
      } else if (statusRand < 0.25) {
        status = RegistrationStatus.DAFTAR_ULANG;
      } else if (statusRand < 0.45) {
        status = RegistrationStatus.PENDING;
      } else {
        status = RegistrationStatus.TERDAFTAR;
      }

      const user = userRepository.create({
        email,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      });
      const savedUser = await userRepository.save(user);

      const identity = identityRepository.create({
        userId: savedUser.id,
        provider: Provider.LOCAL,
        providerUserId: email,
      });
      await identityRepository.save(identity);

      // dateOfBirth: random date 13–100 tahun lalu
      const yearsAgo = 13 + Math.floor(Math.random() * 88);
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - yearsAgo);
      birthDate.setMonth(Math.floor(Math.random() * 12));
      birthDate.setDate(1 + Math.floor(Math.random() * 28));
      const profile = profileRepository.create({
        userId: savedUser.id,
        fullName,
        churchName,
        ministry,
        gender,
        dateOfBirth: birthDate,
        contactEmail: email,
        phoneNumber,
        specialNotes,
        isCompleted: true,
        completedAt: new Date(),
      });
      await profileRepository.save(profile);

      const hasPaymentProof = status !== RegistrationStatus.BELUM_TERDAFTAR;
      const isDaftarUlang = status === RegistrationStatus.DAFTAR_ULANG;

      // Children: hanya untuk Single/S2 dan Married, 0-3 anak
      const childCount = (ministry === 'Single/S2' || ministry === 'Married') && Math.random() > 0.4
        ? Math.floor(Math.random() * 4) // 0, 1, 2, 3
        : 0;
      const childNeedsConsumption = Array.from({ length: childCount }, () => Math.random() > 0.2);
      const childFees = childNeedsConsumption.reduce((sum, nc) => sum + (nc ? CHILD_FEE : 0), 0);

      const { baseAmount, uniqueCode, totalAmount } = hasPaymentProof
        ? calcRegistrationAmount(ministry, churchName, childFees)
        : { baseAmount: null, uniqueCode: null, totalAmount: null };

      // Shirt size: hanya untuk Pending dan Terdaftar
      const shirtSize = (status === RegistrationStatus.PENDING || status === RegistrationStatus.TERDAFTAR)
        ? getRandomElement(SIZE_OPTIONS)
        : null;

      // Check-in peserta: hanya untuk sebagian Terdaftar (~40%)
      const participantCheckedIn = status === RegistrationStatus.TERDAFTAR && Math.random() < 0.4;

      // Registration ID: hanya untuk status Terdaftar
      const registrationId = status === RegistrationStatus.TERDAFTAR ? generateRegistrationId(churchName, usedIds) : null;

      const registration = registrationRepository.create({
        userId: savedUser.id,
        status,
        registrationId,
        paymentProofUrl: hasPaymentProof ? `https://example.com/payment-proof-${savedUser.id}.jpg` : null,
        baseAmount,
        totalAmount,
        uniqueCode,
        shirtSize,
        checkedInAt: participantCheckedIn ? new Date() : null,
        rejectReason: isDaftarUlang ? getRandomElement(REJECT_REASONS) : null,
      });
      const savedRegistration = await registrationRepository.save(registration);

      if (childCount > 0) {
        const children = Array.from({ length: childCount }, (_, idx) => {
          const childName = `${getRandomElement(CHILD_NAMES)} ${lastName}`;
          const childAge = 7 + Math.floor(Math.random() * 6);
          // Beberapa anak check-in jika peserta sudah check-in (~50% chance per child)
          const childCheckedIn = participantCheckedIn && Math.random() < 0.5;
          const needsConsumption = childNeedsConsumption[idx] ?? true;
          return registrationChildRepository.create({
            registrationId: savedRegistration.id,
            name: childName,
            age: childAge,
            needsConsumption,
            checkedInAt: childCheckedIn ? new Date() : null,
          });
        });
        await registrationChildRepository.save(children);
      }

      console.log(`✅ Created participant ${i + 1}: ${fullName} (${email}) - Status: ${status}, Church: ${churchName}, RegID: ${registrationId ?? '-'}, Size: ${shirtSize ?? '-'}, Children: ${childCount}`);
    }

    console.log('\n✅ Seeding completed successfully!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seedParticipants();
