// import { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import Editor from "@monaco-editor/react";
// import Split from "react-split";
// import { useNavigate, useLocation } from "react-router-dom";
// import "./Videolesson.css";
// import logo from "./assets/Code along_logo-04.png";
// import { buildLearnerFeedback } from "./learnerFeedback";

// /* ================= LANGUAGES ================= */
// const LANGUAGES = [
//   { id: 63, name: "JavaScript", monaco: "javascript" },
//   { id: 71, name: "Python", monaco: "python" },
//   { id: 62, name: "Java", monaco: "java" },
//   { id: 54, name: "C++", monaco: "cpp" },
//   { id: 50, name: "C", monaco: "c" },
//   { id: 51, name: "C#", monaco: "csharp" },
//   { id: 60, name: "Go", monaco: "go" },
//   { id: 72, name: "Ruby", monaco: "ruby" },
//   { id: 73, name: "Rust", monaco: "rust" },
// ];

// /* ================= TEMPLATES ================= */
// const CODE_TEMPLATES = {
//   javascript: "// Write your code here\n",
//   python: "# Write Python here\n",
//   java: "// Write Java code here\n",
//   cpp: "// Write C++ code here\n",
//   c: "// Write C code here\n",
//   csharp: "// Write C# code here\n",
//   go: "// Write Go code here\n",
//   ruby: "# Write Ruby code here\n",
//   rust: "// Write Rust code here\n",
// };

// export default function Videolesson() {
// const navigate = useNavigate();
// const location = useLocation();

// const video = location.state?.video;
// const moduleId = location.state?.moduleId;
// console.log("Location State:", location.state);
// console.log("Video:", location.state?.video);
// console.log("Module ID:", location.state?.moduleId);
// console.log("Topic:", location.state?.topic);


// const [currentVideo, setCurrentVideo] = useState(video || null);
// const [, setVideos] = useState([]);
// const [loadingVideo, setLoadingVideo] = useState(true);
//   /* ================= REFS ================= */
//   const messagesEndRef = useRef(null);
//   const chatContainerRef = useRef(null);
//   const historyRef = useRef(null);

//   /* ================= STATE ================= */
//   const [output, setOutput] = useState("");
//   const [chatInput, setChatInput] = useState("");
//   const [hintLoading, setHintLoading] = useState(false);
//   const [hintOpen, setHintOpen] = useState(false);
//   const [hintFeedback, setHintFeedback] = useState(null);
//   const [hintError, setHintError] = useState("");

//   const [tabs, setTabs] = useState([
//     {
//       id: 1,
//       name: "Tab 1",
//       language: LANGUAGES[0],
//       code: CODE_TEMPLATES.javascript,
//     },
//   ]);

//   const [activeTab, setActiveTab] = useState(1);

//   const [conversations, setConversations] = useState([
//     {
//       id: 1,
//       title: "Variables",
//       messages: [
//         { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
//       ],
//     },
//     {
//       id: 2,
//       title: "Loops",
//       messages: [
//         { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
//       ],
//     },
//     {
//       id: 3,
//       title: "c# basics",
//       messages: [
//         { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
//       ],
//     },
//     {
//       id: 4,
//       title: "functions",
//       messages: [
//         { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
//       ],
//     },
//   ]);

//   const [activeConversationId, setActiveConversationId] = useState(1);
//   const [showHistory, setShowHistory] = useState(false);
//   const [openMenuId, setOpenMenuId] = useState(null);

//   /* ================= DERIVED VALUES ================= */
//   const currentTab = tabs.find((tab) => tab.id === activeTab);
//   const selectedLang = currentTab?.language || LANGUAGES[0];
//   const code = currentTab?.code || "";

//   const activeConversation = conversations.find(
//     (c) => c.id === activeConversationId
//   );

//   const messages = useMemo(
//     () => activeConversation?.messages || [],
//     [activeConversation]
//   );

//   /* ================= MONACO ================= */
//   const handleEditorBeforeMount = useCallback((monacoInstance) => {
//     monacoInstance.editor.defineTheme("custom-dark", {
//       base: "vs-dark",
//       inherit: true,
//       rules: [],
//       colors: {
//         "editor.background": "#0f172a",
//         "editorSuggestWidget.background": "#0f172a",
//         "editorSuggestWidget.foreground": "#e2e8f0",
//         "editorSuggestWidget.selectedBackground": "#2563eb",
//         "editorSuggestWidget.border": "#334155",
//         "editorSuggestWidget.highlightForeground": "#60a5fa",
//       },
//     });
//   }, []);

//   /* ================= CHAT ================= */
//   const handleSendMessage = () => {
//     if (!chatInput.trim()) return;

