'use strict'

const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const { readFile } = require('node:fs/promises')
const http = require('node:http')
const net = require('node:net')
const path = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const test = require('node:test')

const root = path.resolve(__dirname, '..')

async function unusedPort () {
  const socket = net.createServer()
  socket.listen(0, '127.0.0.1')
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()))
  return port
}

test('production deployment serves the built app', { timeout: 30000 }, async t => {
  const expectedHtml = await readFile(path.join(root, 'dist/index.html'), 'utf8')
  const port = await unusedPort()
  const origin = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let output = ''
  let startError
  server.stdout.on('data', chunk => { output += chunk })
  server.stderr.on('data', chunk => { output += chunk })
  server.on('error', error => { startError = error })

  t.after(async () => {
    if (server.exitCode !== null || server.signalCode !== null || !server.pid) return
    const exited = once(server, 'exit')
    server.kill('SIGTERM')
    const forceKill = setTimeout(() => server.kill('SIGKILL'), 3000)
    forceKill.unref()
    try {
      await exited
    } finally {
      clearTimeout(forceKill)
    }
  })

  function request (url, headers = {}) {
    return new Promise((resolve, reject) => {
      // Use HTTP directly so the Host header models a request through Heroku.
      const req = http.get(new URL(url, origin), {
        signal: AbortSignal.timeout(5000),
        agent: false,
        headers: {
          host: 'trainset.example',
          'x-forwarded-proto': 'https',
          accept: 'text/html',
          ...headers
        }
      }, response => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', chunk => { body += chunk })
        response.on('error', reject)
        response.on('end', () => resolve({
          status: response.statusCode,
          headers: response.headers,
          body
        }))
      })
      req.on('error', error => reject(new Error(`Request failed: ${url}`, { cause: error })))
    })
  }

  const deadline = Date.now() + 10000
  while (!output.includes(`Listening on port ${port}`)) {
    assert.ifError(startError)
    assert.equal(server.exitCode, null, `Server exited before starting:\n${output}`)
    assert.ok(Date.now() < deadline, `Server did not start:\n${output}`)
    await delay(50)
  }

  await t.test('homepage and client routes return the built HTML', async () => {
    for (const route of ['/', '/help', '/license', '/labeler']) {
      const response = await request(route)
      assert.equal(response.status, 200, route)
      assert.match(response.headers['content-type'], /text\/html/, route)
      assert.equal(response.body, expectedHtml, route)
    }
    assert.match(expectedHtml, /<title>TRAINSET<\/title>/)
    assert.match(expectedHtml, /id=(?:"app"|'app'|app)(?:\s|>)/)
  })

  await t.test('generated JavaScript and CSS are served as assets', async () => {
    const assets = [...expectedHtml.matchAll(/(?:src|href)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)]
      .map(match => new URL(match[1] || match[2] || match[3], origin))
      .filter(url => url.origin === origin && /\.(?:js|css)$/.test(url.pathname))
    assert.ok(assets.some(url => url.pathname.endsWith('.js')), 'No generated JavaScript in index.html')
    assert.ok(assets.some(url => url.pathname.endsWith('.css')), 'No generated CSS in index.html')
    for (const asset of assets) {
      const response = await request(asset.href, { accept: '*/*' })
      assert.equal(response.status, 200, asset.pathname)
      assert.match(response.headers['content-type'], asset.pathname.endsWith('.js')
        ? /(?:application|text)\/javascript/
        : /text\/css/, asset.pathname)
      const body = response.body
      assert.ok(body.length > 0, asset.pathname)
      assert.notEqual(body, expectedHtml, `Asset returned the HTML fallback: ${asset.pathname}`)
    }
  })

  await t.test('sample data survives the production build', async () => {
    const response = await request('/static/files/sample_trainset.csv', { accept: 'text/csv' })
    assert.equal(response.status, 200)
    assert.match(response.headers['content-type'], /text\/csv/)
    assert.equal(response.body, await readFile(path.join(root, 'static/files/sample_trainset.csv'), 'utf8'))
  })

  await t.test('Heroku HTTP requests redirect to HTTPS', async () => {
    const response = await request('/help', { 'x-forwarded-proto': 'http' })
    assert.equal(response.status, 302)
    assert.equal(response.headers.location, 'https://trainset.example/help')
  })
})
