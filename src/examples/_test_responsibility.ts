import { createApiRouter } from '../mock/handlers';
import { ServiceFactory } from '../mock/serviceFactory';

ServiceFactory.reset();
const router = createApiRouter();

const orderRes = router.invoke({ method: 'GET', path: '/api/orders/ORD-002' });
const order = orderRes.data as any;
console.log('=== ORD-002 Responsibility ===');
console.log('status:', order.status);
console.log('stage:', order.responsibility.stage);
console.log('currentRole:', order.responsibility.currentRole);
console.log('currentUserId:', order.responsibility.currentUserId);
console.log('currentUserName:', order.responsibility.currentUserName);
console.log('previousNode:', order.responsibility.previousNode);
console.log('nextAction:', order.responsibility.nextAction);

const todosRes = router.invoke({ method: 'GET', path: '/api/users/U-003/todos' });
const todos = todosRes.data as any[];
console.log('\n=== U-003 (Measurer) Todos ===');
todos.forEach(t => {
  console.log('-', t.title);
  console.log('  responsibility.stage:', t.responsibility.stage);
  console.log('  responsibility.currentRole:', t.responsibility.currentRole);
  console.log('  responsibility.nextAction:', t.responsibility.nextAction);
});

const todosRes2 = router.invoke({ method: 'GET', path: '/api/users/U-004/todos' });
const todos2 = todosRes2.data as any[];
console.log('\n=== U-004 (Installer) Todos ===');
todos2.forEach(t => {
  console.log('-', t.title);
  console.log('  responsibility.stage:', t.responsibility.stage);
  console.log('  responsibility.currentUserName:', t.responsibility.currentUserName);
  console.log('  responsibility.previousNode:', t.responsibility.previousNode);
});
