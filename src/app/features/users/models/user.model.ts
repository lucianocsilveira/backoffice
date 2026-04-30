export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}
