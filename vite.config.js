import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY
  if (env.OPENAI_MODEL) process.env.OPENAI_MODEL = env.OPENAI_MODEL
  return {
  plugins: [react(), {
    name: 'liva-assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/assistant', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          const cloudEndpoint = env.LIVA_DEV_ASSISTANT_URL || 'https://liva-eta.vercel.app/api/assistant'
          try {
            const cloudResponse = await fetch(cloudEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: body || '{}',
            })
            const cloudBody = await cloudResponse.text()
            res.statusCode = cloudResponse.status
            res.setHeader('Content-Type', cloudResponse.headers.get('content-type') || 'application/json')
            return res.end(cloudBody)
          } catch (cloudError) {
            console.warn('Liva cloud assistant unavailable, trying local handler:', cloudError.message)
          }
          try { req.body = JSON.parse(body || '{}') } catch { req.body = {} }
          res.status = code => { res.statusCode = code; return res }
          res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
          const { default: handler } = await import('./api/assistant.js')
          await handler(req, res)
        })
      })
    },
  }],
  server: {
    watch: {
      ignored: ["**/dist/**", "**/.pnpm-store/**"],
    },
  },
  }
})
