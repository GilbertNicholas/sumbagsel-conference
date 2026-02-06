import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration, RegistrationStatus } from '../entities/registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
  ) {}

  async findOneByUserId(userId: string): Promise<RegistrationResponseDto | null> {
    const registration = await this.registrationsRepository.findOne({
      where: { userId },
    });

    if (!registration) {
      return null;
    }

    return this.toResponseDto(registration);
  }

  async create(
    userId: string,
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    // Check if registration already exists, if so update it
    const existingRegistration = await this.registrationsRepository.findOne({
      where: { userId },
    });

    if (existingRegistration) {
      // Update existing registration
      Object.assign(existingRegistration, createRegistrationDto);
      const updatedRegistration = await this.registrationsRepository.save(existingRegistration);
      return this.toResponseDto(updatedRegistration);
    }

    const registration = this.registrationsRepository.create({
      userId,
      ...createRegistrationDto,
      status: RegistrationStatus.BELUM_TERDAFTAR,
    });

    const savedRegistration = await this.registrationsRepository.save(registration);

    return this.toResponseDto(savedRegistration);
  }

  async update(
    userId: string,
    updateRegistrationDto: UpdateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsRepository.findOne({
      where: { userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Update fields
    Object.assign(registration, updateRegistrationDto);

    const updatedRegistration = await this.registrationsRepository.save(registration);

    return this.toResponseDto(updatedRegistration);
  }

  async submitRegistration(userId: string): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsRepository.findOne({
      where: { userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Update status to pending
    registration.status = RegistrationStatus.PENDING;

    const updatedRegistration = await this.registrationsRepository.save(registration);

    return this.toResponseDto(updatedRegistration);
  }

  private toResponseDto(registration: Registration): RegistrationResponseDto {
    return {
      id: registration.id,
      userId: registration.userId,
      paymentProofUrl: registration.paymentProofUrl,
      status: registration.status,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
    };
  }
}
