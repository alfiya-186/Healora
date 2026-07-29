import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, PlusSquare, ArrowRight } from 'lucide-react';

const SignInPage = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/patient-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex items-center gap-2 cursor-pointer mb-6" onClick={() => navigate('/')}>
          <div className="bg-[#0ba396] text-white rounded-md p-1"><PlusSquare size={28} strokeWidth={2.5} /></div>
          <span className="text-3xl font-bold tracking-tight">Heal<span className="text-[#0ba396]">ora</span></span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input type="email" required className="focus:ring-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input type="password" required className="focus:ring-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border outline-none" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-sm text-sm font-medium text-white bg-[#0ba396] hover:bg-teal-700 transition">
              Sign In <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default SignInPage;