import { BadRequestException, Controller, Get, Query, Redirect } from '@nestjs/common';
import { AuthService } from '../service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  @Redirect()
  login() {
    const authorizationUrl = this.authService.authorizationUrl({ abc: 'あいうえお' });
    return { url: authorizationUrl };
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const tokenSet = await this.authService.callback(code);
    return {
      ...tokenSet,
      state: this.authService.parseState(state),
    };
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    if (refreshToken == null) {
      throw new BadRequestException(`refreshToken is null`);
    }
    const tokenSet = await this.authService.refresh(refreshToken);
    return tokenSet;
  }
}
