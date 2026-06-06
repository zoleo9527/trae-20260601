import { createRouter, createWebHistory } from "vue-router"
import { useUserStore } from "@/stores/user"

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresAuth: false }
  },
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", name: "Dashboard", component: () => import("@/views/Dashboard.vue") },
      { path: "keys", name: "Keys", component: () => import("@/views/Keys.vue") },
      { path: "keys/:id", name: "KeyDetail", component: () => import("@/views/KeyDetail.vue") },
      { path: "borrow", name: "Borrow", component: () => import("@/views/Borrow.vue") },
      { path: "lost", name: "Lost", component: () => import("@/views/Lost.vue") },
      { path: "settings", name: "Settings", component: () => import("@/views/Settings.vue") }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.user) {
    next("/login")
  } else if (to.path === "/login" && userStore.user) {
    next("/dashboard")
  } else {
    next()
  }
})

export default router
