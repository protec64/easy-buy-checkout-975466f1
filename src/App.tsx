import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import AdminProofs from "./pages/AdminProofs";
import NotFound from "./pages/NotFound";
import sheinCard from "@/assets/shein-card.jpg.asset.json";
import contaPj from "@/assets/conta-pj.png.asset.json";
import taxaIof from "@/assets/taxa-iof.jpg.asset.json";
import taxaAnual from "@/assets/taxa-anual.jpg.asset.json";
import deposito from "@/assets/deposito.png.asset.json";

const DigitalCheckout = () => {
  const { productId } = useParams();
  return <Checkout key={`digital-${productId || "default"}`} productId={productId} digital />;
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
          <Route path="/produto1" element={<Checkout key="produto1" productId="d2311170-1710-4e78-81c4-9d329b831229" />} />
          <Route path="/produto2" element={<Checkout key="produto2" productId="8c650269-0ca5-42d5-8f96-c3a47709e84f" />} />
          <Route path="/produto3" element={<Checkout key="produto3" productId="21259381-c34e-42d2-a056-9bf98df0e8c8" />} />
          <Route path="/produto4" element={<Checkout key="produto4" productId="0d1fd8d5-db8b-4c75-8d1c-da322d7a2d79" />} />
          <Route path="/produto5" element={<Checkout key="produto5" productId="87323788-46ee-4055-a282-6094ac615f11" />} />
          <Route path="/produto6" element={<Checkout key="produto6" productId="def084a3-04b1-4149-8845-2a3cd64ca086" />} />
          <Route path="/produto7" element={<Checkout key="produto7" productId="c0a13ac2-91df-437e-aa08-5e811c230f2b" />} />
          <Route path="/taxa1" element={<Checkout key="taxa1" productId="804a87c3-c43e-4173-b71c-069d83911bc8" digital overrideImage={sheinCard.url} />} />
          <Route path="/taxa2" element={<Checkout key="taxa2" productId="31ccbc66-dff2-4273-a3f1-d6e7858a2578" digital overrideImage={sheinCard.url} />} />
          <Route path="/taxa3" element={<Checkout key="taxa3" productId="4e1e0583-f0c9-47e9-8632-2e5c81a43518" digital overrideImage={sheinCard.url} />} />
          <Route path="/taxa4" element={<Checkout key="taxa4" productId="bf888b49-0d72-4aeb-a202-d391c5432f95" digital />} />
          <Route path="/ativar-conta" element={<Checkout key="ativar-conta" productId="01ba9522-2107-4a64-9e39-53e782886996" digital overrideImage={contaPj.url} />} />
          <Route path="/taxa-iof" element={<Checkout key="taxa-iof" productId="3992d6d7-f608-4b8a-9191-c053eda9a673" digital overrideImage={taxaIof.url} />} />
          <Route path="/taxa-anual" element={<Checkout key="taxa-anual" productId="806f969c-7667-4d9d-8520-18579f3c772b" digital overrideImage={taxaAnual.url} />} />
          <Route path="/deposito" element={<Checkout key="deposito" productId="5f3e11dc-276b-4c90-a9ed-bfc6aa95aba7" digital overrideImage={deposito.url} />} />
          <Route path="/digital/:productId" element={<DigitalCheckout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/admin/comprovantes" element={<AdminProofs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
