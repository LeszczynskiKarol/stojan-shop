// backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  public login = this.catchError(async (req: Request, res: Response) => {
    try {
      // const { email, password, twoFactorCode } = req.body;
      const { email, password } = req.body;

      // const result = await this.service.login(email, password, twoFactorCode);
      const result = await this.service.login(email, password);

      // if (result.requires2FA) {
      //   return res.status(403).json(ApiResponse.error('2FA_REQUIRED'));
      // }

      const response = ApiResponse.success(result);

      return res.json(response);
    } catch (error: any) {
      console.error('Błąd podczas logowania:', error);
      return res.status(401).json(ApiResponse.error(error.message));
    }
  });

  public register = this.catchError(async (req: Request, res: Response) => {
    const user = await this.service.createUser(req.body);
    res.status(201).json(ApiResponse.success(user));
  });

  public logout = this.catchError(async (req: Request, res: Response) => {
    res.json(ApiResponse.success({ message: 'Wylogowano pomyślnie' }));
  });

  // public setupTwoFactor = this.catchError(
  //   async (req: Request, res: Response) => {
  //     const userId = req.user?.userId;
  //     if (!userId) {
  //       return res.status(401).json(ApiResponse.error('Brak autoryzacji'));
  //     }
  //     const result = await this.service.generateTwoFactorSecret(userId);
  //     res.json(ApiResponse.success(result));
  //   }
  // );

  // public verifyTwoFactor = this.catchError(
  //   async (req: Request, res: Response) => {
  //     const userId = req.user?.userId;
  //     if (!userId) {
  //       return res.status(401).json(ApiResponse.error('Brak autoryzacji'));
  //     }
  //     const { code } = req.body;
  //     const result = await this.service.verifyAndEnableTwoFactor(userId, code);
  //     res.json(ApiResponse.success(result));
  //   }
  // );

  private catchError(fn: (req: Request, res: Response) => Promise<any>) {
    return (req: Request, res: Response) => {
      Promise.resolve(fn.call(this, req, res)).catch((error) => {
        res.status(error.status || 500).json(ApiResponse.error(error.message));
      });
    };
  }

  // public disable2FA = this.catchError(async (req: Request, res: Response) => {
  //   const userId = req.user?.userId;
  //   if (!userId) {
  //     return res.status(401).json(ApiResponse.error('Brak autoryzacji'));
  //   }
  //   await this.service.disable2FA(userId);
  //   res.json(
  //     ApiResponse.success({ message: 'Wyłączono weryfikację dwuetapową' })
  //   );
  // });

  public getMe = this.catchError(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json(ApiResponse.error('Brak autoryzacji'));
    }

    const user = await this.service.getUser(userId);
    res.json(ApiResponse.success(user));
  });
}
