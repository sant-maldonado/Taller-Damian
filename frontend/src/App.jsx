import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import InstallPrompt from './components/InstallPrompt'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Vehicles from './pages/Vehicles'
import Orders from './pages/Orders'
import Services from './pages/Services'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import Hours from './pages/Hours'
import './index.css'

function App() {
  return (
    <Router>
      <InstallPrompt />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/services" element={<Services />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/hours" element={<Hours />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
