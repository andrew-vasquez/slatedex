import { useParams, Link } from "react-router";
import { MAINLINE_GAMES } from "../data/pokemon";
import TeamBuilder from "../components/team/TeamBuilder";
import { FiArrowLeft } from "react-icons/fi";

const GamePage = () => {
  const { gameId } = useParams();
  const game = MAINLINE_GAMES.find(g => g.id === parseInt(gameId));

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-8">The requested Pokemon game could not be found.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
          >
            <FiArrowLeft />
            Back to Game Selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <TeamBuilder selectedGame={game} />
    </div>
  );
};

export default GamePage;