//     const userMsg = { role: "user", content: chatInput };

//     setConversations((prev) =>
//       prev.map((conv) =>
//         conv.id === activeConversationId
//           ? { ...conv, messages: [...conv.messages, userMsg] }
//           : conv
//       )
//     );

//     setChatInput("");

//     setTimeout(() => {
//       setConversations((prev) =>
//         prev.map((conv) =>
//           conv.id === activeConversationId
//             ? {
//                 ...conv,
//                 messages: [
//                   ...conv.messages,
//                   {
//                     role: "ai",
//                     content:
//                       "I can help explain concepts, debug code, and guide you through the lesson.",
//                   },
//                 ],
//               }
//             : conv
//         )
//       );
//     }, 700);
//   };

//   /* ================= CHAT HELPERS ================= */
//   const getChatTitle = () => {
//     const path = location.pathname.toLowerCase();

//     if (path.includes("variable")) return "Variables";
//     if (path.includes("loop")) return "Loops";
//     if (path.includes("array")) return "Arrays";

//     return "New Chat";
//   };

//   const handleNewChat = () => {
//     const newChat = {
//       id: Date.now(),
//       title: getChatTitle(),
//       messages: [
//         { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
//       ],
//     };

//     setConversations((prev) => [newChat, ...prev]);
//     setActiveConversationId(newChat.id);
//     setShowHistory(false);
//   };

//   const handleRename = (id) => {
//     const name = prompt("Rename chat:");
//     if (!name) return;

//     setConversations((prev) =>
//       prev.map((c) => (c.id === id ? { ...c, title: name } : c))
//     );
//   };

//   const handleDelete = (id) => {
//     setConversations((prev) => {
//       const updated = prev.filter((c) => c.id !== id);

//       if (activeConversationId === id && updated.length > 0) {
//         setActiveConversationId(updated[0].id);
//       }

//       return updated;
//     });
//   };

//   /* ================= EDITOR ================= */
//   const handleLanguageChange = (id) => {
//     const lang = LANGUAGES.find((l) => l.id === Number(id));
//     if (!lang) return;

//     setTabs((prev) =>
//       prev.map((tab) =>
//         tab.id === activeTab
//           ? { ...tab, language: lang, code: CODE_TEMPLATES[lang.monaco] }
//           : tab
//       )
//     );

//     setOutput("");
//     setHintFeedback(null);
//     setHintError("");
//   };

//  const handleRun = () => {
//   const runCode = async () => {
//     setOutput("Executing your code...");

//     try {
//       const response = await fetch("/compile-poll", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           source_code: code,
//           language_id: selectedLang.id,
//           stdin: "",
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(data.error || "Execution failed");
//       }

//       const result = data.data;

//       setOutput(
//         result.stdout ||
//           result.stderr ||
//           result.compile_output ||
//           result.status?.description ||
//           "No output"
//       );
//     } catch (error) {
//       console.error(error);
//       setOutput(error.message || "Unable to run code");
//     }
//   };

//   runCode();
// };
//   const handleAddTab = () => {
//   const newTab = {
//     id: Date.now(),
//     name: `Tab ${tabs.length + 1}`,
//     language: LANGUAGES[0],
//     code: CODE_TEMPLATES.javascript,
//   };

//   setTabs((prev) => [...prev, newTab]);
//   setActiveTab(newTab.id);
// };

// const handleDeleteTab = (tabId) => {
//   setTabs((prev) => {
//     const updated = prev.filter((tab) => tab.id !== tabId);

//     if (activeTab === tabId && updated.length > 0) {
//       setActiveTab(updated[0].id);
//     }

//     return updated;
//   });
// };
// // useEffect(() => {
// //   setLoadingVideo(false);
// // }, []);
// useEffect(() => {
//   const fetchVideos = async () => {
//     if (!moduleId) return;

//     try {
//       setLoadingVideo(true);

//       const response = await fetch(
//         `/api/videos/module/${moduleId}`,
//         {
//           method: "GET",
//           credentials: "include",
//         }
//       );

//       const data = await response.json();

//       console.log("VIDEO RESPONSE:", data);

//       if (!response.ok || !data.success) {
//         throw new Error(
//           data.error || "Failed to load videos"
//         );
//       }

//       setVideos(data.videos || []);

//       // Set first video automatically
//       const firstVideo = data.videos?.find(
//         (v) => v.video
//       );

//       if (firstVideo) {
//         setCurrentVideo(firstVideo.video);
//       }

//     } catch (error) {
//       console.error("Failed to fetch videos:", error);
//     } finally {
//       setLoadingVideo(false);
//     }
//   };

//   fetchVideos();
// }, [moduleId]);

