import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Alert from "../components/Alert";
import EmojiRain from "../components/EmojiRain";
import ArsipGame from "../routes/ArsipGame";
import ArsipList from "../routes/ArsipList";
import Bantuan from "../routes/Bantuan";
import Home from "../routes/Home";
import NotFound from "../routes/NotFound";
import { ThemeProvider } from "../utils/theme";

export default function App() {
  return (
    <ThemeProvider>
      <Alert />
      <EmojiRain />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bantuan" element={<Bantuan />} />
          <Route path="/arsip" element={<ArsipList />} />
          <Route path="/arsip/:num" element={<ArsipGame />} />
          {/* multiplayer mode was removed */}
          <Route path="/lawan" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
