import { useState } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import "./challenges.css";

const languages = [
  { id: 63, name: "JavaScript", monaco: "javascript" },
  { id: 71, name: "Python", monaco: "python" },
  { id: 62, name: "Java", monaco: "java" },
  { id: 54, name: "C++", monaco: "cpp" },
  { id: 50, name: "C", monaco: "c" },
  { id: 51, name: "C#", monaco: "csharp" },
  { id: 60, name: "Go", monaco: "go" },
  { id: 72, name: "Ruby", monaco: "ruby" },
  { id: 73, name: "Rust", monaco: "rust" }
];

export default function Challenges() {
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  return (
    <div className="challenge-container">
      <Split
        className="challenge-layout"
        sizes={[40,40, 20]} 
        minSize={100}
        gutterSize={6}
      >
        {/* LEFT: Video */}
        <div className="video-panel">
          <h3>Lesson Video</h3>
          <div className="video-placeholder">🎥 Video Player Here</div>
        </div>

        {/* MIDDLE: Editor */}
        <div className="editor-panel">
          <div className="editor-header">
            <select
              value={selectedLang.id}
              onChange={(e) => {
                const lang = languages.find((l) => l.id === Number(e.target.value));
                setSelectedLang(lang);
                setCode("");
              }}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
            <button
              className="run-btn"
              onClick={() => setOutput("Backend not connected yet 👀")}
            >
              Run
            </button>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLang.monaco}
              value={code}
              onChange={setCode}
              options={{ minimap: { enabled: false }, fontSize: 17, lineHeight: 30 }}
            />
          </div>

          <div className="output-panel">{output}</div>
        </div>

        {/* RIGHT: AI panel */}
        <div className="ai-panel">
          <h3>AI Tutor</h3>
          <div className="ai-placeholder">🤖 Ask questions about your code</div>
        </div>
      </Split>
    </div>
  );
}
