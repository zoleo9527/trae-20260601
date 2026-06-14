import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getVehicleById, getReportByVehicleId, getTasksByVehicleId, getEventsByVehicleId, getFinanceRecordsByVehicleId, getUserById, getCostBudgetByVehicleId, getTasksCostSummary, getOperationRecordsByVehicleId, getNextAvailableTransitions, updateVehicleStatus, createPreparationTask, updatePreparationTaskStatus, updatePreparationTaskCost, createFinanceRecord, updateFinanceRecordStatus, getNextAssigneeForStatus } from '~/utils/db.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    return json({ error: 'Vehicle ID required' }, { status: 400 });
  }

  const vehicle = await getVehicleById(id);
  if (!vehicle) {
    return json({ error: 'Vehicle not found' }, { status: 404 });
  }

  const report = await getReportByVehicleId(id);
  const tasks = await getTasksByVehicleId(id);
  const events = await getEventsByVehicleId(id);
  const financeRecords = await getFinanceRecordsByVehicleId(id);
  const costBudget = await getCostBudgetByVehicleId(id);
  const operationRecords = await getOperationRecordsByVehicleId(id);
  const costSummary = await getTasksCostSummary(id);

  const manager = await getUserById(vehicle.managerId);
  const assessor = vehicle.assessorId ? await getUserById(vehicle.assessorId) : null;
  const financeStaff = vehicle.financeId ? await getUserById(vehicle.financeId) : null;
  const currentAssignee = await getUserById(vehicle.currentAssigneeId);

  const availableTransitions = await getNextAvailableTransitions(vehicle.status);

  return json({
    vehicle,
    report,
    tasks,
    events,
    financeRecords,
    costBudget,
    operationRecords,
    costSummary,
    manager,
    assessor,
    financeStaff,
    currentAssignee,
    availableTransitions
  });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const id = params.id;
  if (!id) {
    return json({ error: 'Vehicle ID required' }, { status: 400 });
  }

  const body = await request.json();
  const { action: actionType, data } = body;

  try {
    switch (actionType) {
      case 'updateStatus': {
        const { newStatus, actorId, actorName, note } = data;
        
        const vehicle = await getVehicleById(id);
        if (!vehicle) {
          return json({ error: 'Vehicle not found' }, { status: 404 });
        }

        const nextAssignee = getNextAssigneeForStatus(newStatus, vehicle);
        
        const updatedVehicle = await updateVehicleStatus(
          id, 
          newStatus, 
          actorId, 
          actorName, 
          note,
          nextAssignee?.nextAssigneeId,
          nextAssignee?.nextAssigneeRole
        );
        return json({ success: true, vehicle: updatedVehicle });
      }

      case 'createTask': {
        const task = await createPreparationTask({
          vehicleId: id,
          ...data
        });
        return json({ success: true, task });
      }

      case 'updateTaskStatus': {
        const { taskId, newTaskStatus, actorId: taskActorId, actorName: taskActorName, note: taskNote } = data;
        const updatedTask = await updatePreparationTaskStatus(taskId, newTaskStatus, taskActorId, taskActorName, taskNote);
        return json({ success: true, task: updatedTask });
      }

      case 'updateTaskCost': {
        const { taskId: costTaskId, newCost, actorId: costActorId, actorName: costActorName, reason } = data;
        const updatedCostTask = await updatePreparationTaskCost(costTaskId, newCost, costActorId, costActorName, reason);
        return json({ success: true, task: updatedCostTask });
      }

      case 'createFinanceRecord': {
        const financeRecord = await createFinanceRecord({
          vehicleId: id,
          ...data
        });
        return json({ success: true, record: financeRecord });
      }

      case 'updateFinanceStatus': {
        const { recordId, newFinanceStatus, actorId: financeActorId, actorName: financeActorName, note: financeNote } = data;
        const updatedFinanceRecord = await updateFinanceRecordStatus(recordId, newFinanceStatus, financeActorId, financeActorName, financeNote);
        return json({ success: true, record: updatedFinanceRecord });
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Action error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}