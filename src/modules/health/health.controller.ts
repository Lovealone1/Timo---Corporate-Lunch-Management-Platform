import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiServiceUnavailableResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly health: HealthService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Basic health check' })
    @ApiOkResponse({ description: 'Service is healthy' })
    check() {
        return this.health.check();
    }

    @Get('db')
    @ApiOperation({ summary: 'Database connectivity check' })
    @ApiOkResponse({ description: 'Database is reachable' })
    @ApiServiceUnavailableResponse({ description: 'Database is unreachable' })
    async checkDb(@Res() res: Response) {
        const result = await this.health.checkDb();
        const status =
            result.status === 'ok'
                ? HttpStatus.OK
                : HttpStatus.SERVICE_UNAVAILABLE;
        return res.status(status).json(result);
    }

    @Get('version')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Application version and commit hash' })
    @ApiOkResponse({ description: 'Version info returned' })
    getVersion() {
        return this.health.getVersion();
    }
}
