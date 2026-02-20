import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { User } from './entities/user.entity';
import { UserIdentity } from './entities/user-identity.entity';
import { Profile } from './entities/profile.entity';
import { Registration } from './entities/registration.entity';
import { ArrivalSchedule } from './entities/arrival-schedule.entity';
import { Admin } from './entities/admin.entity';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: `.env.${nodeEnv}.local` });
config({ path: `.env.${nodeEnv}` });
config({ path: '.env.local' });
config({ path: '.env' });

export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [User, UserIdentity, Profile, Registration, ArrivalSchedule, Admin],
  migrations: [
    join(__dirname, '..', 'migrations', '*.{ts,js}'),
  ],
  synchronize: false,
  logging: nodeEnv !== 'production',
});

