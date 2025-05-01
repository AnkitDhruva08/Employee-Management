// utils/api.js
export const fetchCompanyDashboardLinks = async (token) => {
  const res = await fetch("http://localhost:8000/api/company-dashboard-link/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load quick links");

  const data = await res.json();
  return data;
};

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

// Employee Dashboard Links API
export const employeeDashboardLink = async (token) => {
  const response = await fetch(
    "http://localhost:8000/api/employees-dashboard-link/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  console.log("Employee Dashboard Links data:", data);
  return data;
};



// Dashboard API Link Function 
export const fetchDashboardLink = async (token, url) => {
  console.log('url:', url);
  const response = await fetch(
    `${url}`,
    { method: "GET",
      headers:
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  console.log('dashboard Link data:', data);
  return data;
}




//  fetching user details function 

export const fetchUserDetails = async (token) => {
  const res = await fetch("http://localhost:8000/api/dashboard/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Unauthorized");
  const data = await res.json();
  return data;
};





export const fetchCurrentUser = async (token) => {
  const res = await fetch("http://localhost:8000/api/current-user/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return await res.json();
};




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
