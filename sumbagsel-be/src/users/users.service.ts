import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async findByContactEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('LOWER(profile.contact_email) = :email', { email: normalized })
      .getOne();
    return profile?.user || null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const trimmed = identifier.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return this.findByContactEmail(trimmed);
    }
    return this.findByPhoneNumber(trimmed);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const profile = await this.profilesRepository.findOne({
      where: { phoneNumber },
      relations: ['user'],
    });
    return profile?.user || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async checkProfileStatus(userId: string): Promise<{
    profileExists: boolean;
    profileCompleted: boolean;
  }> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    return {
      profileExists: !!profile,
      profileCompleted: profile?.isCompleted ?? false,
    };
  }
}

