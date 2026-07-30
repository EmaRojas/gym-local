import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '../stores/admin'
import { useStudentStore } from '../stores/student'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/admin/AdminView.vue')
  },
  {
    path: '/student',
    name: 'Student',
    component: () => import('../views/student/StudentView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  if (to.name === 'Admin') {
    const admin = useAdminStore()
    const student = useStudentStore()
    if (!admin.isLoggedIn) {
      await admin.restoreSession()
    }
    if (student.isLoggedIn && !admin.isLoggedIn) {
      return { name: 'Student' }
    }
  }

  if (to.name === 'Student') {
    const student = useStudentStore()
    const admin = useAdminStore()
    if (!student.isLoggedIn) {
      await student.restoreSession()
    }
    if (admin.isLoggedIn && !student.isLoggedIn) {
      return { name: 'Admin' }
    }
  }
})

export default router
