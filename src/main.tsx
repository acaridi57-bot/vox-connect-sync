import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import PhotoTranslator from "./pages/PhotoTranslator.tsx";
import PdfTranslator from "./pages/PdfTranslator.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/photo" element={<PhotoTranslator />} />
      <Route path="/pdf" element={<PdfTranslator />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
