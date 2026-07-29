import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, PlusSquare, ArrowRight } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      // FORCING exact IP address and trailing slash!
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          full_name: fullName, 
          email: email, 
          password: password, 
          role: role 
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        alert("🎉 Account created successfully! Redirecting to Sign In...");
        navigate('/signin');
      } else {
        // If Django rejected the password or email
        console.log("Django rejected the data:", data);
        setErrorMsg("Registration failed: " + (data ? JSON.stringify(data) : "Unknown error"));
      }
    } catch (error) {
      // If the server is offline or browser blocked it
      console.error("NETWORK ERROR:", error);
      setErrorMsg("Cannot connect to Django. Please make sure the Django terminal is running!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex items-center gap-2 cursor-pointer mb-6" onClick={() => navigate('/')}>
          <div className="bg-[#0ba396] text-white rounded-md p-1"><PlusSquare size={28} strokeWidth={2.5} /></div>
          <span className="text-3xl font-bold tracking-tight">Heal<span className="text-[#0ba396]">ora</span></span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 text-sm font-semibold rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="mb-6 flex p-1 bg-gray-100 rounded-lg">
            <button type="button" className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${role === 'PATIENT' ? 'bg-white text-[#0ba396] shadow-sm' : 'text-gray-500'}`} onClick={() => setRole('PATIENT')}>I'm a Patient</button>
            <button type="button" className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${role === 'NUTRITIONIST' ? 'bg-white text-[#0ba396] shadow-sm' : 'text-gray-500'}`} onClick={() => setRole('NUTRITIONIST')}>I'm a Nutritionist</button>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="focus:ring-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none" placeholder="Alfiya Ismail" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus:ring-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none" placeholder="alfiya@gmail.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="focus:ring-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-sm text-sm font-medium text-white bg-[#0ba396] hover:bg-teal-700 transition">
                Create Account <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;