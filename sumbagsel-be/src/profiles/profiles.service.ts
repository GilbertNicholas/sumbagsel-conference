import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      throw new ConflictException('Profile already exists for this user');
    }

    // Get user to get email for default contact_email
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { fullName, churchName, ministry, contactEmail, phoneNumber, specialNotes } = createProfileDto;

    // Determine if profile is completed
    const hasValidFullName = fullName && fullName.trim() !== '' && fullName !== 'Belum diisi';
    const hasValidChurchName = churchName && churchName.trim() !== '' && churchName !== 'Belum diisi';
    const hasValidMinistry = ministry && ministry.trim() !== '';
    const isCompleted = !!(hasValidFullName && hasValidChurchName && hasValidMinistry);
    const completedAt = isCompleted ? new Date() : null;

    // Create profile
    const profile = this.profilesRepository.create({
      userId,
      fullName,
      churchName,
      ministry: ministry || null,
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
    if (updateProfileDto.contactEmail !== undefined) {
      profile.contactEmail = updateProfileDto.contactEmail || user.email;
    }
    if (updateProfileDto.phoneNumber !== undefined) {
      profile.phoneNumber = updateProfileDto.phoneNumber?.trim() || null;
    }
    if (updateProfileDto.specialNotes !== undefined) {
      profile.specialNotes = updateProfileDto.specialNotes?.trim() || null;
    }

    // Always recalculate isCompleted based on current fullName, churchName, and ministry
    const wasCompleted = profile.isCompleted;
    const hasValidFullName = profile.fullName && 
      profile.fullName.trim() !== '' && 
      profile.fullName !== 'Belum diisi';
    const hasValidChurchName = profile.churchName && 
      profile.churchName.trim() !== '' && 
      profile.churchName !== 'Belum diisi';
    const hasValidMinistry = profile.ministry && profile.ministry.trim() !== '';
    
    profile.isCompleted = !!(hasValidFullName && hasValidChurchName && hasValidMinistry);
    
    if (profile.isCompleted && !wasCompleted) {
      // Just became completed
      profile.completedAt = new Date();
    } else if (!profile.isCompleted && wasCompleted) {
      // No longer completed
      profile.completedAt = null;
    }

    const updatedProfile = await this.profilesRepository.save(profile);

    return this.toResponseDto(updatedProfile);
  }

  private toResponseDto(profile: Profile): ProfileResponseDto {
    return {
      id: profile.id,
      fullName: profile.fullName,
      churchName: profile.churchName,
      ministry: profile.ministry,
      contactEmail: profile.contactEmail,
      phoneNumber: profile.phoneNumber,
      specialNotes: profile.specialNotes,
      isCompleted: profile.isCompleted,
    };
  }
}

