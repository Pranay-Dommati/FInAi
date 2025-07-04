import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-700">FinAI</h1>
      <div className="space-x-4">
        <Link to="/" className="text-gray-600 hover:text-blue-600">Stock Analysis</Link>
        <Link to="/economic" className="text-gray-600 hover:text-blue-600">Economic Trends</Link>
        <Link to="/planning" className="text-gray-600 hover:text-blue-600">Financial Planning</Link>
      </div>
    </nav>
  );
}
