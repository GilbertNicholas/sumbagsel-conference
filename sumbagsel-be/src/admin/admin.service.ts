import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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
import { OtpService } from '../otp/otp.service';
import { ParticipantResponseDto } from './dto/participant-response.dto';
import { ParticipantDetailResponseDto } from './dto/participant-detail-response.dto';
import { ArrivalScheduleFilterDto } from './dto/arrival-schedule-filter.dto';
import { ArrivalScheduleResponseDto, ArrivalScheduleSummaryDto, ArrivalScheduleGroupedDto } from './dto/arrival-schedule-response.dto';
import { RegistrationStatus } from '../entities/registration.entity';

const DEFAULT_ADMIN_PHONE = '087780271525';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private otpService: OtpService,
    @InjectRepository(Registration)
    private registrationsRepository: Repository<Registration>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(ArrivalSchedule)
    private arrivalSchedulesRepository: Repository<ArrivalSchedule>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { code: 'ADMIN123' },
      });
      if (admin && !admin.phoneNumber) {
        admin.phoneNumber = DEFAULT_ADMIN_PHONE;
        await this.adminRepository.save(admin);
        console.log('[AdminService] Admin phone number seeded: 087780271525');
      }
    } catch (e) {
      console.warn('[AdminService] Seed admin phone skipped:', (e as Error).message);
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    let normalized = phoneNumber.replace(/[\s-]/g, '');
    if (normalized.startsWith('+62')) {
      normalized = '0' + normalized.substring(3);
    }
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
    return normalized;
  }

  async requestOtp(phoneNumber: string): Promise<{ sent: boolean }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const admin = await this.adminRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });

    if (!admin) {
      throw new UnauthorizedException('Nomor tidak terdaftar sebagai admin');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Akun admin tidak aktif');
    }

    return this.otpService.create(phoneNumber);
  }

  /** Bypass OTP - direct login with phone. Only when OTP_BYPASS_DEV=true. */
  async loginWithPhone(phoneNumber: string): Promise<AdminAuthResponseDto> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const admin = await this.adminRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });

    if (!admin) {
      throw new UnauthorizedException('Nomor tidak terdaftar sebagai admin');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Akun admin tidak aktif');
    }

    const accessToken = this.generateToken(admin);
    return {
      accessToken,
      admin: {
        id: admin.id,
        code: admin.code,
        name: admin.name,
      },
    };
  }

  async verifyOtpAndLogin(phoneNumber: string, otp: string): Promise<AdminAuthResponseDto> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    await this.otpService.verify(phoneNumber, otp);

    const admin = await this.adminRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });

    if (!admin) {
      throw new UnauthorizedException('Nomor tidak terdaftar sebagai admin');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Akun admin tidak aktif');
    }

    const accessToken = this.generateToken(admin);
    return {
      accessToken,
      admin: {
        id: admin.id,
        code: admin.code,
        name: admin.name,
      },
    };
  }

  async login(loginDto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    const { code } = loginDto;

    // Find admin by code
    const admin = await this.adminRepository.findOne({
      where: { code },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid admin code');
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is not active');
    }

    // Generate JWT token
    const accessToken = this.generateToken(admin);

    return {
      accessToken,
      admin: {
        id: admin.id,
        code: admin.code,
        name: admin.name,
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
        phoneNumber: profile?.phoneNumber || null,
        email: user.email || '-',
        status: registration?.status ?? 'Belum terdaftar',
        paymentProofUrl: registration?.paymentProofUrl ?? null,
        checkedInAt: registration?.checkedInAt?.toISOString() ?? null,
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
      }));

      return {
        id: registration.id,
        userId: registration.userId,
        fullName: profile?.fullName || '-',
        churchName: profile?.churchName || '-',
        ministry: profile?.ministry || null,
        phoneNumber: profile?.phoneNumber || null,
        email: registration.user?.email || '-',
        specialNotes: profile?.specialNotes || null,
        status: registration.status,
        paymentProofUrl: registration.paymentProofUrl,
        children,
        baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
        totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
        uniqueCode: registration.uniqueCode,
        checkedInAt: registration.checkedInAt?.toISOString() ?? null,
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
      phoneNumber: profile.phoneNumber || null,
      email: user.email || '-',
      specialNotes: profile.specialNotes || null,
      status: 'Belum terdaftar',
      paymentProofUrl: null,
      children: [],
      baseAmount: null,
      totalAmount: null,
      uniqueCode: null,
      checkedInAt: null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async approveRegistration(registrationId: string): Promise<ParticipantDetailResponseDto> {
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

    registration.status = RegistrationStatus.TERDAFTAR;
    await this.registrationsRepository.save(registration);

    const profile = registration.user?.profile;
    const children = (registration.children || []).map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
    }));

    return {
      id: registration.id,
      userId: registration.userId,
      fullName: profile?.fullName || '-',
      churchName: profile?.churchName || '-',
      ministry: profile?.ministry || null,
      phoneNumber: profile?.phoneNumber || null,
      email: registration.user?.email || '-',
      specialNotes: profile?.specialNotes || null,
      status: registration.status,
      paymentProofUrl: registration.paymentProofUrl,
      children,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      uniqueCode: registration.uniqueCode,
      checkedInAt: registration.checkedInAt?.toISOString() ?? null,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
  }

  async rejectRegistration(registrationId: string): Promise<ParticipantDetailResponseDto> {
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
    await this.registrationsRepository.save(registration);

    const profile = registration.user?.profile;
    const children = (registration.children || []).map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
    }));

    return {
      id: registration.id,
      userId: registration.userId,
      fullName: profile?.fullName || '-',
      churchName: profile?.churchName || '-',
      ministry: profile?.ministry || null,
      phoneNumber: profile?.phoneNumber || null,
      email: registration.user?.email || '-',
      specialNotes: profile?.specialNotes || null,
      status: registration.status,
      paymentProofUrl: registration.paymentProofUrl,
      children,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      uniqueCode: registration.uniqueCode,
      checkedInAt: registration.checkedInAt?.toISOString() ?? null,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
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
    }));

    return {
      id: registration.id,
      userId: registration.userId,
      fullName: profile?.fullName || '-',
      churchName: profile?.churchName || '-',
      ministry: profile?.ministry || null,
      phoneNumber: profile?.phoneNumber || null,
      email: registration.user?.email || '-',
      specialNotes: profile?.specialNotes || null,
      status: registration.status,
      paymentProofUrl: registration.paymentProofUrl,
      children,
      baseAmount: registration.baseAmount != null ? Number(registration.baseAmount) : null,
      totalAmount: registration.totalAmount != null ? Number(registration.totalAmount) : null,
      uniqueCode: registration.uniqueCode,
      checkedInAt: registration.checkedInAt.toISOString(),
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
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
          '(LOWER(profile.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.phoneNumber) LIKE LOWER(:search))',
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
          email: arrival.user?.email || '-',
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
            '(LOWER(profile.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.phoneNumber) LIKE LOWER(:search))',
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
    const payload = { sub: admin.id, code: admin.code, role: 'admin' };
    return this.jwtService.sign(payload);
  }
}
