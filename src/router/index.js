import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventView from '../views/EventView.vue'
import SummitView from '../views/SummitView.vue'
import ContentDevView from '../views/ContentDevView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/event/:id', name: 'event', component: EventView },
    { path: '/summit', name: 'summit', component: SummitView },
    { path: '/dev/content', name: 'content-dev', component: ContentDevView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
