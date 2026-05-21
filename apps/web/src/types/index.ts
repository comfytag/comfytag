export * from '@comfytag/types'

// Web-specific session type augmentation
import 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      token: string
      isPartner: boolean
      isAdmin: boolean
      image?: string
    }
  }
}
