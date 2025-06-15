import { useState } from "react";
import GameSelector from "./components/game/GameSelector";
import TeamBuilder from "./components/team/TeamBuilder";
import "./index.css";

function App() {
  const [selectedGame, setSelectedGame] = useState(null);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  return (
    <>
      {!selectedGame ? (
        <GameSelector onGameSelect={handleGameSelect} />
      ) : (
        <TeamBuilder selectedGame={selectedGame} onBack={handleBackToGames} />
      )}
    </>
  );
}

export default App;
