import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Main from './Layouts/Main'
import Auth from './Layouts/Auth'
import Home from './Pages/Home'
import Profile from './Pages/Profile'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Requestrealestate from './Pages/Requestrealestate'
import Services from './Pages/Services'
import SearchRealEstate from './Pages/SearchRealEstate'
import ContractForm from './Pages/ContractFrom'
import SendContract from './Pages/SendContract'
import SecondPartyForm from './Pages/SecondPartyForm'
import NotFound from './Pages/NotFound'
// import OptionalWill from './Pages/OptionalWill'
import Verification from './Pages/Verification'
import RealEstate from './Pages/RealEstate'
import PaymentPage from './Pages/PaymentPage'
import ForgotPassword from './Pages/ForgotPassword'
import ProtectedRoute from './Components/ProtectedRoute'
import AdminRoute from './Components/AdminRoute' 
import AdminDashboard from './Pages/AdminDashboard' 
import Notifications from './Pages/Notifications';
import Transactions from './Pages/Transactions';
// import WillSetup from './Pages/WillSetup'
import WillMethod from './Pages/WillMethod'
import MyWills from './Pages/MyWills'

const router = createBrowserRouter([
  {
    path: '',
    element: <Main />,
    children: [
      { index: true, element: <Home /> },
      { 
        path: 'profile', 
        element: <ProtectedRoute><Profile /></ProtectedRoute> 
      },
      { 
        path: 'services', 
        element: <ProtectedRoute><Services /></ProtectedRoute> 
      },
      { 
        path: 'requestrealestate', 
        element: <ProtectedRoute><Requestrealestate /></ProtectedRoute> 
      },
      { 
        path: 'searchRealEstate', 
        element: <ProtectedRoute><SearchRealEstate /></ProtectedRoute> 
      },
      { 
        path: 'contractForm', 
        element: <ProtectedRoute><ContractForm /></ProtectedRoute> 
      },
      { 
        path: 'sendContract', 
        element: <ProtectedRoute><SendContract /></ProtectedRoute> 
      },
      { 
        path: 'secondPartyForm', 
        element: <ProtectedRoute><SecondPartyForm /></ProtectedRoute> 
      },
      // { 
      //   path: 'optionalWill', 
      //   element: <ProtectedRoute><OptionalWill /></ProtectedRoute> 
      // },
      // { 
      //   path: 'willSetup', 
      //   element: <ProtectedRoute><WillSetup /></ProtectedRoute> 
      // }, 
      { 
        path: 'willMethod', 
        element: <ProtectedRoute><WillMethod/></ProtectedRoute> 
      },
      { 
        path: 'realEstate', 
        element: <ProtectedRoute><RealEstate /></ProtectedRoute> 
      },
      { 
        path: 'paymentPage', 
        element: <ProtectedRoute><PaymentPage /></ProtectedRoute> 
      },
      { 
        path: 'admin/dashboard', 
        element: <AdminRoute><AdminDashboard /></AdminRoute> 
      },
      { path: 'login/verification', element: <Verification /> },
      { path: 'forgotPassword', element: <ForgotPassword /> },
      { 
        path: 'transactions', 
        element: <ProtectedRoute><Transactions /></ProtectedRoute> 
      },
      { 
        path: 'my-wills', 
        element: <ProtectedRoute><MyWills /></ProtectedRoute> 
      },
    ]
  },
  {
    path: '',
    element: <Auth />,
    children: [
      { path: 'register', element: <Register /> },
      { path: 'login', element: <Login /> },
      { 
        path: 'notifications', 
        element: <ProtectedRoute><Notifications /></ProtectedRoute> 
      },
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}