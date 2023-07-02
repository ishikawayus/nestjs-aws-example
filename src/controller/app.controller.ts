import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('app')
export class AppController {
  @UseGuards(AuthGuard)
  @Get('hello')
  hello(): string {
    return 'Hello World!';
  }
}
