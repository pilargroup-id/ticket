import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import App from './App.jsx'
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';


createRoot(document.getElementById('root')).render(
  <App />
)
