import { Router } from 'express';
import { AuditController } from '@/controllers/audit.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { auditLogQuerySchema } from '@/validators/audit.validator';
import { idParamSchema } from '@/validators/common.validator';

import { asyncHandler } from '@/utils/asyncHandler';

export const auditRouter = Router();

// All audit log routes require authentication and audit reading permission
auditRouter.use(asyncHandler(authenticate));
auditRouter.use(authorize('audit.read'));

auditRouter.get(
  '/',
  validateRequest(auditLogQuerySchema, 'query'),
  AuditController.list
);

auditRouter.get(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  AuditController.getById
);
