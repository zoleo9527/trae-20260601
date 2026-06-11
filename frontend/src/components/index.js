import { defineComponent, h } from 'vue'
import StatusTag from './StatusTag.vue'
export default defineComponent({
  name: 'ElStatusTag',
  props: ['status'],
  setup(props) {
    return () => h(StatusTag, { status: props.status })
  },
})
