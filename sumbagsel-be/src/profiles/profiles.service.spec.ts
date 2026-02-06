import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let profileRepository: Repository<Profile>;
  let userRepository: Repository<User>;

  const mockProfileRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    profileRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOneByUserId', () => {
    it('should return profile if found', async () => {
      const userId = 'user-id';
      const mockProfile = {
        id: 'profile-id',
        userId,
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: 'test@example.com',
        photoUrl: null,
        isCompleted: true,
      };

      mockProfileRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.findOneByUserId(userId);

      expect(result).toEqual({
        id: 'profile-id',
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: 'test@example.com',
        photoUrl: null,
        isCompleted: true,
      });
      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return null if profile not found', async () => {
      const userId = 'user-id';
      mockProfileRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
    };

    const createDto: CreateProfileDto = {
      fullName: 'Test User',
      churchName: 'Test Church',
    };

    it('should create profile successfully', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockSavedProfile = {
        id: 'profile-id',
        userId,
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: 'user@example.com',
        photoUrl: null,
        isCompleted: true,
        completedAt: new Date(),
      };

      mockProfileRepository.create.mockReturnValue(mockSavedProfile);
      mockProfileRepository.save.mockResolvedValue(mockSavedProfile);

      const result = await service.create(userId, createDto);

      expect(result).toEqual({
        id: 'profile-id',
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: 'user@example.com',
        photoUrl: null,
        isCompleted: true,
      });
      expect(mockProfileRepository.create).toHaveBeenCalled();
      expect(mockProfileRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockProfileRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should set isCompleted to true when fullName and churchName are provided', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockSavedProfile = {
        id: 'profile-id',
        userId,
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: 'user@example.com',
        photoUrl: null,
        isCompleted: true,
        completedAt: new Date(),
      };

      mockProfileRepository.create.mockReturnValue(mockSavedProfile);
      mockProfileRepository.save.mockResolvedValue(mockSavedProfile);

      await service.create(userId, createDto);

      expect(mockProfileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompleted: true,
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should use user email as default contactEmail if not provided', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockSavedProfile = {
        id: 'profile-id',
        userId,
        fullName: 'Test User',
        churchName: 'Test Church',
        contactEmail: 'user@example.com',
        photoUrl: null,
        isCompleted: true,
      };

      mockProfileRepository.create.mockReturnValue(mockSavedProfile);
      mockProfileRepository.save.mockResolvedValue(mockSavedProfile);

      await service.create(userId, {
        fullName: 'Test User',
        churchName: 'Test Church',
      });

      expect(mockProfileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactEmail: 'user@example.com',
        }),
      );
    });
  });

  describe('update', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
    };

    const existingProfile = {
      id: 'profile-id',
      userId,
      fullName: 'Old Name',
      churchName: 'Old Church',
      contactEmail: 'old@example.com',
      photoUrl: null,
      isCompleted: false,
      completedAt: null,
    };

    it('should update profile successfully', async () => {
      mockProfileRepository.findOne.mockResolvedValue(existingProfile);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const updateDto: UpdateProfileDto = {
        fullName: 'New Name',
        churchName: 'New Church',
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
        isCompleted: true,
        completedAt: new Date(),
      };

      mockProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.update(userId, updateDto);

      expect(result.fullName).toBe('New Name');
      expect(result.churchName).toBe('New Church');
      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, { fullName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should auto-calculate isCompleted based on fullName and churchName', async () => {
      mockProfileRepository.findOne.mockResolvedValue(existingProfile);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const updateDto: UpdateProfileDto = {
        fullName: 'New Name',
        churchName: 'New Church',
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
        isCompleted: true,
        completedAt: new Date(),
      };

      mockProfileRepository.save.mockResolvedValue(updatedProfile);

      await service.update(userId, updateDto);

      expect(mockProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompleted: true,
          completedAt: expect.any(Date),
        }),
      );
    });
  });
});

