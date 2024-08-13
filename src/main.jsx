import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.scss'
import './styles/global.scss'

import ErrorPage from './error-page'
import Loading from './routes/components/Loading.jsx'
const Layout = lazy(() => import('./routes/layout.jsx'))
const UserLayout = lazy(() => import('./routes/userLayout.jsx'))
import SplashScreen from './routes/splashScreen.jsx'
import Home, { loader as homeLoader } from './routes/home.jsx'
import About from './routes/about.jsx'
import Pricing from './routes/pricing.jsx'
import TermsOfService from './routes/terms-of-service.jsx'
import PrivacyPolicy from './routes/privacy-policy.jsx'
import Ecosystem from './routes/ecosystem.jsx'
import Favorite from './routes/favorite.jsx'
import Tip from './routes/tip.jsx'
import Dashboard from './routes/dashboard.jsx'
import Admin from './routes/admin.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </Suspense>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        loader: homeLoader,
        element: <Home title={`The Beginning`} />,
      },
      {
        path: `about`,
        element: <About title={`About`} />,
      },
      {
        path: `ecosystem`,
        element: <Ecosystem title={`Ecosystem`} />,
      },
      {
        path: `favorite`,
        element: <Favorite title={`Favorite`} />,
      },
      {
        path: `tip`,
        element: <Tip title={`Tip`} />,
      },
      {
        path: `pricing`,
        element: <Pricing title={`Pricing`} />,
      },
      {
        path: `admin`,
        element: <Admin title={`Admin`} />,
      },
      {
        path: `terms-of-service`,
        element: <TermsOfService title={`Terms Of Service`} />,
      },
      {
        path: `privacy-policy`,
        element: <PrivacyPolicy title={`Privacy Policy`} />,
      },
    ],
  },
  {
    path: 'user',
    element: (
      <Suspense fallback={<Loading />}>
        <AuthProvider>
          <UserLayout />
        </AuthProvider>
      </Suspense>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard to={`/dashboard`} replace />,
      },
      {
        path: `dashboard`,
        element: <Dashboard title={`Dashboard`} />,
      },
      {
        path: `brand`,
        element: <Dashboard title={`Brand`} />,
      },
      {
        path: `transfer`,
        element: <Dashboard title={`Transfer`} />,
      },
      {
        path: `map`,
        element: <Dashboard title={`Map`} />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
