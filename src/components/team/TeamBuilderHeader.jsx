import { FiArrowLeft, FiTrash2, FiShuffle } from "react-icons/fi";

const TeamBuilderHeader = ({ onBack, onShuffle, onClear, teamLength }) => {

  return (
    <header
      className="bg-gray-800/50 backdrop-blur-sm border-b-2 border-gray-700 sticky top-0 z-40"
      role="banner"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <nav
            className="flex items-center gap-3 sm:gap-4"
            aria-label="Team builder navigation"
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors md:hover:cursor-pointer"
              aria-label="Go back to game selection"
            >
              <FiArrowLeft size={18} className="sm:hidden" aria-hidden="true" />
              <FiArrowLeft
                size={20}
                className="hidden sm:block"
                aria-hidden="true"
              />
              <span className="font-medium text-sm sm:text-base">
                Change Game
              </span>
            </button>
          </nav>
          <div
            className="flex items-center gap-2 sm:gap-3"
            role="toolbar"
            aria-label="Team management tools"
          >
            <button
              onClick={onShuffle}
              disabled={teamLength === 0}
              className="btn-secondary text-sm sm:text-base md:hover:cursor-pointer"
              aria-label="Shuffle current team members"
              title="Shuffle team"
            >
              <FiShuffle size={14} className="sm:hidden" aria-hidden="true" />
              <FiShuffle
                size={16}
                className="hidden sm:block"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
            <button
              onClick={onClear}
              disabled={teamLength === 0}
              className="btn-danger text-sm sm:text-base md:hover:cursor-pointer"
              aria-label="Clear all team members"
              title="Clear team"
            >
              <FiTrash2 size={14} className="sm:hidden" aria-hidden="true" />
              <FiTrash2
                size={16}
                className="hidden sm:block"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TeamBuilderHeader;