//   useEffect(() => {
//     setConversations((prev) =>
//       prev.map((c) => (c.title?.trim() ? c : { ...c, title: "New Chat" }))
//     );
//   }, []);

//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTo({
//         top: chatContainerRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }
//   }, [messages]);

//   useEffect(() => {
//   const handleClickOutside = (e) => {
//     if (
//       showHistory &&
//       historyRef.current &&
//       !historyRef.current.contains(e.target)
//     ) {
//       setShowHistory(false);
//     }

//     if (openMenuId) {
//       const isInsideMenu = e.target.closest(".menu-dropdown");
//       const isMenuButton = e.target.closest(".menu-btn");

//       if (!isInsideMenu && !isMenuButton) {
//         setOpenMenuId(null);
//       }
//     }
//   };

//   document.addEventListener("mousedown", handleClickOutside);

//   return () =>
//     document.removeEventListener(
//       "mousedown",
//       handleClickOutside
//     );
// }, [showHistory, openMenuId]);

// useEffect(() => {
//   const handleEscape = (event) => {
//     if (event.key === "Escape") {
//       setHintOpen(false);
//     }
//   };

//   if (hintOpen) {
//     window.addEventListener("keydown", handleEscape);
//   }

//   return () =>
//     window.removeEventListener(
//       "keydown",
//       handleEscape
//     );
// }, [hintOpen]);

// /* ================= RENDER ================= */
// return (
//   <div className="Videolesson-container">
//     <Split
//       className="Videolesson-layout"
//       sizes={[35, 40, 25]}
//       minSize={[280, 400, 250]}
//       gutterSize={6}
//       expandToMin={false}
//     >
//       {/* VIDEO PANEL */}
//       <div className="video-panel">

//         <button
//           className="video-back-btn"
//           onClick={() => navigate(-1)}
//         >
//           ← Back to Topics
//         </button>

//         <div className="video-frame">
//           {loadingVideo ? (
//             <div className="video-loading">
//               Loading video...
//             </div>
//           ) : currentVideo ? (
//             <iframe
//               width="100%"
//               height="100%"
//               src={`https://www.youtube.com/embed/${
//                 currentVideo.videoId ||
//                 currentVideo.video_id
//               }`}
//               title="Lesson Video"
//               frameBorder="0"
//               allowFullScreen
//             />
//           ) : (
//             <div className="video-loading">
//               No video found.
//             </div>
//           )}
//         </div>

//       </div>

//         {/* EDITOR PANEL */}
//         <div className="editor-panel">

//           <div className="editor-header">
//             <select value={selectedLang.id} onChange={(e) => handleLanguageChange(e.target.value)}>
//               {LANGUAGES.map((lang) => (
//                 <option key={lang.id} value={lang.id}>
//                   {lang.name}
//                 </option>
//               ))}
//             </select>

//             <div className="editor-actions">
//               <button className="run-btn" onClick={handleRun}>
//                 Run
//               </button>

//               <div className="editor-tabs">
//                 {tabs.map((tab) => (
//                   <div
//                     key={tab.id}
//                     className={`tab-btn ${activeTab === tab.id ? "active-tab" : ""}`}
//                     onClick={() => setActiveTab(tab.id)}
//                   >
//                     <span className="tab-name">{tab.name}</span>

//                     <button
//                       className="tab-close"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDeleteTab(tab.id);
//                       }}
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}

//                 <button className="add-tab-btn" onClick={handleAddTab}>
//                   +
//                 </button>
//               </div>
//             </div>
//           </div>

//           <Split direction="vertical" className="editor-terminal-split" sizes={[75, 25]} minSize={[200, 100]} gutterSize={6}>

//             <div className="editor-wrapper">
//               <Editor
//                 height="100%"
//                 theme="custom-dark"
//                 beforeMount={handleEditorBeforeMount}
//                 language={selectedLang.monaco}
//                 value={currentTab?.code || ""}
//                 onChange={(value) => {
//                   setTabs((prev) =>
//                     prev.map((tab) =>
//                       tab.id === activeTab
//                         ? { ...tab, code: value || "" }
//                         : tab
//                     )
//                   );
//                 }}
//                 options={{
//                   minimap: { enabled: false },
//                   fontSize: 18,
//                   lineHeight: 30,
//                   scrollBeyondLastLine: false,
//                   automaticLayout: true,
//                 }}
//               />
//             </div>

//             <div className="output-panel">
//               {output || "Run your code to see output here."}
//             </div>

//           </Split>
//         </div>

//         {/* CHAT PANEL */}
//         <div className="chat-panel">

//           <div ref={historyRef} className={`history-panel ${showHistory ? "open" : ""}`}>
//             <div className="history-header">
//               <h3>Chat History</h3>
//               <button onClick={handleNewChat}>+ New</button>
//             </div>

