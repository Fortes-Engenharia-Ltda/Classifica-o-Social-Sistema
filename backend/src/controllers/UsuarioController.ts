import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { UsuarioService } from '../services/UsuarioService';
import { successResponse, errorResponse } from '../utils/response';

const usuarioService = new UsuarioService();

export class UsuarioController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await usuarioService.create(req.body);
      res.status(201).json(successResponse('Usuário criado com sucesso', usuario));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await usuarioService.login(req.body);
      res.status(200).json(successResponse('Login realizado com sucesso', result));
    } catch (error: any) {
      res.status(401).json(errorResponse(error.message));
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      await usuarioService.forgotPassword(req.body);
      res
        .status(200)
        .json(successResponse('Se o email estiver cadastrado, enviaremos um código de redefinição'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      await usuarioService.resetPassword(req.body);
      res.status(200).json(successResponse('Senha redefinida com sucesso'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await usuarioService.findById(parseInt(req.params.id));
      if (!usuario) {
        res.status(404).json(errorResponse('Usuário não encontrado'));
        return;
      }
      res.status(200).json(successResponse('Usuário encontrado', usuario));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await usuarioService.findAll(page, pageSize);
      res.status(200).json(
        successResponse('Usuários listados com sucesso', {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        }),
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const usuario = await usuarioService.update(parseInt(req.params.id), req.body);
      res.status(200).json(successResponse('Usuário atualizado com sucesso', usuario));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      await usuarioService.updatePasswordById(parseInt(req.params.id), String(req.body?.senha || ''));
      res.status(200).json(successResponse('Senha alterada com sucesso'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Usuário não autenticado'));
        return;
      }

      const usuario = await usuarioService.updateOwnProfile(req.user.id, req.user.perfil, {
        nome: req.body?.nome,
        email: req.body?.email,
      });

      res.status(200).json(successResponse('Perfil atualizado com sucesso', usuario));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async updateMyPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Usuário não autenticado'));
        return;
      }

      await usuarioService.updateOwnPassword(req.user.id, String(req.body?.senha || ''));
      res.status(200).json(successResponse('Senha alterada com sucesso'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await usuarioService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async profile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Usuário não autenticado'));
        return;
      }

      const usuario = await usuarioService.findById(req.user.id);
      res.status(200).json(successResponse('Perfil obtido com sucesso', usuario));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
}
