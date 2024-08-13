import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.scss'
import './styles/global.scss'

import ErrorPage from './error-page'
import Loading from './routes/components/Loading.jsx'
const Layout = lazy(() => import('./routes/layout.jsx'))
import Home, { loader as homeLoader } from './routes/home.jsx'
import About from './routes/about.jsx'
import Ecosystem from './routes/ecosystem.jsx'
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
        path: `admin`,
        element: <Admin title={`Admin`} />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
