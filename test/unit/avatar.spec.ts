import { describe, expect, it } from 'vitest'
import { avatar } from '../../shared/avatar'

describe('avatar', () => {
  it('should request the displayed size and twice that size from GitHub', () => {
    expect(avatar('danielroe', 20)).toEqual({
      src: 'https://avatars.githubusercontent.com/danielroe?s=40',
      srcset: 'https://avatars.githubusercontent.com/danielroe?s=20 1x, https://avatars.githubusercontent.com/danielroe?s=40 2x',
      width: 20,
      height: 20,
    })
  })

  it('should resize the larger GitHub image through Vercel when optimising', () => {
    const source = 'https%3A%2F%2Favatars.githubusercontent.com%2Fdanielroe%3Fs%3D64'
    expect(avatar('danielroe', 32, true)).toEqual({
      src: `/_vercel/image?url=${source}&w=64&q=75`,
      srcset: `/_vercel/image?url=${source}&w=32&q=75 1x, /_vercel/image?url=${source}&w=64&q=75 2x`,
      width: 32,
      height: 32,
    })
  })
})
