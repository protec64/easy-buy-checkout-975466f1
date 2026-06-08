import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

const DigitalCheckout = () => {
  const { productId } = useParams();
  return <Checkout productId={productId} digital />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/produto1" replace />} />
          <Route path="/produto1" element={<Checkout productId="d2311170-1710-4e78-81c4-9d329b831229" />} />
          <Route path="/produto2" element={<Checkout productId="8c650269-0ca5-42d5-8f96-c3a47709e84f" />} />
          <Route path="/produto3" element={<Checkout productId="21259381-c34e-42d2-a056-9bf98df0e8c8" />} />
          <Route path="/produto4" element={<Checkout productId="0d1fd8d5-db8b-4c75-8d1c-da322d7a2d79" />} />
          <Route path="/produto5" element={<Checkout productId="87323788-46ee-4055-a282-6094ac615f11" />} />
          <Route path="/produto6" element={<Checkout productId="def084a3-04b1-4149-8845-2a3cd64ca086" />} />
          <Route path="/produto7" element={<Checkout productId="c0a13ac2-91df-437e-aa08-5e811c230f2b" />} />
          <Route path="/success" element={<Success />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
