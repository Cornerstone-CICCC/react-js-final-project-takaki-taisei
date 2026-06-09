import type { LoginDataType, SignupDataType } from "../../types/auth.types";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

async function loginUser(loginData: LoginDataType) {
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

async function signupUser(data:SignupDataType) {
    const res = await fetch(`${backendUrl}/api/auth/signup`, {
        method:"POST",
        credentials:"include",
        body:JSON.stringify(data),
        headers:{"Content-Type":"application/json"}
    })

    const 
}
