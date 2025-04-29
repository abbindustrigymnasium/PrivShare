import { createRouter, createWebHistory } from "vue-router";
import Home from "./components/Home.vue";
import FileDownloader from "./components/FileDownloader.vue";
import FileUploader from "./components/FileUploader.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/download", component: FileDownloader },
  { path: "/upload", component: FileUploader },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
