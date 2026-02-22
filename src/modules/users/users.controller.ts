import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ToggleUserEnabledDto } from './dto/toggle-user-enabled.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@ApiForbiddenResponse({ description: 'Insufficient permissions (ADMIN required)' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) { }

    /* ───────── POST /users ───────── */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create user (Supabase Auth + Profile)' })
    @ApiCreatedResponse({ description: 'User created', type: UserResponseDto })
    @ApiBadRequestResponse({ description: 'Validation error' })
    @ApiConflictResponse({ description: 'Email already exists' })
    create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
        return this.users.create(dto);
    }

    /* ───────── GET /users ───────── */
    @Get()
    @ApiOperation({ summary: 'List users (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20, max 100)' })
    @ApiQuery({ name: 'q', required: false, description: 'Search by email (contains, case-insensitive)' })
    @ApiOkResponse({ description: 'Paginated list of users', type: UserResponseDto, isArray: true })
    findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('q') q?: string,
    ) {
        return this.users.findAll(page ?? 1, limit ?? 20, q);
    }

    /* ───────── GET /users/:id ───────── */
    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'Profile UUID' })
    @ApiOkResponse({ description: 'User found', type: UserResponseDto })
    findOne(@Param('id') id: string): Promise<UserResponseDto> {
        return this.users.findOne(id);
    }

    /* ───────── PATCH /users/:id/role ───────── */
    @Patch(':id/role')
    @ApiOperation({ summary: 'Update user role' })
    @ApiParam({ name: 'id', description: 'Profile UUID' })
    @ApiOkResponse({ description: 'Role updated', type: UserResponseDto })
    @ApiBadRequestResponse({ description: 'Validation error' })
    updateRole(
        @Param('id') id: string,
        @Body() dto: UpdateUserRoleDto,
    ): Promise<UserResponseDto> {
        return this.users.updateRole(id, dto.role);
    }

    /* ───────── PATCH /users/:id/enabled ───────── */
    @Patch(':id/enabled')
    @ApiOperation({ summary: 'Enable or disable user' })
    @ApiParam({ name: 'id', description: 'Profile UUID' })
    @ApiOkResponse({ description: 'Enabled status updated', type: UserResponseDto })
    @ApiBadRequestResponse({ description: 'Validation error' })
    toggleEnabled(
        @Param('id') id: string,
        @Body() dto: ToggleUserEnabledDto,
    ): Promise<UserResponseDto> {
        return this.users.toggleEnabled(id, dto.enabled);
    }
}
