import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
