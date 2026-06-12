import { Project, User, TodoItem } from '../types';
import { mockProjects as initialProjects, mockUsers, mockTodos as initialTodos } from '../data/mockData';

const PROJECTS_KEY = 'bidding_system_projects';
const CURRENT_USER_KEY = 'bidding_system_current_user';

export const storage = {
  getProjects: (): Project[] => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return initialProjects;
      }
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(initialProjects));
    return initialProjects;
  },

  setProjects: (projects: Project[]) => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  resetToInitialData: () => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(initialProjects));
    localStorage.removeItem(CURRENT_USER_KEY);
  },
};

export const getInitialTodos = (projects: Project[], currentUser: User | null): TodoItem[] => {
  if (!currentUser) return [];

  const todos: TodoItem[] = [];

  projects.forEach(project => {
    const assignee = currentUser.role === 'project_manager' ? '项目专员' :
                    currentUser.role === 'review_secretary' ? '评审秘书' : '财务';

    if (project.status === 'notice_pending' && currentUser.role === 'review_secretary') {
      todos.push({
        id: `t_notice_${project.id}`,
        title: '审核中标通知',
        project_id: project.id,
        project_name: project.name,
        type: 'notice',
        assignee: '评审秘书',
        priority: 'high',
      });
    }

    if (project.status === 'notice_rejected' && currentUser.role === 'project_manager') {
      todos.push({
        id: `t_notice_reject_${project.id}`,
        title: '补录中标通知信息',
        project_id: project.id,
        project_name: project.name,
        type: 'notice',
        assignee: '项目专员',
        priority: 'high',
      });
    }

    if (project.status === 'refund_pending' && currentUser.role === 'finance') {
      todos.push({
        id: `t_refund_${project.id}`,
        title: '审核退款申请',
        project_id: project.id,
        project_name: project.name,
        type: 'refund',
        assignee: '财务',
        priority: 'medium',
      });
    }

    if (project.status === 'refund_rejected' && currentUser.role === 'project_manager') {
      todos.push({
        id: `t_refund_reject_${project.id}`,
        title: '补充退款申请材料',
        project_id: project.id,
        project_name: project.name,
        type: 'refund',
        assignee: '项目专员',
        priority: 'medium',
      });
    }

    if (project.status === 'refund_approved' && currentUser.role === 'finance') {
      todos.push({
        id: `t_pay_${project.id}`,
        title: '执行打款',
        project_id: project.id,
        project_name: project.name,
        type: 'refund',
        assignee: '财务',
        priority: 'high',
      });
    }
  });

  return todos;
};

export { mockUsers };
