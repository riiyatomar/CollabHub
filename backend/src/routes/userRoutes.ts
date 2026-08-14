import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/userValidator';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate); // All user routes are protected

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/me', asyncHandler(userController.getMe.bind(userController)));

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', validate(updateProfileSchema), asyncHandler(userController.updateProfile.bind(userController)));

/**
 * @swagger
 * /api/v1/users/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/password', validate(changePasswordSchema), asyncHandler(userController.changePassword.bind(userController)));

/**
 * @swagger
 * /api/v1/users/account:
 *   delete:
 *     summary: Soft delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete('/account', asyncHandler(userController.deleteAccount.bind(userController)));

/**
 * @swagger
 * /api/v1/users/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar uploaded
 */
router.post('/avatar', uploadMiddleware.single('avatar'), asyncHandler(userController.uploadAvatar.bind(userController)));

/**
 * @swagger
 * /api/v1/users/avatar:
 *   delete:
 *     summary: Remove user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed
 */
router.delete('/avatar', asyncHandler(userController.removeAvatar.bind(userController)));

export default router;
