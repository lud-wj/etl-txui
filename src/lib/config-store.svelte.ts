import { writable } from "svelte/store";
let transform = $state([]);
export default {
  get transform() {
    return transform;
  },
  updateTransform(f: Function) {
    transform = f(transform);
  },
};
