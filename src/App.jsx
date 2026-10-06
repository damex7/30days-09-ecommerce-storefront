import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import NotFound from './pages/NotFound.jsx'
import { OrdersProvider } from './state/OrdersContext.jsx'
import { StoreProvider } from './state/StoreContext.jsx'
import { UIProvider } from './state/UIContext.jsx'

export default function App() {
  return (
    <StoreProvider>
      <OrdersProvider>
        <UIProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:id" element={<Product />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:number" element={<OrderConfirmation />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </UIProvider>
      </OrdersProvider>
    </StoreProvider>
  )
}
