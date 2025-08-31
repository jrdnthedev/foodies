import express from 'express';
import { createVendor, getAllVendors, getVendorById } from '../controllers/vendor-controller';

const router = express.Router();

router.get('/', getAllVendors);
router.get('/:id', getVendorById);
router.post('/', createVendor);
export default router;
