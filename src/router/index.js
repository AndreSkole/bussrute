import { createRouter, createWebHistory } from "vue-router";
import BusStopList from "../components/BusStopList.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: BusStopList,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
