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





export const fetchDashboard = async (token) => {
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
  