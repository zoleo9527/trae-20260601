export function formatDate(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const hours = String(d.getHours()).padStart(2, '0');
	const minutes = String(d.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDateOnly(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

const statusTextMap: Record<string, string> = {
	pending: '待审核',
	confirmed: '已确认',
	rejected: '已拒绝',
	scheduled: '已排课',
	completed: '已完成',
	cancelled: '已取消'
};

export function getStatusText(status: string): string {
	return statusTextMap[status] || status;
}

const statusColorMap: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-green-100 text-green-800',
	rejected: 'bg-red-100 text-red-800',
	scheduled: 'bg-blue-100 text-blue-800',
	completed: 'bg-emerald-100 text-emerald-800',
	cancelled: 'bg-gray-100 text-gray-800'
};

export function getStatusColor(status: string): string {
	return statusColorMap[status] || 'bg-gray-100 text-gray-800';
}

const roleTextMap: Record<string, string> = {
	consultant: '课程顾问',
	teacher: '教师',
	admin: '管理员'
};

export function getRoleText(role: string): string {
	return roleTextMap[role] || role;
}

const roleIconMap: Record<string, string> = {
	consultant: 'user-tie',
	teacher: 'chalkboard-teacher',
	admin: 'shield-alt'
};

export function getRoleIcon(role: string): string {
	return roleIconMap[role] || 'user';
}
