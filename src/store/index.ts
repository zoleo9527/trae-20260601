import { ref, reactive } from 'vue';
import { api } from '../api';
import type { RoleType, TodoList, BookingRecord, BookingFilter, Court, Coach, MemberCard } from '../types';

interface AppState {
  currentRole: RoleType;
  courts: Court[];
  coaches: Coach[];
  members: MemberCard[];
}

const state = reactive<AppState>({
  currentRole: 'reception',
  courts: [],
  coaches: [],
  members: [],
});

const todos = ref<TodoList | null>(null);
const bookings = ref<BookingRecord[]>([]);
const verificationHistory = ref<BookingRecord[]>([]);

const todosLoading = ref(false);
const bookingsLoading = ref(false);
const historyLoading = ref(false);
const baseDataLoading = ref(false);

let lastFilter: BookingFilter | null = null;

export const useStore = () => {
  const setRole = (role: RoleType) => {
    state.currentRole = role;
    loadTodos();
  };

  const loadBaseData = async () => {
    baseDataLoading.value = true;
    try {
      const [courts, coaches, members] = await Promise.all([
        api.getCourts(),
        api.getCoaches(),
        api.getMembers(),
      ]);
      state.courts = courts;
      state.coaches = coaches;
      state.members = members;
    } finally {
      baseDataLoading.value = false;
    }
  };

  const loadMembers = async () => {
    state.members = await api.getMembers();
  };

  const getMemberById = (memberId: number): MemberCard | undefined => {
    return state.members.find(m => m.id === memberId);
  };

  const getMemberByCardNo = (cardNo: string): MemberCard | undefined => {
    return state.members.find(m => m.card_no === cardNo);
  };

  const loadTodos = async () => {
    todosLoading.value = true;
    try {
      todos.value = await api.getTodos(state.currentRole);
    } finally {
      todosLoading.value = false;
    }
  };

  const loadBookings = async (filter?: BookingFilter) => {
    if (filter) {
      lastFilter = filter;
    }
    bookingsLoading.value = true;
    try {
      const f = filter || lastFilter || {};
      bookings.value = await api.getBookings(f);
    } finally {
      bookingsLoading.value = false;
    }
  };

  const loadVerificationHistory = async () => {
    historyLoading.value = true;
    try {
      verificationHistory.value = await api.getVerificationHistory();
    } finally {
      historyLoading.value = false;
    }
  };

  const refreshAll = async () => {
    await loadBaseData();
    await Promise.all([
      loadTodos(),
      loadBookings(),
      loadVerificationHistory(),
    ]);
  };

  return {
    state,
    todos,
    bookings,
    verificationHistory,
    todosLoading,
    bookingsLoading,
    historyLoading,
    baseDataLoading,
    setRole,
    loadBaseData,
    loadMembers,
    getMemberById,
    getMemberByCardNo,
    loadTodos,
    loadBookings,
    loadVerificationHistory,
    refreshAll,
  };
};
