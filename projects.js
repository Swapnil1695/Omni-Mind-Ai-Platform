const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', projectsController.getProjects);
router.get('/stats', projectsController.getProjectStats);
router.get('/:id', projectsController.getProject);
router.post('/', projectsController.createProject);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

module.exports = router;