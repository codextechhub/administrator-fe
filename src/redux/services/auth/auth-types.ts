import type { SchoolInfo, User } from "@/redux/features/auth/auth-types";

export interface ResponseMessage {
    status: boolean;
    message: string;
}

export interface LoginResponse extends ResponseMessage {
  data: {
    access: string
    refresh: string
    session_id: number
    user: User
    permissions: string[]
    school: SchoolInfo | null
  }
}
