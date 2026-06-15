import { ref, computed } from 'vue';
import type { User, Role } from '~/data/types';
import { mockUsers } from '~/data/mockData';
const currentUser = ref<User | null>(null);
export function useAuth() {
 const isLoggedIn = computed(() => !!currentUser.value);
 const currentRole = computed<Role | null>(() => currentUser.value?.role || null);
 const roleName = computed(() => {
 const names: Record<Role, string> = {
 dispatcher: '调度员',
 team_leader: '搬运组长',
 customer_service: '客服'
 };
 return names[currentUser.value?.role || 'dispatcher'] || '';
 });
 const login = (userId: string) => {
 const user = mockUsers.find(u => u.id === userId);
 if (user) {
 currentUser.value = user;
 }
 };
 const logout = () => {
 currentUser.value = null;
 };
 const switchRole = (role: Role) => {
 if (currentUser.value) {
 const user = mockUsers.find(u => u.role === role);
 if (user) {
 currentUser.value = user;
 }
 }
 };
 const getAvailableRoles = () => {
 return mockUsers.map(u => ({
 id: u.id,
 name: u.name,
 role: u.role,
 roleName: {
 dispatcher: '调度员',
 team_leader: '搬运组长',
 customer_service: '客服'
 }[u.role]
 }));
 };
 return {
 currentUser,
 isLoggedIn,
 currentRole,
 roleName,
 login,
 logout,
 switchRole,
 getAvailableRoles
 };
}

