import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TextForm from "./components/TextForm";
import ResultCard from "./components/ResultCard";
import Features from "./components/features"; // Import the Features component


function App() {
  const [result, setResult] = useState(null);
  const [initialScore, setInitialScore] = useState(null); // Add state for initial score

  // Create a combined result object that includes both scores
  const handleResultUpdate = (data) => {
    setResult(data);
    if (data) {
      setInitialScore(data.initial_ai_score);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="flex-row">
          <TextForm 
            setResult={handleResultUpdate} 
            setInitialScore={setInitialScore} // Pass this down to TextForm
          />
          <ResultCard 
            result={result} 
            initialScore={initialScore} // Pass initial score to ResultCard
          />
        </div>
      </div>
      
      {/* Features Section - Added between main content and footer */}
      <Features />
      
      <Footer />
    </>
  );
}

export default App;