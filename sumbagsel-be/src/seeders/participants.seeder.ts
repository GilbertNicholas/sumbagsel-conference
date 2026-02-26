import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, UserStatus } from '../entities/user.entity';
import { UserIdentity, Provider } from '../entities/user-identity.entity';
import { Profile } from '../entities/profile.entity';
import { Registration, RegistrationStatus } from '../entities/registration.entity';
import { RegistrationChild } from '../entities/registration-child.entity';
import { ArrivalSchedule } from '../entities/arrival-schedule.entity';
import { Admin } from '../entities/admin.entity';
import * as bcrypt from 'bcrypt';

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

const CHURCH_OPTIONS = ['GKDI Batam', 'GKDI Bangka', 'GKDI Jambi', 'GKDI Palembang', 'GKDI Pekanbaru'];

const CHILD_NAMES = ['Andi', 'Bella', 'Cahya', 'Dina', 'Eko', 'Fitri', 'Gilang', 'Hana', 'Indra', 'Jasmine'];

const FIRST_NAMES = [
  'Budi', 'Siti', 'Ahmad', 'Dewi', 'Rudi', 'Lina', 'Hadi', 'Maya', 'Joko', 'Rina',
  'Ari', 'Sari', 'Dedi', 'Nina', 'Eko', 'Lisa', 'Fajar', 'Dina', 'Gunawan', 'Rita',
];

const LAST_NAMES = [
  'Santoso', 'Wijaya', 'Prasetyo', 'Kurniawan', 'Setiawan', 'Sari', 'Hidayat', 'Putri',
  'Saputra', 'Lestari', 'Rahman', 'Sari', 'Nugroho', 'Sari', 'Wibowo', 'Sari',
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
];

const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'];

const STATUS_OPTIONS: RegistrationStatus[] = [
  RegistrationStatus.BELUM_TERDAFTAR,
  RegistrationStatus.PENDING,
  RegistrationStatus.TERDAFTAR,
];

function calcRegistrationAmount(ministry: string, churchName: string, childCount: number): { baseAmount: number; uniqueCode: string; totalAmount: number } {
  let baseAmount = 0;
  if (ministry === 'Teens/Campus') {
    baseAmount = MINISTRY_FEE_TEENS;
  } else if (ministry === 'Single/S2' || ministry === 'Married') {
    baseAmount = churchName === GKDI_BATAM ? MINISTRY_FEE_SINGLE_MARRIED_BATAM : MINISTRY_FEE_SINGLE_MARRIED_OTHER;
  } else {
    baseAmount = MINISTRY_FEE_SINGLE_MARRIED_OTHER;
  }
  baseAmount += childCount * CHILD_FEE;
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
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const randomDomain = getRandomElement(domains);
  const randomNumber = Math.floor(Math.random() * 10000) + index * 1000;
  return `participant${index + 1}.${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNumber}@${randomDomain}`;
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

    for (let i = 0; i < 20; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const email = getRandomEmail(firstName, lastName, i);
      const phoneNumber = getRandomPhoneNumber();
      const churchName = getRandomElement(CHURCH_OPTIONS);
      const ministry = getRandomElement(MINISTRY_OPTIONS);
      const specialNotes = getRandomElement(SPECIAL_NOTES_OPTIONS);
      const status = getRandomElement(STATUS_OPTIONS);

      const user = userRepository.create({
        email,
        passwordHash: await bcrypt.hash('password123', 10),
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

      const profile = profileRepository.create({
        userId: savedUser.id,
        fullName,
        churchName,
        ministry,
        contactEmail: email,
        phoneNumber,
        specialNotes,
        isCompleted: true,
        completedAt: new Date(),
      });
      await profileRepository.save(profile);

      const hasPaymentProof = status !== RegistrationStatus.BELUM_TERDAFTAR;
      const childCount = (ministry === 'Single/S2' || ministry === 'Married') && Math.random() > 0.5
        ? Math.floor(1 + Math.random() * 2)
        : 0;

      const { baseAmount, uniqueCode, totalAmount } = hasPaymentProof
        ? calcRegistrationAmount(ministry, churchName, childCount)
        : { baseAmount: null, uniqueCode: null, totalAmount: null };

      const registration = registrationRepository.create({
        userId: savedUser.id,
        status,
        paymentProofUrl: hasPaymentProof ? `https://example.com/payment-proof-${savedUser.id}.jpg` : null,
        baseAmount,
        totalAmount,
        uniqueCode,
      });
      const savedRegistration = await registrationRepository.save(registration);

      if (childCount > 0) {
        const children = Array.from({ length: childCount }, (_, idx) =>
          registrationChildRepository.create({
            registrationId: savedRegistration.id,
            name: `${getRandomElement(CHILD_NAMES)} ${lastName}`,
            age: 7 + Math.floor(Math.random() * 6),
          }),
        );
        await registrationChildRepository.save(children);
      }

      console.log(`✅ Created participant ${i + 1}: ${fullName} (${email}) - Status: ${status}`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('All participants created with password: password123');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seedParticipants();
