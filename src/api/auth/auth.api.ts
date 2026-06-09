import type { LoginDataType, SignupDataType } from "../../types/auth.types";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function loginUser(loginData: LoginDataType) {
  const res = await fetch(`${backendUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginData),
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ? data.message : "Failed to log in");
  }

  const user = data.data;
  return user;
}

export async function signupUser(signupData: SignupDataType) {
  const res = await fetch(`${backendUrl}/api/auth/signup`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(signupData),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to sign up");
  }

  const user = data.data;
  return user;
}

export async function getMe() {
  const res = await fetch(`${backendUrl}/api/auth/me`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ? data.message : "Failed to get user");
  }

  return data.data;
}
