import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CreateRegistrationWithChildrenDto } from './dto/create-registration-with-children.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('registrations')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('me')
  async getMyRegistration(
    @CurrentUser() user: User,
  ): Promise<RegistrationResponseDto | null> {
    return this.registrationsService.findOneByUserId(user.id);
  }

  @Post('with-children')
  @HttpCode(HttpStatus.CREATED)
  async createRegistrationWithChildren(
    @CurrentUser() user: User,
    @Body() dto: CreateRegistrationWithChildrenDto,
  ): Promise<RegistrationResponseDto> {
    return this.registrationsService.createWithChildren(user.id, dto);
  }

  @Patch('me/with-children')
  async updateRegistrationWithChildren(
    @CurrentUser() user: User,
    @Body() dto: CreateRegistrationWithChildrenDto,
  ): Promise<RegistrationResponseDto> {
    return this.registrationsService.updateWithChildren(user.id, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRegistration(
    @CurrentUser() user: User,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    return this.registrationsService.create(user.id, createRegistrationDto);
  }

  @Patch('me')
  async updateMyRegistration(
    @CurrentUser() user: User,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    return this.registrationsService.update(user.id, updateRegistrationDto);
  }

  @Post('me/submit')
  @HttpCode(HttpStatus.OK)
  async submitRegistration(
    @CurrentUser() user: User,
  ): Promise<RegistrationResponseDto> {
    return this.registrationsService.submitRegistration(user.id);
  }
}
