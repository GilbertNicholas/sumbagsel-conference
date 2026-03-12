import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByUserId(userId: string): Promise<ProfileResponseDto | null> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    return this.toResponseDto(profile);
  }

  async create(
    userId: string,
    createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    // Check if profile already exists
    const existingProfile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Anda sudah memiliki profil. Silakan gunakan menu Profil untuk mengubah data.');
    }

    // Get user to get email for default contact_email
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { fullName, churchName, ministry, contactEmail, phoneNumber, gender, age, specialNotes } = createProfileDto;

    // Determine if profile is completed (phone + email + age wajib)
    const hasValidFullName = fullName && fullName.trim() !== '' && fullName !== 'Belum diisi';
    const hasValidChurchName = churchName && churchName.trim() !== '' && churchName !== 'Belum diisi';
    const hasValidMinistry = ministry && ministry.trim() !== '';
    const hasValidAge = age != null && age >= 13 && age <= 100;
    const hasValidPhone = phoneNumber && phoneNumber.trim() !== '' && phoneNumber !== 'Belum diisi';
    const hasValidEmail = (contactEmail || user.email) && (contactEmail || user.email)!.trim() !== '';
    const isCompleted = !!(hasValidFullName && hasValidChurchName && hasValidMinistry && hasValidAge && hasValidPhone && hasValidEmail);
    const completedAt = isCompleted ? new Date() : null;

    // Check if phone/email already registered by another user
    if (phoneNumber?.trim()) {
      const taken = await this.isPhoneTakenByOther(phoneNumber);
      if (taken) {
        throw new ConflictException('No. WA sudah terdaftar!');
      }
    }
    const emailToCheck = (contactEmail || user.email)?.trim();
    if (emailToCheck) {
      const taken = await this.isEmailTakenByOther(emailToCheck);
      if (taken) {
        throw new ConflictException('Email sudah terdaftar!');
      }
    }

    // Create profile
    const profile = this.profilesRepository.create({
      userId,
      fullName,
      churchName,
      ministry: ministry || null,
      gender: gender || null,
      age: age != null ? age : null,
      contactEmail: contactEmail || user.email,
      phoneNumber: phoneNumber || null,
      specialNotes: specialNotes || null,
      isCompleted,
      completedAt,
    });

    const savedProfile = await this.profilesRepository.save(profile);

    return this.toResponseDto(savedProfile);
  }

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Get user to get email for default contact_email
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields
    if (updateProfileDto.fullName !== undefined) {
      profile.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.churchName !== undefined) {
      profile.churchName = updateProfileDto.churchName;
    }
    if (updateProfileDto.ministry !== undefined) {
      profile.ministry = updateProfileDto.ministry || null;
    }
    if (updateProfileDto.gender !== undefined) {
      profile.gender = updateProfileDto.gender || null;
    }
    if (updateProfileDto.age !== undefined) {
      profile.age = updateProfileDto.age ?? null;
    }
    if (updateProfileDto.contactEmail !== undefined) {
      const existingEmail = (profile.contactEmail || user.email)?.trim().toLowerCase();
      const newEmail = (updateProfileDto.contactEmail || user.email)?.trim().toLowerCase() || null;
      if (newEmail && newEmail !== existingEmail) {
        const taken = await this.isEmailTakenByOther(newEmail, userId);
        if (taken) {
          throw new ConflictException('Email sudah terdaftar!');
        }
      }
      profile.contactEmail = updateProfileDto.contactEmail || user.email;
      // Sync user.email when contactEmail changes (for consistency)
      if (profile.contactEmail && user.email !== profile.contactEmail) {
        user.email = profile.contactEmail;
        await this.usersRepository.save(user);
      }
    }
    if (updateProfileDto.phoneNumber !== undefined) {
      const existingPhone = profile.phoneNumber?.trim();
      const newPhone = updateProfileDto.phoneNumber?.trim() || null;
      if (newPhone) {
        const normalizedExisting = existingPhone
          ? this.normalizePhoneNumber(existingPhone)
          : '';
        const normalizedNew = this.normalizePhoneNumber(newPhone);
        if (normalizedNew !== normalizedExisting) {
          const taken = await this.isPhoneTakenByOther(newPhone, userId);
          if (taken) {
            throw new ConflictException('No. WA sudah terdaftar!');
          }
        }
      }
      profile.phoneNumber = newPhone;
    }
    if (updateProfileDto.specialNotes !== undefined) {
      profile.specialNotes = updateProfileDto.specialNotes?.trim() || null;
    }

    // Always recalculate isCompleted based on current fullName, churchName, ministry, and age
    const wasCompleted = profile.isCompleted;
    const hasValidFullName = profile.fullName && 
      profile.fullName.trim() !== '' && 
      profile.fullName !== 'Belum diisi';
    const hasValidChurchName = profile.churchName && 
      profile.churchName.trim() !== '' && 
      profile.churchName !== 'Belum diisi';
    const hasValidMinistry = profile.ministry && profile.ministry.trim() !== '';
    const hasValidAge = profile.age != null && profile.age >= 13 && profile.age <= 100;
    const hasValidPhone = profile.phoneNumber && profile.phoneNumber.trim() !== '' && profile.phoneNumber !== 'Belum diisi';
    const hasValidEmail = (profile.contactEmail || user.email) && (profile.contactEmail || user.email)!.trim() !== '';
    
    profile.isCompleted = !!(hasValidFullName && hasValidChurchName && hasValidMinistry && hasValidAge && hasValidPhone && hasValidEmail);
    
    if (profile.isCompleted && !wasCompleted) {
      profile.completedAt = new Date();
      if (profile.contactEmail && user.email !== profile.contactEmail) {
        user.email = profile.contactEmail;
        await this.usersRepository.save(user);
      }
    } else if (!profile.isCompleted && wasCompleted) {
      // No longer completed
      profile.completedAt = null;
    }

    const updatedProfile = await this.profilesRepository.save(profile);

    return this.toResponseDto(updatedProfile);
  }

  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/[\s-]/g, '');
    if (normalized.startsWith('+62')) {
      normalized = '0' + normalized.substring(3);
    }
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
    return normalized;
  }

  private async isPhoneTakenByOther(
    phone: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const normalized = this.normalizePhoneNumber(phone.trim());
    const profiles = await this.profilesRepository.find({
      where: { phoneNumber: Not(IsNull()) },
      select: ['id', 'userId', 'phoneNumber'],
    });
    for (const p of profiles) {
      if (
        p.phoneNumber &&
        this.normalizePhoneNumber(p.phoneNumber) === normalized
      ) {
        if (!excludeUserId || p.userId !== excludeUserId) return true;
      }
    }
    return false;
  }

  private async isEmailTakenByOther(
    email: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    const qb = this.profilesRepository
      .createQueryBuilder('profile')
      .where('LOWER(profile.contact_email) = :email', { email: normalized });
    if (excludeUserId) {
      qb.andWhere('profile.user_id != :userId', { userId: excludeUserId });
    }
    const profile = await qb.getOne();
    return !!profile;
  }

  private toResponseDto(profile: Profile): ProfileResponseDto {
    return {
      id: profile.id,
      fullName: profile.fullName,
      churchName: profile.churchName,
      ministry: profile.ministry,
      gender: profile.gender,
      age: profile.age ?? null,
      contactEmail: profile.contactEmail,
      phoneNumber: profile.phoneNumber,
      specialNotes: profile.specialNotes,
      isCompleted: profile.isCompleted,
    };
  }
}

