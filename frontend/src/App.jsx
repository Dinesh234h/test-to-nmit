import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Payments from './pages/Payments';
import Khata from './pages/Khata';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import POS from './pages/POS';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/khata" element={<Khata />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pos" element={<POS />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
