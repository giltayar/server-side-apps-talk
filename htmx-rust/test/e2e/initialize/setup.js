import {setTimeout} from 'node:timers/promises'
import {spawn} from 'node:child_process'
import {tmpdir} from 'os'
import {mkdtemp} from 'node:fs/promises'

export async function setup(port) {
  const ret = spawn('./target/debug/htmx-rust', [], {
    cwd: new URL('../../..', import.meta.url),
    env: {...process.env, PORT: String(port), DATA_DIR: await mkdtemp(`${tmpdir()}/`)},
  })

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`)

      if (res.ok) {
        await res.arrayBuffer()

        return ret
      }
    } catch {
      await setTimeout(100)
    }
  }
  throw new Error('App did not start in time')
}
