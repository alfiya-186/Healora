import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function SignUpPage() {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);

    const userData = {
      email: email,
      username: email, // Django requires a username, so we'll just use their email
      password: password,
      role: role.toLowerCase()
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        alert('🎉 Account created successfully! Please sign in.');
        navigate('/signin'); // Automatically redirect to Sign In page
      } else {
        const errorData = await response.json();
        console.error("Django Error:", errorData);
        alert('Failed to create account. That email might already be taken!');
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
      <div className="hidden md:flex w-1/2 bg-[#0ba396] flex-col justify-center px-16 text-white">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center text-white font-bold text-xl">+</div>
          <span className="text-xl font-bold text-white">Healora</span>
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Start your wellness journey</h1>
        <p className="text-teal-50 mb-12 max-w-md text-lg">
          Join thousands of patients getting personalized nutrition care from certified professionals.
        </p>
        
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white text-[#0ba396] flex items-center justify-center font-bold shrink-0">01</div>
            <div>
              <h3 className="font-bold text-lg">Create Account</h3>
              <p className="text-teal-100">Set up your secure login credentials</p>
            </div>
          </div>
          <div className="flex gap-4 opacity-50">
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold shrink-0">02</div>
            <div>
              <h3 className="font-bold text-lg">Personal Details</h3>
              <p className="text-teal-100">Tell us about yourself</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-12 lg:px-32">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-500 mb-8">Choose your role and set up login credentials</p>

        <div className="flex gap-4 mb-8">
          <button 
            type="button"
            onClick={() => setRole('Patient')}
            className={`flex-1 py-3 border rounded-lg font-medium ${role === 'Patient' ? 'border-[#0ba396] bg-[#e0f2f1] text-[#0ba396]' : 'border-gray-200 text-gray-600'}`}>
            Patient
          </button>
          <button 
            type="button"
            onClick={() => setRole('Nutritionist')}
            className={`flex-1 py-3 border rounded-lg font-medium ${role === 'Nutritionist' ? 'border-[#0ba396] bg-[#e0f2f1] text-[#0ba396]' : 'border-gray-200 text-gray-600'}`}>
            Nutritionist
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
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
              placeholder="Min. 8 characters" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password <span className="text-red-500">*</span></label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#0ba396] text-white py-3 rounded-lg font-medium hover:bg-teal-600 transition mt-4 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Continue →'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600 text-sm">
          Already have an account? <Link to="/signin" className="text-[#0ba396] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}