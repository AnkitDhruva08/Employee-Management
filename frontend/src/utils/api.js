// utils/api.js

// Role Based Dashboard API
 export const  fetchDashboard = async (token) => {
  const res = await fetch("http://localhost:8000/api/dashboard/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load data");
  const data = await res.json();
  return data;
};


// Dashboard API Link Function 
export const fetchDashboardLink = async (token, url) => {
  const response = await fetch('http://localhost:8000/api/dashboard-link/',
    { method: "GET",
      headers:
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  console.log("Dashboard link response:", data);
  return data;
}



// Logout API
export const logout = async (token) => {
  const res = await fetch("http://localhost:8000/api/logout/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to logout");
  const data = await res.json();
  console.log("Logout response:", data);
  return await res.json();
}
