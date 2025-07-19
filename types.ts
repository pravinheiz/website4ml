export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  created_at: string
}

export interface Package {
  id: number
  label: string
  diamonds: number
  bonus: number
  price: number
  isPopular?: boolean
  oldPrice?: number
}

export interface Order {
  id: number
  user_id: string
  player_id: number
  server_id: number
  package_id: number
  package?: Package
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  created_at: string
  whatsapp_url?: string
}

export interface Server {
  id: number
  name: string
  flag?: string
}