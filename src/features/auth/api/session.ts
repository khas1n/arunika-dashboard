export interface SessionUser {
  id: string
  name: string
  username: string
  email: string
  image: string | null
  createdAt: string
}

export interface SessionInfo {
  id: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
}

export interface CurrentSession {
  user: SessionUser
  session: SessionInfo
}
