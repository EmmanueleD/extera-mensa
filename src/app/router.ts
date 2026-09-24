import { createRouter, createWebHistory } from 'vue-router'
import StatisticsPage from '../pages/StatisticsPage.vue'
import TodayPage from '../pages/TodayPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/today' },
    { path: '/today', component: TodayPage },
    { path: '/statistics', component: StatisticsPage },
  ],
})
