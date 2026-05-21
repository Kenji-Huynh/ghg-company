import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const LARK_TARGET = 'https://open.larksuite.com'

/** Proxy Lark Open API — tránh CORS khi gọi từ trình duyệt (localhost / trycloudflare). */
function larkOpenApiProxyPlugin() {
  return {
    name: 'lark-open-api-proxy',
    configureServer(server) {
      server.middlewares.use('/lark-open-api', async (req, res, next) => {
        try {
          const incoming = new URL(req.url || '/', 'http://localhost')
          const target = new URL(incoming.pathname.replace(/^\/lark-open-api/, '') + incoming.search, LARK_TARGET)
          const headers = { ...req.headers, host: 'open.larksuite.com' }
          delete headers['content-length']

          const hasBody = req.method && !['GET', 'HEAD'].includes(req.method)
          const body = hasBody ? await new Promise((resolve, reject) => {
            const chunks = []
            req.on('data', (c) => chunks.push(c))
            req.on('end', () => resolve(Buffer.concat(chunks)))
            req.on('error', reject)
          }) : undefined

          const upstream = await fetch(target, { method: req.method, headers, body })
          res.statusCode = upstream.status
          upstream.headers.forEach((value, key) => {
            if (key === 'transfer-encoding') return
            res.setHeader(key, value)
          })
          const buf = Buffer.from(await upstream.arrayBuffer())
          res.end(buf)
        } catch (err) {
          next(err)
        }
      })
    },
    configurePreviewServer(server) {
      this.configureServer(server)
    },
  }
}

const larkProxy = {
  '/lark-open-api': {
    target: LARK_TARGET,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/lark-open-api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      onwarn(warning, defaultHandler) {
        if (warning.code?.startsWith('a11y_')) return
        defaultHandler(warning)
      },
    }),
    larkOpenApiProxyPlugin(),
  ],
  server: {
    proxy: larkProxy,
    /** Quick Tunnel (*.trycloudflare.com) — Host header không phải localhost */
    allowedHosts: ['.trycloudflare.com'],
  },
  preview: {
    proxy: larkProxy,
    allowedHosts: ['.trycloudflare.com'],
  },
})
