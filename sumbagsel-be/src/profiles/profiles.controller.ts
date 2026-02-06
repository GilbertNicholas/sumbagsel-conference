import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(
    @CurrentUser() user: User,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.findOneByUserId(user.id);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @CurrentUser() user: User,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.create(user.id, createProfileDto);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.update(user.id, updateProfileDto);
  }
}

