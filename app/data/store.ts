import type {
  Review,
  ParentFeedback,
  FollowUpRecord,
  TodoItem,
  ReviewSectionAnswer,
} from "~/types";
import {
  mockReviews,
  mockFeedbacks,
  mockFollowUps,
  mockTodos,
  mockStudents,
  mockTemplates,
  mockUsers,
} from "~/data/mockData";

let reviewsStore: Review[] = [...mockReviews];
let feedbacksStore: ParentFeedback[] = [...mockFeedbacks];
let followUpsStore: FollowUpRecord[] = [...mockFollowUps];
let todosStore: TodoItem[] = [...mockTodos];

export function getAllReviews() {
  return [...reviewsStore];
}

export function getReviewById(id: string) {
  return reviewsStore.find((r) => r.id === id);
}

export function createReview(data: {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  templateId: string;
  templateName: string;
  classDate: string;
  classTime: string;
  artworkImageUrls: string[];
  highlights: string;
  improvements: string;
  observation: string;
  nextPractice: string;
  answers: ReviewSectionAnswer[];
}) {
  const newReview: Review = {
    id: `r${Date.now()}`,
    ...data,
    artworkImages: data.artworkImageUrls.map((url, i) => ({
      id: `img${Date.now()}-${i}`,
      url,
      isPlaceholder: !url || url.includes("placeholder"),
    })),
    feedbackStatus: "parent_unread",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  reviewsStore.unshift(newReview);
  return newReview;
}

export function updateReviewStatus(reviewId: string, status: Review["feedbackStatus"]) {
  const index = reviewsStore.findIndex((r) => r.id === reviewId);
  if (index !== -1) {
    reviewsStore[index] = {
      ...reviewsStore[index],
      feedbackStatus: status,
      updatedAt: new Date().toISOString(),
    };
    return reviewsStore[index];
  }
  return null;
}

export function getAllFeedbacks() {
  return [...feedbacksStore];
}

export function getFeedbackById(id: string) {
  return feedbacksStore.find((f) => f.id === id);
}

export function getFeedbacksByReviewId(reviewId: string) {
  return feedbacksStore.filter((f) => f.reviewId === reviewId);
}

export function updateFeedbackHasTodo(feedbackId: string, todoId: string) {
  const index = feedbacksStore.findIndex((f) => f.id === feedbackId);
  if (index !== -1) {
    feedbacksStore[index] = {
      ...feedbacksStore[index],
      hasTodo: true,
      todoId,
    };
    return feedbacksStore[index];
  }
  return null;
}

export function getAllFollowUps() {
  return [...followUpsStore];
}

export function getFollowUpsByReviewId(reviewId: string) {
  return followUpsStore.filter((f) => f.reviewId === reviewId);
}

export function createFollowUp(data: {
  reviewId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: "teacher" | "consultant" | "director";
  content: string;
}) {
  const newFollowUp: FollowUpRecord = {
    id: `fu${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  followUpsStore.unshift(newFollowUp);
  return newFollowUp;
}

export function getAllTodos() {
  return [...todosStore];
}

export function getTodoById(id: string) {
  return todosStore.find((t) => t.id === id);
}

export function getTodosByReviewId(reviewId: string) {
  return todosStore.filter((t) => t.reviewId === reviewId);
}

export function createTodo(data: {
  title: string;
  description: string;
  type: TodoItem["type"];
  reviewId: string;
  studentName: string;
  parentName: string;
  feedbackId: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
}) {
  const newTodo: TodoItem = {
    id: `todo${Date.now()}`,
    ...data,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  todosStore.unshift(newTodo);

  if (data.feedbackId) {
    updateFeedbackHasTodo(data.feedbackId, newTodo.id);
  }

  return newTodo;
}

export function updateTodoStatus(todoId: string, status: TodoItem["status"]) {
  const index = todosStore.findIndex((t) => t.id === todoId);
  if (index !== -1) {
    todosStore[index] = {
      ...todosStore[index],
      status,
    };
    return todosStore[index];
  }
  return null;
}

export function getStudents() {
  return [...mockStudents];
}

export function getStudentById(id: string) {
  return mockStudents.find((s) => s.id === id);
}

export function getTemplates() {
  return [...mockTemplates];
}

export function getTemplateById(id: string) {
  return mockTemplates.find((t) => t.id === id);
}

export function getUsers() {
  return [...mockUsers];
}
