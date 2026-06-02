import { Router } from 'express';
import * as routesController from '../controllers/routesController';
import * as stopsController from '../controllers/stopsController';
import * as vehiclesController from '../controllers/vehiclesController';
import * as driversController from '../controllers/driversController';
import * as studentsController from '../controllers/studentsController';
import * as schedulesController from '../controllers/schedulesController';
import * as checkInsController from '../controllers/checkInsController';
import * as rideRecordsController from '../controllers/rideRecordsController';
import * as lateEventsController from '../controllers/lateEventsController';
import * as complaintsController from '../controllers/complaintsController';
import * as queriesController from '../controllers/queriesController';

const router = Router();

router.get('/routes', routesController.getAllRoutes);
router.get('/routes/:id', routesController.getRouteById);
router.post('/routes', routesController.createRoute);
router.put('/routes/:id', routesController.updateRoute);
router.delete('/routes/:id', routesController.deleteRoute);

router.get('/stops', stopsController.getAllStops);
router.get('/stops/:id', stopsController.getStopById);
router.post('/stops', stopsController.createStop);
router.put('/stops/:id', stopsController.updateStop);
router.delete('/stops/:id', stopsController.deleteStop);
router.post('/stops/bulk', stopsController.bulkUpdateStops);

router.get('/vehicles', vehiclesController.getAllVehicles);
router.get('/vehicles/:id', vehiclesController.getVehicleById);
router.post('/vehicles', vehiclesController.createVehicle);
router.put('/vehicles/:id', vehiclesController.updateVehicle);
router.delete('/vehicles/:id', vehiclesController.deleteVehicle);

router.get('/drivers', driversController.getAllDrivers);
router.get('/drivers/:id', driversController.getDriverById);
router.post('/drivers', driversController.createDriver);
router.put('/drivers/:id', driversController.updateDriver);
router.delete('/drivers/:id', driversController.deleteDriver);

router.get('/students', studentsController.getAllStudents);
router.get('/students/:id', studentsController.getStudentById);
router.post('/students', studentsController.createStudent);
router.put('/students/:id', studentsController.updateStudent);
router.delete('/students/:id', studentsController.deleteStudent);

router.get('/schedules', schedulesController.getAllSchedules);
router.get('/schedules/:id', schedulesController.getScheduleById);
router.post('/schedules', schedulesController.createSchedule);
router.put('/schedules/:id', schedulesController.updateSchedule);
router.delete('/schedules/:id', schedulesController.deleteSchedule);

router.get('/check-ins', checkInsController.getAllCheckIns);
router.get('/check-ins/:id', checkInsController.getCheckInById);
router.post('/check-ins', checkInsController.createCheckIn);
router.put('/check-ins/:id', checkInsController.updateCheckIn);
router.delete('/check-ins/:id', checkInsController.deleteCheckIn);

router.get('/ride-records', rideRecordsController.getAllRideRecords);
router.get('/ride-records/:id', rideRecordsController.getRideRecordById);
router.put('/ride-records/:id', rideRecordsController.updateRideRecord);
router.post('/ride-records/bulk', rideRecordsController.bulkUpdateRideRecords);

router.get('/late-events', lateEventsController.getAllLateEvents);
router.get('/late-events/:id', lateEventsController.getLateEventById);
router.post('/late-events', lateEventsController.createLateEvent);
router.put('/late-events/:id', lateEventsController.updateLateEvent);

router.get('/complaints', complaintsController.getAllComplaints);
router.get('/complaints/:id', complaintsController.getComplaintById);
router.post('/complaints', complaintsController.createComplaint);
router.put('/complaints/:id', complaintsController.updateComplaint);
router.post('/complaints/review', complaintsController.reviewComplaint);

router.get('/queries/route/:route_id/date/:date', queriesController.getRouteByDate);
router.get('/queries/student/:student_id/today', queriesController.getStudentRideStatus);
router.get('/queries/dashboard', queriesController.getDashboardStats);

export default router;
