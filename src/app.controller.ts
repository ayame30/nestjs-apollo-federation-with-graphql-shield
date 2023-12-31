import { Controller, Get } from '@nestjs/common';

@Controller('health-check')
export class AppController {
  @Get()
  getHealth(): any {
    return { status: 'ok' };
  }
}
