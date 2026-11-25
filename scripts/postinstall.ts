import { execSync } from 'node:child_process'

if (!process.env.CI) {
  execSync('nuxt prepare && simple-git-hooks', { stdio: 'inherit' })
}
