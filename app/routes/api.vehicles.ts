import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getAllVehicles, filterVehicles, getUsersByRole, getTotalCostByVehicleId, getTasksByVehicleId } from '~/utils/db.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const roleFilter = url.searchParams.get('role') || undefined;
  const managerId = url.searchParams.get('managerId') || undefined;

  const vehicles = await filterVehicles({
    search,
    status,
    currentAssigneeRole: roleFilter,
    managerId
  });

  const allManagers = await getUsersByRole('manager');
  const allAssessors = await getUsersByRole('assessor');
  const allFinance = await getUsersByRole('finance');

  const vehiclesWithDetails = await Promise.all(
    vehicles.map(async (v) => {
      const tasks = await getTasksByVehicleId(v.id);
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalCost = await getTotalCostByVehicleId(v.id);
      return {
        ...v,
        taskCount: tasks.length,
        completedTasks,
        totalCost
      };
    })
  );

  return json({
    vehicles: vehiclesWithDetails,
    managers: allManagers,
    assessors: allAssessors,
    finance: allFinance
  });
}