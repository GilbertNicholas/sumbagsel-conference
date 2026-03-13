import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../entities/admin.entity';
import { Registration } from '../entities/registration.entity';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { ArrivalSchedule } from '../entities/arrival-schedule.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthResponseDto } from './dto/admin-auth-response.dto';
import { ParticipantResponseDto } from './dto/participant-response.dto';
import { ParticipantDetailResponseDto } from './dto/participant-detail-response.dto';
import { ArrivalScheduleFilterDto } from './dto/arrival-schedule-filter.dto';
import { ArrivalScheduleResponseDto, ArrivalScheduleSummaryDto, ArrivalScheduleGroupedDto } from './dto/arrival-schedule-response.dto';
import { RegistrationStatus } from '../entities/registration.entity';
import { MailService } from '../mail/mail.service';
import { ShirtDataFilterDto } from './dto/shirt-data-filter.dto';
import { ShirtDataResponseDto, ShirtDataRowDto } from './dto/shirt-data-response.dto';
import { ChildrenFilterDto } from './dto/children-filter.dto';
import { ChildrenResponseDto, ChildRowDto } from './dto/children-response.dto';
import { AdminUpdateParticipantContactDto } from './dto/admin-update-participant-contact.dto';
import { RegistrationChild } from '../entities/registration-child.entity';

const CHILD_FEE = 75_000;

/** Opsi gereja utama - untuk filter "Lainnya" (church NOT IN list) */
const MAIN_CHURCH_OPTIONS = ['GKDI Batam', 'GKDI Bangka', 'GKDI Jambi', 'GKDI Palembang', 'GKDI Lampung'];
const CHURCH_FILTER_OTHER = '__lainnya__';

