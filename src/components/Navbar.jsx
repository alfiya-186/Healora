import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center py-4 px-8 border-b border-gray-100 bg-white">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center text-white font-bold text-xl">
          +
        </div>
        <span className="text-xl font-bold text-gray-800">Healora</span>
      </Link>
      <div className="flex gap-4">
        <Link to="/signin" className="px-5 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 font-medium">
          Sign In
        </Link>
        <Link to="/signup" className="px-5 py-2 bg-[#0ba396] text-white rounded-md hover:bg-teal-600 font-medium">
          Get Started
        </Link>
      </div>
    </nav>
  );
}