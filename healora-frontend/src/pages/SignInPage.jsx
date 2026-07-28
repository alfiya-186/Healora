import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Lock, Activity, MessageSquare } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevents page reload
    setIsSubmitting(true);

    try {
      // Django's JWT expects 'username' and 'password'
      // Since we used email as the username during signup, we map email to username here.
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: email, 
          password: password 
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save the secure tokens to the browser's local storage
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        alert('✅ Login Successful! Welcome back.');
        navigate('/book'); // Send them to the booking page after login!
      } else {
        alert('❌ Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert('Cannot connect to Django server!');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 bg-[#0ba396] flex-col justify-center items-center text-white p-12">
        <div className="text-6xl mb-6">🥦</div>
        <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
        <p className="text-teal-50 mb-12 text-center max-w-sm">
          Continue your nutrition journey. Your personalized care plan is waiting.
        </p>
        
        <div className="space-y-4 w-full max-w-sm">
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
            <Lock size={20} className="text-yellow-400" />
            <span>Secure health data via JWT</span>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
            <Activity size={20} className="text-blue-300" />
            <span>Track daily wellness</span>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
            <MessageSquare size={20} className="text-white" />
            <span>Chat with AI assistant</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-12 lg:px-32">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-[#0ba396] rounded-md flex items-center justify-center text-white font-bold text-xl">+</div>
          <span className="text-xl font-bold text-gray-800">Healora</span>
        </Link>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to Healora</h2>
        <p className="text-gray-500 mb-8">Enter your credentials to access your account</p>
        
        <form className="space-y-5" onSubmit={handleSignIn}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-[#0ba396] font-medium hover:underline">Forgot password?</a>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#0ba396] text-white py-3 rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className="relative flex items-center justify-center py-4">
            <div className="border-t border-gray-200 w-full absolute"></div>
            <span className="bg-white px-4 text-sm text-gray-500 relative">or continue with</span>
          </div>
          
          <button type="button" className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </form>
        
        <p className="text-center mt-8 text-gray-600 text-sm">
          Don't have an account? <Link to="/signup" className="text-[#0ba396] font-medium hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}