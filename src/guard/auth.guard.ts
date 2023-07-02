import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const idTokens = request.headers['idtoken'];
    const idToken = Array.isArray(idTokens) ? idTokens[0] : idTokens;
    try {
      const payload = await this.authService.verify(idToken);
      console.log(`payload=${JSON.stringify(payload)}`);
      return true;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException();
    }
  }
}