//                               {conversations.map((conv) => (
//                     <div key={conv.id} className="history-item">
                      
//                       <span
//                         onClick={() => {
//                           setActiveConversationId(conv.id);
//                           setShowHistory(false);
//                         }}
//                       >
//                         {conv.title}
//                       </span>

//                       <button
//                         className="menu-btn"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setOpenMenuId((prev) =>
//                             prev === conv.id ? null : conv.id
//                           );
//                         }}
//                       >
//                         ⋮
//                       </button>

//                       {openMenuId === conv.id && (
//                         <div className="menu-dropdown">
//                           <button onClick={() => handleRename(conv.id)}>
//                             Rename
//                           </button>
//                           <button onClick={() => handleDelete(conv.id)}>
//                             Delete
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//           </div>

//           <div className="chat-header">
//             <button onClick={() => setShowHistory(!showHistory)}>☰</button>
//             <h3>Your AI Assistant</h3>
//             <img className="Ca-logo" src={logo} alt="Logo" />
//           </div>

//           <div className="chat-messages" ref={chatContainerRef}>
//             {messages.map((msg, i) => (
//               <div
//                 key={i}
//                 className={msg.role === "ai" ? "ai-message" : "user-message"}
//               >
//                 {msg.content}
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>

//           <div className="chat-input-area">
//             <input
//               value={chatInput}
//               placeholder="Ask anything..."
//               onChange={(e) => setChatInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
//             />

//             <button className="chat-send-btn" onClick={handleSendMessage}>
//               Send
//             </button>
//           </div>

//                </div> {/* chat-panel */}

//       </Split>

//       {hintOpen && (
//         <div
//           className="hint-overlay"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="hint-modal-title"
//           onClick={() => setHintOpen(false)}
//         >
//           <div
//             className="hint-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="hint-modal-header">
//               <div>
//                 <p className="hint-eyebrow">AST Hints</p>
//                 <h2 id="hint-modal-title">
//                   Friendly feedback for your code
//                 </h2>
//               </div>

//               <button
//                 type="button"
//                 className="hint-close-btn"
//                 onClick={() => setHintOpen(false)}
//                 aria-label="Close hints"
//               >
//                 Close
//               </button>
//             </div>

//             {hintLoading ? (
//               <div className="hint-state">
//                 Analyzing your code...
//               </div>
//             ) : hintError ? (
//               <div className="hint-state hint-error">
//                 {hintError}
//               </div>
//             ) : hintFeedback ? (
//               <div className="hint-content">

//                 {hintFeedback.intent?.length > 0 && (
//                   <section className="hint-section">
//                     <h3>What the code is trying to do</h3>
//                     <ul>
//                       {hintFeedback.intent.map((item, index) => (
//                         <li key={`intent-${index}`}>
//                           {item}
//                         </li>
//                       ))}
//                     </ul>
//                   </section>
//                 )}

//                 {hintFeedback.problems?.length > 0 && (
//                   <section className="hint-section">
//                     <h3>What went wrong</h3>
//                     <ul>
//                       {hintFeedback.problems.map((item, index) => (
//                         <li key={`problem-${index}`}>
//                           {item}
//                         </li>
//                       ))}
//                     </ul>
//                   </section>
//                 )}

//                 {hintFeedback.fixes?.length > 0 && (
//                   <section className="hint-section">
//                     <h3>Exact fix</h3>
//                     <ul>
//                       {hintFeedback.fixes.map((item, index) => (
//                         <li key={`fix-${index}`}>
//                           {item}
//                         </li>
//                       ))}
//                     </ul>
//                   </section>
//                 )}

//                 {!hintFeedback.intent?.length &&
//                   !hintFeedback.problems?.length &&
//                   !hintFeedback.fixes?.length && (
//                     <div className="hint-state">
//                       No specific issue could be inferred from the AST alone.
//                     </div>
//                   )}

//               </div>
//             ) : (
//               <div className="hint-state">
//                 No hints available yet. Click Hints again after making changes.
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useNavigate, useLocation } from "react-router-dom";
import "./Videolesson.css";
import logo from "./assets/Code along_logo-04.png";
import { buildLearnerFeedback } from "./learnerFeedback";

/* ================= LANGUAGES ================= */
const LANGUAGES = [
  { id: 63, name: "JavaScript", monaco: "javascript" },
  { id: 71, name: "Python", monaco: "python" },
  { id: 62, name: "Java", monaco: "java" },
  { id: 54, name: "C++", monaco: "cpp" },
  { id: 50, name: "C", monaco: "c" },
  { id: 51, name: "C#", monaco: "csharp" },
  { id: 60, name: "Go", monaco: "go" },
  { id: 72, name: "Ruby", monaco: "ruby" },
  { id: 73, name: "Rust", monaco: "rust" },
];

