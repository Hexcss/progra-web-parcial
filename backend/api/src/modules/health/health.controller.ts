// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        ts: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Get()
  ok() {
    return { ok: true, ts: new Date().toISOString() };
  }
}
