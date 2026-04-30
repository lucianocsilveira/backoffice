export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: string;
  active: boolean;
}
