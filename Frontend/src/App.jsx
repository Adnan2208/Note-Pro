import { useState, useEffect } from "react";
import AccessCode from "./AccessCode";
import Notes from "./components/Notes";

function App() {
  const [accessCode, setAccessCode] = useState(null);

  // Check for stored access code on mount
  useEffect(() => {
    const storedCode = localStorage.getItem('notepro_access_code');
    if (storedCode) {
      setAccessCode(storedCode);
    }
  }, []);

  const handleAccessCodeValidated = (code) => {
    setAccessCode(code);
    localStorage.setItem('notepro_access_code', code);
  };

  const handleLogout = () => {
    setAccessCode(null);
    localStorage.removeItem('notepro_access_code');
  };

  return (
    <>
      {accessCode ? (
        <Notes accessCode={accessCode} onLogout={handleLogout} />
      ) : (
        <AccessCode onAccessCodeValidated={handleAccessCodeValidated} />
      )}
    </>
  );
}

export default App;