/* ================= TEMPLATES ================= */
const CODE_TEMPLATES = {
  javascript: "// Write your code here\n",
  python: "# Write Python here\n",
  java: "// Write Java code here\n",
  cpp: "// Write C++ code here\n",
  c: "// Write C code here\n",
  csharp: "// Write C# code here\n",
  go: "// Write Go code here\n",
  ruby: "# Write Ruby code here\n",
  rust: "// Write Rust code here\n",
};

/* ================= HINT MODAL ================= */
function HintModal({ open, onClose, loading, feedback, error }) {
  if (!open) return null;

  return (
    <div
      className="hint-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-modal-title"
      onClick={onClose}
    >
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="hint-modal-header">
          <div>
            <p className="hint-eyebrow">Code Insight</p>
            <h2 id="hint-modal-title">What your code is doing</h2>
          </div>
          <button
            type="button"
            className="hint-close-btn"
            onClick={onClose}
            aria-label="Close hints"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="hint-state">
            <div className="hint-spinner" />
            <span>Reading your workspace…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="hint-state hint-error">
            <span className="hint-state-icon">⚠</span>
            {error}
          </div>
        )}

        {/* Empty code */}
        {!loading && !error && !feedback && (
          <div className="hint-state">
            <span className="hint-state-icon">✏️</span>
            Write some code first, then click Hint to get feedback.
          </div>
        )}

        {/* Feedback */}
        {!loading && !error && feedback && (
          <div className="hint-content">

            {/* What the learner was trying to do */}
            {feedback.intent?.length > 0 && (
              <section className="hint-section hint-section--intent">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--blue" />
                  What you were trying to do
                </div>
                <ul className="hint-list">
                  {feedback.intent.map((item, i) => (
                    <li key={`intent-${i}`}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* What was detected / done right */}
            {feedback.strengths?.length > 0 && (
              <section className="hint-section hint-section--strengths">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--green" />
                  What you did
                </div>
                <ul className="hint-list">
                  {feedback.strengths.map((item, i) => (
                    <li key={`strength-${i}`}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* What went wrong */}
            {feedback.problems?.length > 0 && (
              <section className="hint-section hint-section--problems">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--amber" />
                  What to check
                </div>
                <ul className="hint-list">
                  {feedback.problems.map((item, i) => (
                    <li key={`problem-${i}`}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Exact fixes */}
            {feedback.fixes?.length > 0 && (
              <section className="hint-section hint-section--fixes">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--purple" />
                  What to add to make it work
                </div>
                <ul className="hint-list hint-list--fixes">
                  {feedback.fixes.map((item, i) => (
                    <li key={`fix-${i}`}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Cross-tab note */}
            {feedback.crossTabNote && (
              <div className="hint-cross-tab-note">
                <span className="hint-cross-tab-icon">⇄</span>
                {feedback.crossTabNote}
              </div>
            )}

            {/* Completely clean slate */}
            {!feedback.intent?.length &&
              !feedback.strengths?.length &&
              !feedback.problems?.length &&
              !feedback.fixes?.length && (
                <div className="hint-state">
                  No structural issues detected — your code looks well-formed.
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function Videolesson() {
  const navigate = useNavigate();
  const location = useLocation();

  const video = location.state?.video;
  const moduleId = location.state?.moduleId;
  const topic = location.state?.topic;

  const [currentVideo, setCurrentVideo] = useState(video || null);
  const [, setVideos] = useState([]);
  // If a video was passed via navigation state we already have it — skip the loading screen
  const [loadingVideo, setLoadingVideo] = useState(!video);

  /* ================= REFS ================= */
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const historyRef = useRef(null);

  /* ================= STATE ================= */
  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSystemPrompt, setChatSystemPrompt] = useState(null);

  // Skip-video popup: shown when pretest score >= 70%
  const [showSkipPopup, setShowSkipPopup] = useState(
    () => location.state?.canSkipVideo === true
  );
  // Shown after challenge passes and next topic is unlocked
  const [progressionResult, setProgressionResult] = useState(null);

  // Hint state
  const [hintLoading, setHintLoading] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintFeedback, setHintFeedback] = useState(null);
  const [hintError, setHintError] = useState("");

  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: "Tab 1",
      language: LANGUAGES[0],
      code: CODE_TEMPLATES.javascript,
    },
  ]);

  const [activeTab, setActiveTab] = useState(1);

  const [conversations, setConversations] = useState(() => {
    const title = topic?.title || video?.title || "New Chat";
    return [
      {
        id: 1,
        title,
        messages: [
          {
            role: "ai",
            content: `Hi 👋 I'm your AI assistant for this lesson${topic?.title ? ` on **${topic.title}**` : ""}. Ask me anything about the video, the concepts, or your code.`,
          },
        ],
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ================= DERIVED VALUES ================= */
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const selectedLang = currentTab?.language || LANGUAGES[0];
  const code = currentTab?.code || "";

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const messages = useMemo(
    () => activeConversation?.messages || [],
    [activeConversation]
  );

  /* ================= MONACO ================= */
  const handleEditorBeforeMount = useCallback((monacoInstance) => {
    monacoInstance.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0f172a",
        "editorSuggestWidget.background": "#0f172a",
        "editorSuggestWidget.foreground": "#e2e8f0",
        "editorSuggestWidget.selectedBackground": "#2563eb",
        "editorSuggestWidget.border": "#334155",
        "editorSuggestWidget.highlightForeground": "#60a5fa",
      },
    });
  }, []);

  /* ================= HINT ================= */
  const handleHint = useCallback(async () => {
    // Guard: need at least one tab with real code
    const nonEmptyTabs = tabs.filter((tab) => tab.code?.trim().length > 0);
    if (nonEmptyTabs.length === 0) {
      setHintFeedback(null);
      setHintError("Write some code first before asking for a hint.");
      setHintOpen(true);
      return;
    }

    setHintOpen(true);
    setHintLoading(true);
    setHintFeedback(null);
    setHintError("");

    try {
      const response = await fetch("/api/ast/workspace/parse", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabs: tabs.map((tab) => ({
            tab_id: tab.id,
            name: tab.name,
            source_code: tab.code || "",
            language_id: tab.language.id,
          })),
          topic_id: topic?.id || null,
          topic_title: topic?.title || "",
          analysis_options: {},
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      // Pull the per-workspace feedback, then enrich it with
      // learnerFeedback for the active tab's diagnostics
      const workspaceFeedback = data.workspace?.feedback || {};
      const activeTabResult = data.tabs?.find((t) => t.tabId === activeTab);

      const localFeedback = buildLearnerFeedback({
        compileOutput: "",
        stderr: "",
        diagnostics: activeTabResult?.diagnostics || [],
        summary: activeTabResult?.normalizedAst?.summary || {},
        ast: activeTabResult?.normalizedAst?.ast || null,
        languageKey: selectedLang.monaco,
      });

      // Merge: workspace gives cross-tab context, localFeedback gives
      // intent/problems/fixes for the active tab code specifically
      setHintFeedback({
        // "What you were trying to do" — prefer local intent, fall back to workspace summary
        intent: localFeedback.intent?.length
          ? localFeedback.intent
          : workspaceFeedback.summary
          ? [workspaceFeedback.summary]
          : [],

        // "What you did" — confirmed strengths from workspace concept detection
        strengths: workspaceFeedback.strengths?.length
          ? workspaceFeedback.strengths.map((s) => s.message)
          : localFeedback.strengths || [],

        // "What to check" — local problems first, then workspace gaps
        problems: [
          ...(localFeedback.problems || []),
          ...(workspaceFeedback.gaps?.map((g) => g.message) || []),
        ].filter(Boolean),

        // "What to add to make it work" — local fixes + workspace suggestions
        fixes: [
          ...(localFeedback.fixes || []),
          ...(workspaceFeedback.suggestions?.map((s) => s.message) || []),
        ].filter(Boolean),

        // Cross-tab structural note (only shown when there are multiple tabs)
        crossTabNote: tabs.length > 1 ? workspaceFeedback.crossTabNote : null,
      });
    } catch (error) {
      console.error("Hint error:", error);
      setHintError(
        error.message || "Could not analyze your workspace. Try again in a moment."
      );
    } finally {
      setHintLoading(false);
    }
  }, [tabs, activeTab, selectedLang.monaco, topic]);

  /* ================= CHAT ================= */
  const handleSendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const userMsg = { role: "user", content: trimmed };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, userMsg] }
          : conv
      )
    );
    setChatInput("");
    setChatLoading(true);

    try {
      const systemPrompt = chatSystemPrompt ||
        (topic?.title
          ? `You are a helpful coding tutor assisting a student learning "${topic.title}". Answer questions about the lesson, explain concepts clearly, and help debug code. Be concise and educational.`
          : "You are a helpful coding tutor. Answer questions about programming concepts and help debug code. Be concise and educational.");

      const response = await fetch("/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, options: { systemPrompt } }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to get a response");

      const aiMsg = { role: "ai", content: data.message };
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, aiMsg] }
            : conv
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, { role: "ai", content: "Sorry, I couldn't get a response. Please try again." }] }
            : conv
        )
      );
    } finally {
      setChatLoading(false);
    }
  };

  /* ================= CHAT HELPERS ================= */
  const getChatTitle = () => {
    return topic?.title || video?.title || "New Chat";
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: getChatTitle(),
      messages: [
        { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
      ],
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newChat.id);
    setShowHistory(false);
  };

  const handleRename = (id) => {
    const name = prompt("Rename chat:");
    if (!name) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: name } : c))
    );
  };

  const handleDelete = (id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeConversationId === id && updated.length > 0) {
        setActiveConversationId(updated[0].id);
      }
      return updated;
    });
  };

  /* ================= EDITOR ================= */
  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((l) => l.id === Number(id));
    if (!lang) return;

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, language: lang, code: CODE_TEMPLATES[lang.monaco] }
          : tab
      )
    );

    setOutput("");
    setHintFeedback(null);
    setHintError("");
  };

  const handleRun = () => {
    const runCode = async () => {
      setOutput("Executing your code...");

      try {
        const response = await fetch("/compile-poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLang.id,
            stdin: "",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Execution failed");
        }

        const result = data.data;

        setOutput(
          result.stdout ||
            result.stderr ||
            result.compile_output ||
            result.status?.description ||
            "No output"
        );
      } catch (error) {
        console.error(error);
        setOutput(error.message || "Unable to run code");
      }
    };

    runCode();
  };

  const handleAddTab = () => {
    const newTab = {
      id: Date.now(),
      name: `Tab ${tabs.length + 1}`,
      language: LANGUAGES[0],
      code: CODE_TEMPLATES.javascript,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTab.id);
  };

  const handleDeleteTab = (tabId) => {
    setTabs((prev) => {
      const updated = prev.filter((tab) => tab.id !== tabId);
      if (activeTab === tabId && updated.length > 0) {
        setActiveTab(updated[0].id);
      }
      return updated;
    });
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    const fetchVideos = async () => {
      if (!moduleId) return;

      try {
        setLoadingVideo(true);

        const response = await fetch(`/api/videos/module/${moduleId}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load videos");
        }

        setVideos(data.videos || []);

        const firstVideo = data.videos?.find((v) => v.video);
        if (firstVideo) {
          setCurrentVideo(firstVideo.video);
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoadingVideo(false);
      }
    };

    fetchVideos();
  }, [moduleId]);

  // Build a video-aware system prompt for the chat whenever the video changes
  useEffect(() => {
    if (!currentVideo) return;
    const buildVideoContext = async () => {
      try {
        const response = await fetch("/chat/video-context", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video: currentVideo, topic }),
        });
        const data = await response.json();
        if (data.success && data.systemPrompt) {
          setChatSystemPrompt(data.systemPrompt);
        }
      } catch (error) {
        console.error("Failed to build video context for chat:", error);
      }
    };
    buildVideoContext();
  }, [currentVideo, topic]);

  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => (c.title?.trim() ? c : { ...c, title: "New Chat" }))
    );
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHistory && historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }

      if (openMenuId) {
        const isInsideMenu = e.target.closest(".menu-dropdown");
        const isMenuButton = e.target.closest(".menu-btn");
        if (!isInsideMenu && !isMenuButton) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHistory, openMenuId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setHintOpen(false);
    };

    if (hintOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [hintOpen]);

  /* ================= RENDER ================= */
  return (
    <div className="Videolesson-container">

      {/* ── Skip-Video Popup ──────────────────────────────────────────────── */}
      {showSkipPopup && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#1e293b", borderRadius: 16, padding: 36, maxWidth: 440,
            width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <h2 style={{ color: "#f1f5f9", marginBottom: 8 }}>You already know this!</h2>
            <p style={{ color: "#94a3b8", marginBottom: 8 }}>
              Your prior knowledge quiz shows strong familiarity with{" "}
              <strong style={{ color: "#e2e8f0" }}>{topic?.title || "this topic"}</strong>.
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              You can skip the video and go straight to the coding challenge.
              You still need to <strong style={{ color: "#f59e0b" }}>pass the challenge</strong> to unlock the next topic.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => {
                  setShowSkipPopup(false);
                  navigate("/challenges", { state: { moduleId, topic } });
                }}
                style={{
                  background: "#6366f1", color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600
                }}
              >
                Skip to Challenge →
              </button>
              <button
                onClick={() => setShowSkipPopup(false)}
                style={{
                  background: "#334155", color: "#cbd5e1", border: "none",
                  borderRadius: 8, padding: "10px 20px", cursor: "pointer"
                }}
              >
                Watch Video Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Progression Banner ────────────────────────────────────────────── */}
      {progressionResult && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
          background: "linear-gradient(90deg, #16a34a, #15803d)",
          color: "#fff", padding: "14px 24px",
          display: "flex", alignItems: "center", gap: 16
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <strong>Topic Mastered!</strong>{" "}
            {progressionResult.unlockedTopicId
              ? "The next topic has been unlocked."
              : "You've completed this module!"}
          </div>
          <button
            onClick={() => { setProgressionResult(null); navigate("/MyLessons"); }}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6,
              color: "#fff", padding: "6px 14px", cursor: "pointer", fontWeight: 600
            }}
          >
            Back to Lessons →
          </button>
          <button
            onClick={() => setProgressionResult(null)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>
      )}

      <Split
        className="Videolesson-layout"
        sizes={[35, 40, 25]}
        minSize={[280, 400, 250]}
        gutterSize={6}
        expandToMin={false}
      >
        {/* VIDEO PANEL */}
        <div className="video-panel">
          <button className="video-back-btn" onClick={() => navigate(-1)}>
            ← Back to Topics
          </button>

          <div className="video-frame">
            {loadingVideo ? (
              <div className="video-loading">Loading video...</div>
            ) : currentVideo ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${
                  currentVideo.videoId || currentVideo.video_id
                }`}
                title="Lesson Video"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div className="video-loading">No video found.</div>
            )}
          </div>
        </div>

        {/* EDITOR PANEL */}
        <div className="editor-panel">
          <div className="editor-header">
            <select
              value={selectedLang.id}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            <div className="editor-actions">
              <button className="run-btn" onClick={handleRun}>
                Run
              </button>

              {/* ─── HINT BUTTON ─── */}
              <button
                className={`hint-btn${hintLoading ? " hint-btn--loading" : ""}`}
                onClick={handleHint}
                disabled={hintLoading}
                title="Get a friendly insight into what your code is doing"
              >
                {hintLoading ? (
                  <>
                    <span className="hint-btn-spinner" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <span className="hint-btn-icon">💡</span>
                    Hint
                  </>
                )}
              </button>
            </div>

            <div className="editor-tabs">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? "active-tab" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-name">{tab.name}</span>
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTab(tab.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button className="add-tab-btn" onClick={handleAddTab}>
                +
              </button>
            </div>
          </div>

          <Split
            direction="vertical"
            className="editor-terminal-split"
            sizes={[75, 25]}
            minSize={[200, 100]}
            gutterSize={6}
          >
            <div className="editor-wrapper">
              <Editor
                height="100%"
                theme="custom-dark"
                beforeMount={handleEditorBeforeMount}
                language={selectedLang.monaco}
                value={currentTab?.code || ""}
                onChange={(value) => {
                  setTabs((prev) =>
                    prev.map((tab) =>
                      tab.id === activeTab
                        ? { ...tab, code: value || "" }
                        : tab
                    )
                  );
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 18,
                  lineHeight: 30,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            <div className="output-panel">
              {output || "Run your code to see output here."}
            </div>
          </Split>
        </div>

        {/* CHAT PANEL */}
        <div className="chat-panel">
          <div
            ref={historyRef}
            className={`history-panel ${showHistory ? "open" : ""}`}
          >
            <div className="history-header">
              <h3>Chat History</h3>
              <button onClick={handleNewChat}>+ New</button>
            </div>

            {conversations.map((conv) => (
              <div key={conv.id} className="history-item">
                <span
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setShowHistory(false);
                  }}
                >
                  {conv.title}
                </span>

                <button
                  className="menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId((prev) =>
                      prev === conv.id ? null : conv.id
                    );
                  }}
                >
                  ⋮
                </button>

                {openMenuId === conv.id && (
                  <div className="menu-dropdown">
                    <button onClick={() => handleRename(conv.id)}>Rename</button>
                    <button onClick={() => handleDelete(conv.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-header">
            <button onClick={() => setShowHistory(!showHistory)}>☰</button>
            <h3>Your AI Assistant</h3>
            <img className="Ca-logo" src={logo} alt="Logo" />
          </div>

          <div className="chat-messages" ref={chatContainerRef}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "ai" ? "ai-message" : "user-message"}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              value={chatInput}
              placeholder={chatLoading ? "Waiting for response..." : "Ask anything..."}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={chatLoading}
            />
            <button className="chat-send-btn" onClick={handleSendMessage} disabled={chatLoading}>
              {chatLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </Split>

      {/* ─── HINT MODAL ─── */}
      <HintModal
        open={hintOpen}
        onClose={() => setHintOpen(false)}
        loading={hintLoading}
        feedback={hintFeedback}
        error={hintError}
      />
    </div>
  );
}
