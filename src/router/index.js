import { createRouter, createWebHistory } from 'vue-router';
import BusStopList from '../components/BusStopList.vue';
import BusStopDetails from '../components/BusStopDetails.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: BusStopList,
  },
  {
    path: '/stop/:id',
    name: 'BusStopDetails',
    component: BusStopDetails,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
