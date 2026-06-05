const { execSync } = require('child_process')

const PORTS = [3000, 3001, 3002, 4002]
const isWindows = process.platform === 'win32'

for (const port of PORTS) {
  try {
    if (isWindows) {
      // Find PIDs using this port, kill each one
      const out = execSync(
        `netstat -ano | findstr ":${port} "`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      )
      const pids = [
        ...new Set(
          out.trim().split('\n')
            .map(line => line.trim().split(/\s+/).pop())
            .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
        )
      ]
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        console.log(`  killed PID ${pid} (port ${port})`)
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' })
    }
  } catch {
    // Port not in use — nothing to do
  }
}

console.log('Ports 3000/3001/3002/4002 cleared.')
