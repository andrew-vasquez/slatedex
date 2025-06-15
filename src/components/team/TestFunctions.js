// Debug functions for localStorage testing
const testSave = () => {
  const testTeam = [
    {
      id: 1,
      name: "Bulbasaur",
      types: ["grass", "poison"],
      generation: 1,
      hp: 45,
      attack: 49,
      defense: 49,
      sprite:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    },
    null,
    null,
    null,
    null,
    null,
  ];
  localStorage.setItem("debug_team_test", JSON.stringify(testTeam));
  console.log("Debug: Saved test team to localStorage");
  alert("Test team saved to localStorage");
};

const testLoad = () => {
  const saved = localStorage.getItem("debug_team_test");
  console.log("Debug: Loaded from localStorage:", saved);
  if (saved) {
    const parsed = JSON.parse(saved);
    console.log("Debug: Parsed team:", parsed);
    alert(`Loaded team: ${parsed[0] ? parsed[0].name : "Empty"}`);
  } else {
    alert("No test team found in localStorage");
  }
};

const showAllTeams = () => {
  const allKeys = Object.keys(localStorage);
  const teamKeys = allKeys.filter((key) => key.startsWith("team_gen_"));
  console.log("All team keys in localStorage:", teamKeys);

  teamKeys.forEach((key) => {
    const team = localStorage.getItem(key);
    console.log(`${key}:`, team);
  });

  alert(`Found ${teamKeys.length} saved teams. Check console for details.`);
};

export { testSave, testLoad, showAllTeams };