/** Prefix Registration ID berdasarkan asal gereja */
const REG_ID_PREFIX: Record<string, string> = {
  'GKDI Batam': 'BT',
  'GKDI Lampung': 'LM',
  'GKDI Bangka': 'BK',
  'GKDI Palembang': 'PL',
  'GKDI Jambi': 'JB',
};
const REG_ID_OTHER_PREFIX = 'EX';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private mailService: MailService,
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(ArrivalSchedule)
    private arrivalSchedulesRepository: Repository<ArrivalSchedule>,
    @InjectRepository(RegistrationChild)
    private registrationChildrenRepository: Repository<RegistrationChild>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    // No runtime seeding - admins are seeded via migration
  }

  async login(loginDto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    const { code } = loginDto;

    // Find admin by code
    const admin = await this.adminRepository.findOne({
      where: { code },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin ID tidak terdaftar');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Akun admin tidak aktif');
    }

    // Generate JWT token
    const accessToken = this.generateToken(admin);

    return {
      accessToken,
      admin: {
        id: admin.id,
        code: admin.code,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async validateAdmin(adminId: string): Promise<Admin | null> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    return admin;
  }

  async getAllParticipants(): Promise<ParticipantResponseDto[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.registration', 'registration')
      .where('profile.fullName IS NOT NULL')
      .andWhere('profile.fullName != :placeholder', { placeholder: 'Belum diisi' })
      .andWhere('profile.churchName IS NOT NULL')
      .andWhere('profile.churchName != :placeholder', { placeholder: 'Belum diisi' })
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return users.map((user) => {
      const profile = user.profile;
      const registration = user.registration;
      return {
        id: registration?.id ?? user.id,
        userId: user.id,
        fullName: profile?.fullName || '-',
        churchName: profile?.churchName || '-',
        ministry: profile?.ministry || null,
        gender: profile?.gender || null,
        phoneNumber: profile?.phoneNumber || null,
        email: user.email || profile?.contactEmail || '-',
        status: registration?.status ?? 'Belum terdaftar',
        registrationId: registration?.registrationId ?? null,
        paymentProofUrl: registration?.paymentProofUrl ?? null,
        checkedInAt: registration?.checkedInAt?.toISOString() ?? null,
        shirtSize: registration?.shirtSize ?? null,
        createdAt: registration?.createdAt?.toISOString() ?? user.createdAt.toISOString(),
        updatedAt: registration?.updatedAt?.toISOString() ?? user.updatedAt.toISOString(),
      };
    });
  }

  async getParticipantById(participantId: string): Promise<ParticipantDetailResponseDto> {
    // Try registration by id first
    const registration = await this.registrationsRepository.findOne({
      where: { id: participantId },
      relations: ['user', 'user.profile', 'children'],
    });

    if (registration) {
      const profile = registration.user?.profile;
      const children = (registration.children || []).map((c) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        needsConsumption: c.needsConsumption ?? true,
        checkedInAt: c.checkedInAt?.toISOString() ?? null,
      }));

      return {
        id: registration.id,
        userId: registration.userId,
        fullName: profile?.fullName || '-',
        churchName: profile?.churchName || '-',
        ministry: profile?.ministry || null,
        gender: profile?.gender || null,
        dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
        phoneNumber: profile?.phoneNumber || null,
        email: registration.user?.email || profile?.contactEmail || '-',
        specialNotes: profile?.specialNotes || null,
        status: registration.status,
        registrationId: registration.registrationId ?? null,
        paymentProofUrl: registration.paymentProofUrl,
        children,
        baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
        totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
        uniqueCode: registration.uniqueCode,
        shirtSize: registration.shirtSize ?? null,
        checkedInAt: registration.checkedInAt?.toISOString() ?? null,
        rejectReason: registration.rejectReason ?? null,
        createdAt: registration.createdAt.toISOString(),
        updatedAt: registration.updatedAt.toISOString(),
      };
    }

    // Not a registration id - try user id (peserta dengan profil tapi belum daftar)
    const user = await this.usersRepository.findOne({
      where: { id: participantId },
      relations: ['profile'],
    });

    if (!user?.profile) {
      throw new NotFoundException('Participant not found');
    }

    const profile = user.profile;
    return {
      id: user.id,
      userId: user.id,
      fullName: profile.fullName || '-',
      churchName: profile.churchName || '-',
      ministry: profile.ministry || null,
      gender: profile.gender || null,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
      phoneNumber: profile.phoneNumber || null,
      email: user.email || profile?.contactEmail || '-',
      specialNotes: profile.specialNotes || null,
      status: 'Belum terdaftar',
      registrationId: null,
      paymentProofUrl: null,
      children: [],
      baseAmount: null,
      totalAmount: null,
      uniqueCode: null,
      shirtSize: null,
      checkedInAt: null,
      rejectReason: null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async generateRegistrationId(churchName: string): Promise<string> {
    const prefix = REG_ID_PREFIX[churchName] ?? REG_ID_OTHER_PREFIX;
    for (let attempt = 0; attempt < 100; attempt++) {
      const num = Math.floor(100 + Math.random() * 900);
      const regId = `${prefix}${num}`;
      const existing = await this.registrationsRepository.findOne({
        where: { registrationId: regId },
      });
      if (!existing) return regId;
    }
    throw new BadRequestException('Gagal generate Registration ID, coba lagi');
  }

  async approveRegistration(registrationId: string, admin: Admin): Promise<ParticipantDetailResponseDto> {
    if (admin.role !== 'master') {
      throw new ForbiddenException('Hanya Admin Master yang dapat menyetujui pendaftaran');
    }
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
      relations: ['user', 'user.profile', 'children'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('Hanya pendaftaran dengan status Pending yang dapat disetujui');
    }

    const churchName = registration.user?.profile?.churchName ?? '';
    registration.registrationId = await this.generateRegistrationId(churchName);
    registration.status = RegistrationStatus.TERDAFTAR;
    await this.registrationsRepository.save(registration);

    // Kirim email konfirmasi ke user
    const recipientEmail = registration.user?.email || registration.user?.profile?.contactEmail;
    if (recipientEmail && recipientEmail.trim() !== '' && recipientEmail !== '-') {
      const profile = registration.user?.profile;
      const childFees = (registration.children ?? []).reduce((sum, c) => sum + (c.needsConsumption ? CHILD_FEE : 0), 0);
      const ministryFee =
        (registration.baseAmount != null ? Number(registration.baseAmount) : 0) - childFees;
      this.mailService
        .sendRegistrationConfirmationEmail(recipientEmail.trim(), {
          fullName: profile?.fullName || '-',
          ministry: profile?.ministry || '-',
          shirtSize: registration.shirtSize ?? null,
          children: (registration.children || []).map((c) => ({ name: c.name, age: c.age, needsConsumption: c.needsConsumption ?? true })),
          ministryFee,
          baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : 0,
          uniqueCode: registration.uniqueCode,
          totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : 0,
          registrationId: registration.registrationId ?? null,
        })
        .catch((err) => {
          this.logger.error('Failed to send registration confirmation email', err);
        });
    }

    const profile = registration.user?.profile;
    const children = (registration.children || []).map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      needsConsumption: c.needsConsumption ?? true,
      checkedInAt: c.checkedInAt?.toISOString() ?? null,
    }));

    return {
      id: registration.id,
      userId: registration.userId,
      fullName: profile?.fullName || '-',
      churchName: profile?.churchName || '-',
      ministry: profile?.ministry || null,
      gender: profile?.gender || null,
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
      phoneNumber: profile?.phoneNumber || null,
      email: registration.user?.email || profile?.contactEmail || '-',
      specialNotes: profile?.specialNotes || null,
      status: registration.status,
      registrationId: registration.registrationId ?? null,
      paymentProofUrl: registration.paymentProofUrl,
      children,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      uniqueCode: registration.uniqueCode,
      shirtSize: registration.shirtSize ?? null,
      checkedInAt: registration.checkedInAt?.toISOString() ?? null,
      rejectReason: registration.rejectReason ?? null,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
  }

  async rejectRegistration(registrationId: string, reason: string, admin: Admin): Promise<ParticipantDetailResponseDto> {
    if (admin.role !== 'master') {
      throw new ForbiddenException('Hanya Admin Master yang dapat menolak pendaftaran');
    }
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
      relations: ['user', 'user.profile', 'children'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('Hanya pendaftaran dengan status Pending yang dapat ditolak');
    }

    registration.status = RegistrationStatus.DAFTAR_ULANG;
    registration.paymentProofUrl = null;
    registration.rejectReason = reason.trim();
    await this.registrationsRepository.save(registration);

    const profile = registration.user?.profile;
    const children = (registration.children || []).map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      needsConsumption: c.needsConsumption ?? true,
      checkedInAt: c.checkedInAt?.toISOString() ?? null,
    }));

    return {
      id: registration.id,
      userId: registration.userId,
      fullName: profile?.fullName || '-',
      churchName: profile?.churchName || '-',
      ministry: profile?.ministry || null,
      gender: profile?.gender || null,
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
      phoneNumber: profile?.phoneNumber || null,
      email: registration.user?.email || profile?.contactEmail || '-',
      specialNotes: profile?.specialNotes || null,
      status: registration.status,
      registrationId: registration.registrationId ?? null,
      paymentProofUrl: registration.paymentProofUrl,
      children,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      uniqueCode: registration.uniqueCode,
      shirtSize: registration.shirtSize ?? null,
      checkedInAt: registration.checkedInAt?.toISOString() ?? null,
      rejectReason: registration.rejectReason,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
  }

  async updateParticipantContact(
    registrationId: string,
    dto: AdminUpdateParticipantContactDto,
  ): Promise<ParticipantDetailResponseDto> {
    if (dto.email === undefined && dto.phoneNumber === undefined) {
      throw new BadRequestException('Minimal satu field (email atau phoneNumber) harus diisi');
    }

    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
      relations: ['user', 'user.profile', 'children'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const user = registration.user;
    const profile = user?.profile;

    if (!user || !profile) {
      throw new NotFoundException('User atau profil tidak ditemukan');
    }

    if (dto.email !== undefined) {
      const trimmed = dto.email.trim();
      user.email = trimmed || null;
      await this.usersRepository.save(user);
      profile.contactEmail = trimmed || null;
      await this.profilesRepository.save(profile);
    }

    if (dto.phoneNumber !== undefined) {
      profile.phoneNumber = dto.phoneNumber.trim() || null;
      await this.profilesRepository.save(profile);
    }

    return this.getParticipantById(registrationId);
  }

  async setReregister(registrationId: string, admin: Admin): Promise<ParticipantDetailResponseDto> {
    if (admin.role !== 'master') {
      throw new ForbiddenException('Hanya Admin Master yang dapat mengubah status menjadi Daftar ulang');
    }

    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
      relations: ['user', 'user.profile', 'children'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== RegistrationStatus.TERDAFTAR) {
      throw new BadRequestException('Hanya pendaftaran dengan status Terdaftar yang dapat diubah menjadi Daftar ulang');
    }

    registration.status = RegistrationStatus.DAFTAR_ULANG;
    registration.registrationId = null;
    registration.paymentProofUrl = null;
    registration.rejectReason = null;
    registration.checkedInAt = null;
    await this.registrationsRepository.save(registration);

    return this.getParticipantById(registrationId);
  }

  async checkInParticipant(registrationId: string): Promise<ParticipantDetailResponseDto> {
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
      relations: ['user', 'user.profile', 'children'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== RegistrationStatus.TERDAFTAR) {
      throw new BadRequestException('Check-in hanya dapat dilakukan untuk peserta yang telah disetujui (Terdaftar)');
    }

    if (registration.checkedInAt) {
      throw new BadRequestException('Peserta sudah melakukan check-in');
    }

    registration.checkedInAt = new Date();
    await this.registrationsRepository.save(registration);

    const profile = registration.user?.profile;
    const children = (registration.children || []).map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      needsConsumption: c.needsConsumption ?? true,
      checkedInAt: c.checkedInAt?.toISOString() ?? null,
    }));

    return {
      id: registration.id,
      userId: registration.userId,
      fullName: profile?.fullName || '-',
      churchName: profile?.churchName || '-',
      ministry: profile?.ministry || null,
      gender: profile?.gender || null,
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
      phoneNumber: profile?.phoneNumber || null,
      email: registration.user?.email || profile?.contactEmail || '-',
      specialNotes: profile?.specialNotes || null,
      status: registration.status,
      registrationId: registration.registrationId ?? null,
      paymentProofUrl: registration.paymentProofUrl,
      children,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      uniqueCode: registration.uniqueCode,
      shirtSize: registration.shirtSize ?? null,
      checkedInAt: registration.checkedInAt.toISOString(),
      rejectReason: registration.rejectReason ?? null,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
  }

  async checkInChild(childId: string): Promise<ParticipantDetailResponseDto> {
    const child = await this.registrationChildrenRepository.findOne({
      where: { id: childId },
      relations: ['registration', 'registration.user', 'registration.user.profile', 'registration.children'],
    });

    if (!child) {
      throw new NotFoundException('Anak tidak ditemukan');
    }

    const registration = child.registration;
    if (registration.status !== RegistrationStatus.TERDAFTAR) {
      throw new BadRequestException('Check-in anak hanya dapat dilakukan untuk peserta yang telah disetujui (Terdaftar)');
    }

    if (child.checkedInAt) {
      throw new BadRequestException('Anak sudah melakukan check-in');
    }

    child.checkedInAt = new Date();
    await this.registrationChildrenRepository.save(child);

    return this.getParticipantById(registration.id);
  }

  async getArrivalSchedules(filter: ArrivalScheduleFilterDto): Promise<ArrivalScheduleGroupedDto[]> {
    try {
      const queryBuilder = this.arrivalSchedulesRepository
        .createQueryBuilder('arrival')
        .leftJoinAndSelect('arrival.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('arrival.arrivalDate IS NOT NULL')
        .orderBy('arrival.arrivalDate', 'ASC')
        .addOrderBy('arrival.arrivalTime', 'ASC');

      // Apply filters
      if (filter?.transportationType) {
        queryBuilder.andWhere('arrival.transportationType = :transportationType', {
          transportationType: filter.transportationType,
        });
      }

      if (filter?.startDate) {
        queryBuilder.andWhere('arrival.arrivalDate >= :startDate', {
          startDate: filter.startDate,
        });
      }

      if (filter?.endDate) {
        queryBuilder.andWhere('arrival.arrivalDate <= :endDate', {
          endDate: filter.endDate,
        });
      }

      if (filter?.search && filter.search.trim()) {
        queryBuilder.andWhere(
          '(LOWER(profile.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.contactEmail) LIKE LOWER(:search) OR LOWER(profile.phoneNumber) LIKE LOWER(:search))',
          { search: `%${filter.search.trim()}%` },
        );
      }

      const arrivals = await queryBuilder.getMany();

      // Group by date
      const grouped = arrivals.reduce((acc, arrival) => {
        if (!arrival.arrivalDate) return acc;

        // Handle date conversion properly
        let dateKey: string;
        let dateObj: Date;
        
        if (arrival.arrivalDate instanceof Date) {
          dateObj = arrival.arrivalDate;
          dateKey = arrival.arrivalDate.toISOString().split('T')[0];
        } else {
          // Handle string date
          dateObj = new Date(arrival.arrivalDate);
          dateKey = dateObj.toISOString().split('T')[0];
        }

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            formattedDate: this.formatDate(dateObj),
            count: 0,
            arrivals: [],
          };
        }

        acc[dateKey].arrivals.push({
          id: arrival.id,
          userId: arrival.userId,
          fullName: arrival.user?.profile?.fullName || '-',
          email: arrival.user?.email || arrival.user?.profile?.contactEmail || '-',
          phoneNumber: arrival.user?.profile?.phoneNumber || null,
          transportationType: arrival.transportationType,
          carrierName: arrival.carrierName,
          flightNumber: arrival.flightNumber,
          arrivalDate: dateKey,
          arrivalTime: arrival.arrivalTime || null,
          createdAt: arrival.createdAt instanceof Date ? arrival.createdAt.toISOString() : arrival.createdAt,
        });

        acc[dateKey].count = acc[dateKey].arrivals.length;
        return acc;
      }, {} as Record<string, ArrivalScheduleGroupedDto>);

      return Object.values(grouped);
    } catch (error) {
      console.error('Error in getArrivalSchedules:', error);
      throw error;
    }
  }

  async getArrivalScheduleSummary(filter: ArrivalScheduleFilterDto): Promise<ArrivalScheduleSummaryDto> {
    try {
      const buildBaseQuery = () => {
        const query = this.arrivalSchedulesRepository
          .createQueryBuilder('arrival')
          .leftJoin('arrival.user', 'user')
          .leftJoin('user.profile', 'profile')
          .where('arrival.arrivalDate IS NOT NULL');

        if (filter?.startDate) {
          query.andWhere('arrival.arrivalDate >= :startDate', {
            startDate: filter.startDate,
          });
        }

        if (filter?.endDate) {
          query.andWhere('arrival.arrivalDate <= :endDate', {
            endDate: filter.endDate,
          });
        }

        if (filter?.search && filter.search.trim()) {
          query.andWhere(
            '(LOWER(profile.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.contactEmail) LIKE LOWER(:search) OR LOWER(profile.phoneNumber) LIKE LOWER(:search))',
            { search: `%${filter.search.trim()}%` },
          );
        }

        return query;
      };

      // Total arrivals
      const totalQuery = buildBaseQuery();
      if (filter?.transportationType) {
        totalQuery.andWhere('arrival.transportationType = :transportationType', {
          transportationType: filter.transportationType,
        });
      }
      const totalArrivals = await totalQuery.getCount();

      // By Air
      const byAirQuery = buildBaseQuery();
      if (!filter?.transportationType || filter.transportationType === 'udara') {
        byAirQuery.andWhere('arrival.transportationType = :airType', { airType: 'udara' });
      } else {
        // If filter is set to 'laut', byAir should be 0
        return {
          totalArrivals,
          byAir: 0,
          bySea: totalArrivals,
        };
      }
      const byAir = await byAirQuery.getCount();

      // By Sea
      const bySeaQuery = buildBaseQuery();
      if (!filter?.transportationType || filter.transportationType === 'laut') {
        bySeaQuery.andWhere('arrival.transportationType = :seaType', { seaType: 'laut' });
      } else {
        // If filter is set to 'udara', bySea should be 0
        return {
          totalArrivals,
          byAir: totalArrivals,
          bySea: 0,
        };
      }
      const bySea = await bySeaQuery.getCount();

      return {
        totalArrivals,
        byAir,
        bySea,
      };
    } catch (error) {
      console.error('Error in getArrivalScheduleSummary:', error);
      throw error;
    }
  }

  async exportArrivalSchedulesToCsv(filter: ArrivalScheduleFilterDto): Promise<string> {
    const arrivals = await this.getArrivalSchedules(filter);
    
    // Flatten grouped data
    const flatData = arrivals.flatMap(group => group.arrivals);

    // CSV headers
    const headers = [
      'Date',
      'Time',
      'Name',
      'Email',
      'Phone',
      'Transport Mode',
      'Carrier/Line',
      'Flight Number',
    ];

    // CSV rows
    const rows = flatData.map(arrival => [
      arrival.arrivalDate || '',
      arrival.arrivalTime || '',
      arrival.fullName,
      arrival.email,
      arrival.phoneNumber || '',
      arrival.transportationType === 'udara' ? 'By Air' : arrival.transportationType === 'laut' ? 'By Sea' : '',
      arrival.carrierName || '',
      arrival.flightNumber || '',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  private formatDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    return `${dayName}, ${monthName} ${day}, ${year}`;
  }

  private generateToken(admin: Admin): string {
    const payload = { sub: admin.id, code: admin.code, role: 'admin', adminRole: admin.role };
    return this.jwtService.sign(payload);
  }

  async getShirtData(filter?: ShirtDataFilterDto): Promise<ShirtDataResponseDto> {
    const qb = this.registrationsRepository
      .createQueryBuilder('reg')
      .innerJoinAndSelect('reg.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('reg.status = :status', { status: RegistrationStatus.TERDAFTAR })
      .andWhere('reg.shirt_size IS NOT NULL')
      .andWhere('reg.shirt_size != :empty', { empty: '' });

    if (filter?.church?.trim()) {
      if (filter.church.trim() === CHURCH_FILTER_OTHER) {
        qb.andWhere('profile.church_name NOT IN (:...mainChurches)', { mainChurches: MAIN_CHURCH_OPTIONS });
      } else {
        qb.andWhere('profile.church_name = :church', { church: filter.church.trim() });
      }
    }
    if (filter?.size?.trim()) {
      qb.andWhere('reg.shirt_size = :size', { size: filter.size.trim() });
    }

    const registrations = await qb
      .orderBy('profile.full_name', 'ASC')
      .getMany();

    const rows: ShirtDataRowDto[] = registrations.map((reg) => {
      const profile = reg.user?.profile;
      return {
        id: reg.id,
        fullName: profile?.fullName || '-',
        churchName: profile?.churchName || '-',
        shirtSize: reg.shirtSize || '-',
        phoneNumber: profile?.phoneNumber || null,
        email: reg.user?.email || profile?.contactEmail || '-',
      };
    });

    const totalsBySize: Record<string, number> = {};
    rows.forEach((r) => {
      const s = r.shirtSize || '-';
      totalsBySize[s] = (totalsBySize[s] || 0) + 1;
    });

    return { totalsBySize, rows };
  }

  async getChildren(filter?: ChildrenFilterDto): Promise<ChildrenResponseDto> {
    const qb = this.registrationChildrenRepository
      .createQueryBuilder('child')
      .innerJoinAndSelect('child.registration', 'reg')
      .innerJoinAndSelect('reg.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('reg.status = :status', { status: RegistrationStatus.TERDAFTAR });

    if (filter?.church?.trim()) {
      if (filter.church.trim() === CHURCH_FILTER_OTHER) {
        qb.andWhere('profile.church_name NOT IN (:...mainChurches)', { mainChurches: MAIN_CHURCH_OPTIONS });
      } else {
        qb.andWhere('profile.church_name = :church', { church: filter.church.trim() });
      }
    }
    if (filter?.needsConsumption === 'yes') {
      qb.andWhere('child.needsConsumption = :needsConsumption', { needsConsumption: true });
    } else if (filter?.needsConsumption === 'no') {
      qb.andWhere('(child.needsConsumption = :needsConsumption OR child.needsConsumption IS NULL)', {
        needsConsumption: false,
      });
    }
    if (filter?.checkInStatus === 'checked-in') {
      qb.andWhere('child.checked_in_at IS NOT NULL');
    } else if (filter?.checkInStatus === 'not-checked-in') {
      qb.andWhere('child.checked_in_at IS NULL');
    }
    if (filter?.search?.trim()) {
      const search = `%${filter.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(child.name) LIKE :search OR LOWER(profile.full_name) LIKE :search)',
        { search },
      );
    }

    const children = await qb
      .orderBy('profile.church_name', 'ASC')
      .addOrderBy('child.name', 'ASC')
      .getMany();

    const rows: ChildRowDto[] = children.map((child) => {
      const reg = child.registration;
      const profile = reg?.user?.profile;
      return {
        id: child.id,
        childName: child.name,
        churchName: profile?.churchName || '-',
        age: child.age,
        needsConsumption: child.needsConsumption ?? true,
        parentName: profile?.fullName || '-',
        registrationId: child.registrationId,
        checkedInAt: child.checkedInAt?.toISOString() ?? null,
      };
    });

    return { total: rows.length, rows };
  }
}
