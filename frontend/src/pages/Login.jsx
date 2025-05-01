import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email : '',
        password : ''
    });

    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };
      

    const handleSubmit = async(e) => {
        console.log("Sending to backend:", JSON.stringify(formData));
        e.preventDefault();

    try {
        const response = await fetch('http://localhost:8000/api/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
  
        const data = await response.json();  
        console.log('data ==<<<>>', data)
        if (data.status === 200) {
          localStorage.setItem("token", data.tokens.access);
          localStorage.setItem("role_id", data.role_id); 
          localStorage.setItem("is_company", data.is_company);
          navigate('/dashboard')
          // if(data.is_company === true){
          //   navigate('/company-dashboard');
          // }
          // else if(data.role_id === 1){
          //   navigate('/admin-dashboard');
          // }
          // else if(data.role_id === 2){
          //   navigate('/hr-dashboard');
          // }
          // else if(data.role_id === 3){
          //   navigate('/employee-dashboard');
          // }
          // else{
          //   navigate('/company-dashboard');
          // }
          
        } else {
          setError("This username or email not found");
        }
      } catch (err) {
        console.log(err);
        setError("An error occurred. Please try again.");
      }
    }
    
    return(
        
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Login </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1"> Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

    
          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
            </div>
      </div>
    )
}

export default Login;