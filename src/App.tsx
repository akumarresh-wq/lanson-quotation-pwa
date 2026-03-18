import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import LoadingSpinner from './components/common/LoadingSpinner'
import LoginScreen from './components/auth/LoginScreen'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import DashboardPage from './components/dashboard/DashboardPage'

const PriceListPage = lazy(() => import('./components/price-list/PriceListPage'))
const DiscountListPage = lazy(() => import('./components/discount/DiscountListPage'))
const DiscountRequestForm = lazy(() => import('./components/discount/DiscountRequestForm'))
const DiscountDetailPage = lazy(() => import('./components/discount/DiscountDetailPage'))
const QuotationListPage = lazy(() => import('./components/quotation/QuotationListPage'))
const QuotationForm = lazy(() => import('./components/quotation/QuotationForm'))
const QuotationDetailPage = lazy(() => import('./components/quotation/QuotationDetailPage'))
const CustomerListPage = lazy(() => import('./components/customer/CustomerListPage'))
const NotificationPanel = lazy(() => import('./components/notifications/NotificationPanel'))
const MorePage = lazy(() => import('./pages/MorePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginScreen />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="prices" element={<PriceListPage />} />
                    <Route path="discounts" element={<DiscountListPage />} />
                    <Route path="discounts/new" element={<DiscountRequestForm />} />
                    <Route path="discounts/:id" element={<DiscountDetailPage />} />
                    <Route path="quotations" element={<QuotationListPage />} />
                    <Route path="quotations/new" element={<QuotationForm />} />
                    <Route path="quotations/:id" element={<QuotationDetailPage />} />
                    <Route path="customers" element={<CustomerListPage />} />
                    <Route path="notifications" element={<NotificationPanel />} />
                    <Route path="more" element={<MorePage />} />
                    <Route path="admin" element={<AdminPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
