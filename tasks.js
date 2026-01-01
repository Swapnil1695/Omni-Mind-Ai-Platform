const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', tasksController.getTasks);
router.get('/upcoming', tasksController.getUpcomingTasks);
router.get('/:id', tasksController.getTask);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.patch('/:id/complete', tasksController.completeTask);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;