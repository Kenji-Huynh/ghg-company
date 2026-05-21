import { mount } from 'svelte'
import 'sweetalert2/dist/sweetalert2.min.css'
import './app.css'
import App from './App.svelte'
import { runScheduledSnapshots } from './lib/snapshots.js'

try {
  runScheduledSnapshots()
} catch {
  /* ignore */
}

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
