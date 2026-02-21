import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration, RegistrationStatus } from '../entities/registration.entity';
import { RegistrationChild } from '../entities/registration-child.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CreateRegistrationWithChildrenDto } from './dto/create-registration-with-children.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { ProfilesService } from '../profiles/profiles.service';

const MINISTRY_FEE_TEENS = 150_000;
const MINISTRY_FEE_SINGLE_MARRIED_BATAM = 150_000;
const MINISTRY_FEE_SINGLE_MARRIED_OTHER = 300_000;
const CHILD_FEE = 75_000;
const GKDI_BATAM = 'GKDI Batam';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
    @InjectRepository(RegistrationChild)
    private registrationChildrenRepository: Repository<RegistrationChild>,
    private profilesService: ProfilesService,
  ) {}

  async findOneByUserId(userId: string): Promise<RegistrationResponseDto | null> {
    const registration = await this.registrationsRepository.findOne({
      where: { userId },
      relations: ['children'],
    });

    if (!registration) {
      return null;
    }

    return this.toResponseDto(registration);
  }

  async createWithChildren(
    userId: string,
    dto: CreateRegistrationWithChildrenDto,
  ): Promise<RegistrationResponseDto> {
    const existing = await this.registrationsRepository.findOne({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Registration already exists');
    }

    const profile = await this.profilesService.findOneByUserId(userId);
    if (!profile) {
      throw new BadRequestException('Profile not found. Complete profile setup first.');
    }
    if (!profile.ministry) {
      throw new BadRequestException('Ministry is required. Complete profile setup first.');
    }

    // Teens/Campus cannot have children
    if (
      profile.ministry === 'Teens/Campus' &&
      dto.children &&
      dto.children.length > 0
    ) {
      throw new BadRequestException('Teens/Campus ministry cannot register children');
    }

    const ministry = profile.ministry;
    const churchName = profile.churchName || '';

    let baseAmount = 0;
    if (ministry === 'Teens/Campus') {
      baseAmount = MINISTRY_FEE_TEENS;
    } else if (ministry === 'Single/S2' || ministry === 'Married') {
      baseAmount =
        churchName === GKDI_BATAM
          ? MINISTRY_FEE_SINGLE_MARRIED_BATAM
          : MINISTRY_FEE_SINGLE_MARRIED_OTHER;
    } else {
      baseAmount = MINISTRY_FEE_SINGLE_MARRIED_OTHER;
    }

    const childCount = dto.children?.length ?? 0;
    baseAmount += childCount * CHILD_FEE;

    const uniqueCode = String(Math.floor(100 + Math.random() * 900));
    const totalAmount = baseAmount + parseInt(uniqueCode, 10);

    const registration = this.registrationsRepository.create({
      userId,
      status: RegistrationStatus.BELUM_TERDAFTAR,
      uniqueCode,
      totalAmount,
      baseAmount,
    });
    const savedRegistration = await this.registrationsRepository.save(registration);

    if (dto.children && dto.children.length > 0) {
      const children = dto.children.map((c) =>
        this.registrationChildrenRepository.create({
          registrationId: savedRegistration.id,
          name: c.name,
          age: c.age,
        }),
      );
      await this.registrationChildrenRepository.save(children);
    }

    const fullRegistration = await this.registrationsRepository.findOne({
      where: { id: savedRegistration.id },
      relations: ['children'],
    });
    return this.toResponseDto(fullRegistration!);
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

    const fullReg = await this.registrationsRepository.findOne({
      where: { id: savedRegistration.id },
      relations: ['children'],
    });
    return this.toResponseDto(fullReg!);
  }

  async update(
    userId: string,
    updateRegistrationDto: UpdateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsRepository.findOne({
      where: { userId },
      relations: ['children'],
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
      relations: ['children'],
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
    const children = registration.children?.map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
    })) ?? [];
    return {
      id: registration.id,
      userId: registration.userId,
      paymentProofUrl: registration.paymentProofUrl,
      status: registration.status,
      uniqueCode: registration.uniqueCode,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      children,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
    };
  }
}
