import express from 'express';
import {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  searchVendors,
} from '../controllers/vendor-controller';

const router = express.Router();

// GET /api/vendors - Get all vendors with pagination and filtering
router.get('/', getAllVendors);

// GET /api/vendors/search - Search vendors by name/type
router.get('/search', searchVendors);

// GET /api/vendors/:id - Get vendor by ID
router.get('/:id', getVendorById);

// POST /api/vendors - Create new vendor
router.post('/', createVendor);

// PUT /api/vendors/:id - Update vendor by ID
router.put('/:id', updateVendor);

// DELETE /api/vendors/:id - Delete vendor by ID
router.delete('/:id', deleteVendor);

export default router;
