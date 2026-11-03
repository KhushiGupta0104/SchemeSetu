import { Router } from 'express';
import { asyncHandler as h } from '../utils/http.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiDailyLimiter, aiLimiter, authLimiter } from '../middleware/rateLimiters.js';
import * as V from '../validators/index.js';
import * as auth from '../controllers/authController.js';
import * as profile from '../controllers/profileController.js';
import * as schemes from '../controllers/schemeController.js';
import * as data from '../controllers/userDataController.js';
import * as ai from '../controllers/aiController.js';
import * as admin from '../controllers/adminController.js';

export const router = Router();

// ---- meta ----
router.get('/meta', h(schemes.meta));

// ---- auth ----
router.get('/auth/csrf', h(auth.csrf));
router.post('/auth/register', authLimiter, validate(V.registerSchema), h(auth.register));
router.post('/auth/login', authLimiter, validate(V.loginSchema), h(auth.login));
router.post('/auth/refresh', h(auth.refresh));
router.post('/auth/logout', h(auth.logout));
router.get('/auth/me', requireAuth, h(auth.me));
router.delete('/auth/account', requireAuth, validate(V.deleteAccountSchema), h(auth.deleteAccount));

// ---- profile ----
router.get('/profile', requireAuth, h(profile.getProfile));
router.put('/profile', requireAuth, validate(V.updateProfileSchema), h(profile.updateProfile));

// ---- schemes (public, personalised when logged in) ----
router.get('/schemes', optionalAuth, validate(V.schemeListQuery, 'query'), h(schemes.listSchemes));
router.get('/schemes/:id', optionalAuth, h(schemes.getScheme));
router.get('/schemes/:id/eligibility', requireAuth, h(schemes.getSchemeEligibility));
router.get('/recommendations', requireAuth, h(schemes.recommendations));
router.get('/deadlines', optionalAuth, h(schemes.deadlines));
router.get('/dashboard', requireAuth, h(schemes.dashboard));

// ---- saved ----
router.get('/saved', requireAuth, h(data.listSaved));
router.post('/saved', requireAuth, validate(V.saveSchemeSchema), h(data.saveScheme));
router.delete('/saved/:schemeId', requireAuth, validate(V.schemeIdParam, 'params'), h(data.unsaveScheme));

// ---- applications ----
router.get('/applications', requireAuth, h(data.listApplications));
router.post('/applications', requireAuth, validate(V.createApplicationSchema), h(data.createApplication));
router.get('/applications/:id', requireAuth, validate(V.idParam, 'params'), h(data.getApplication));
router.patch('/applications/:id', requireAuth, validate(V.idParam, 'params'), validate(V.updateApplicationSchema), h(data.updateApplication));
router.delete('/applications/:id', requireAuth, validate(V.idParam, 'params'), h(data.deleteApplication));

// ---- checklists ----
router.get('/checklists', requireAuth, h(data.listChecklists));
router.get('/checklists/:schemeId', requireAuth, validate(V.schemeIdParam, 'params'), h(data.getChecklist));
router.put('/checklists/:schemeId', requireAuth, validate(V.schemeIdParam, 'params'), validate(V.updateChecklistSchema), h(data.updateChecklist));

// ---- AI ----
router.get('/ai/status', h(ai.aiStatus));
router.post('/ai/explain', requireAuth, aiLimiter, aiDailyLimiter, validate(V.aiExplainSchema), h(ai.explain));

// ---- admin (server-side RBAC on every route) ----
const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.get('/stats', h(admin.stats));
adminRouter.get('/schemes', validate(V.adminSchemeListQuery, 'query'), h(admin.listAdminSchemes));
adminRouter.post('/schemes', validate(V.createSchemeSchema), h(admin.createScheme));
adminRouter.get('/schemes/:id', validate(V.idParam, 'params'), h(admin.getAdminScheme));
adminRouter.patch('/schemes/:id', validate(V.idParam, 'params'), validate(V.updateSchemeSchema), h(admin.updateScheme));
adminRouter.delete('/schemes/:id', validate(V.idParam, 'params'), h(admin.deleteScheme));
router.use('/admin', adminRouter);
